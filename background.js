chrome.runtime.onInstalled.addListener(() => {
  console.log('Text Highlighter extension installed');

  chrome.contextMenus.create({
    id: 'highlight-text',
    title: 'Highlight selected text',
    contexts: ['selection']
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'highlight-text') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.textHighlighter) {
          window.textHighlighter.highlightSelection();
        }
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getHighlights') {
    chrome.storage.local.get('highlights').then((result) => {
      const highlights = result.highlights || {};
      const currentUrl = request.url;
      const pageHighlights = Object.values(highlights).filter(
        highlight => highlight.url === currentUrl
      );
      sendResponse({ highlights: pageHighlights });
    });
    return true;
  }

  if (request.action === 'deleteHighlight') {
    chrome.storage.local.get('highlights').then((result) => {
      const highlights = result.highlights || {};
      delete highlights[request.highlightId];
      chrome.storage.local.set({ highlights }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.action === 'exportHighlights') {
    chrome.storage.local.get('highlights').then((result) => {
      const highlights = result.highlights || {};
      sendResponse({ highlights: Object.values(highlights) });
    });
    return true;
  }
});