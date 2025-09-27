document.addEventListener('DOMContentLoaded', async () => {
  await loadHighlights();
  setupEventListeners();
});

async function loadHighlights() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab.url;

    const result = await chrome.storage.local.get('highlights');
    const allHighlights = result.highlights || {};
    const highlights = Object.values(allHighlights);

    const pageHighlights = highlights.filter(h => h.url === currentUrl);

    updateStats(highlights.length, pageHighlights.length);
    displayHighlights(pageHighlights);

  } catch (error) {
    console.error('Error loading highlights:', error);
  }
}

function updateStats(total, page) {
  document.getElementById('total-highlights').textContent = total;
  document.getElementById('page-highlights').textContent = page;
}

function displayHighlights(highlights) {
  const container = document.getElementById('highlights-container');
  const emptyState = document.getElementById('empty-state');

  if (highlights.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  container.innerHTML = '';

  highlights.forEach(highlight => {
    const item = createHighlightItem(highlight);
    container.appendChild(item);
  });
}

function createHighlightItem(highlight) {
  const item = document.createElement('div');
  item.className = 'highlight-item';

  const text = document.createElement('div');
  text.className = 'highlight-text';
  text.textContent = highlight.text.length > 100
    ? highlight.text.substring(0, 100) + '...'
    : highlight.text;

  const meta = document.createElement('div');
  meta.className = 'highlight-meta';

  const urlSpan = document.createElement('span');
  urlSpan.className = 'highlight-url';
  urlSpan.textContent = new URL(highlight.url).hostname;
  urlSpan.title = highlight.url;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = () => deleteHighlight(highlight.id);

  const dateSpan = document.createElement('span');
  dateSpan.textContent = new Date(highlight.timestamp).toLocaleDateString();

  meta.appendChild(urlSpan);
  meta.appendChild(dateSpan);
  meta.appendChild(deleteBtn);

  item.appendChild(text);
  item.appendChild(meta);

  return item;
}

async function deleteHighlight(highlightId) {
  try {
    const result = await chrome.storage.local.get('highlights');
    const highlights = result.highlights || {};
    delete highlights[highlightId];
    await chrome.storage.local.set({ highlights });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, {
      action: 'removeHighlight',
      highlightId: highlightId
    });

    await loadHighlights();
  } catch (error) {
    console.error('Error deleting highlight:', error);
  }
}

function setupEventListeners() {
  document.getElementById('export-btn').addEventListener('click', exportHighlights);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllHighlights);
}

async function exportHighlights() {
  try {
    const result = await chrome.storage.local.get('highlights');
    const highlights = Object.values(result.highlights || {});

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      highlights: highlights
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlights-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exporting highlights:', error);
  }
}

async function clearAllHighlights() {
  if (confirm('Are you sure you want to delete all highlights? This action cannot be undone.')) {
    try {
      await chrome.storage.local.set({ highlights: {} });

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'clearAllHighlights' });

      await loadHighlights();
    } catch (error) {
      console.error('Error clearing highlights:', error);
    }
  }
}