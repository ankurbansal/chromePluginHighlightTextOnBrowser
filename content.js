class TextHighlighter {
  constructor() {
    this.highlights = new Map();
    this.isSelecting = false;
    this.currentSelection = null;
    this.init();
  }

  init() {
    this.loadHighlights();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('click', (e) => this.handleClick(e));
  }


  /**
   * Handles keyboard events to trigger text highlighting
   * Listens for Ctrl+H combination to highlight selected text
   * @param {KeyboardEvent} e - The keyboard event object
   */
  handleKeyDown(e) {
    // Check if user pressed Ctrl+H combination
    if (e.key === 'h' && e.ctrlKey) {
      // Prevent browser's default Ctrl+H behavior (usually opens history)
      e.preventDefault();
      // Trigger the highlighting functionality
      this.highlightSelection();
    }
  }

  /**
   * Handles click events to show/hide highlight tooltips
   * Shows tooltip when clicking on highlighted text, hides when clicking elsewhere
   * @param {MouseEvent} e - The click event object
   */
  handleClick(e) {
    // Check if the clicked element is a highlighted text
    if (e.target.classList.contains('text-highlight')) {
      // Show tooltip with removal instructions
      this.showHighlightTooltip(e.target, e);
    } else {
      // Hide any existing tooltips when clicking elsewhere
      this.hideHighlightTooltip();
    }
  }


  /**
   * Processes the current text selection and creates a highlight
   * Validates that text is actually selected before proceeding
   */
  highlightSelection() {
    // Get the current text selection from the browser
    const selection = window.getSelection();
    
    // Check if there's a valid selection (not empty and has content)
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      // Get the first (and usually only) range from the selection
      const range = selection.getRangeAt(0);
      // Extract the selected text and remove whitespace
      const selectedText = selection.toString().trim();

      // Only proceed if there's actual text selected
      if (selectedText.length > 0) {
        // Create the visual highlight and save the data
        this.createHighlight(range, selectedText);
        // Clear the selection after highlighting
        selection.removeAllRanges();
      }
    }
  }

  /**
   * Creates a visual highlight by wrapping selected text in a span element
   * Saves highlight data to storage and sets up removal functionality
   * @param {Range} range - The DOM range containing the selected text
   * @param {string} text - The actual text content that was selected
   */
  createHighlight(range, text) {
    try {
      // Generate a unique identifier for this highlight
      const highlightId = this.generateId();
      
      // Create a span element to wrap the selected text
      const span = document.createElement('span');
      span.className = 'text-highlight'; // CSS class for styling
      span.setAttribute('data-highlight-id', highlightId); // Unique identifier
      span.setAttribute('title', 'Click to remove highlight'); // Tooltip text

      // Wrap the selected text with the span element
      range.surroundContents(span);

      // Create metadata object to store highlight information
      const highlightData = {
        id: highlightId,
        text: text,
        url: window.location.href, // Current page URL
        xpath: this.getXPath(span), // DOM path for restoration
        timestamp: Date.now() // When the highlight was created
      };

      // Store highlight in memory for quick access
      this.highlights.set(highlightId, highlightData);
      
      // Save highlight to persistent storage (Chrome extension storage)
      this.saveHighlight(highlightData, (error) => {
        if (error) {
          console.error('Failed to save highlight:', error);
        }
      });

      // Add double-click event listener to remove the highlight
      span.addEventListener('dblclick', () => this.removeHighlight(highlightId));

    } catch (error) {
      console.error('Failed to create highlight:', error);
    }
  }

  /**
   * Removes a highlight from both DOM and storage
   * Unwraps the span element and restores original text structure
   * @param {string} highlightId - The unique identifier of the highlight to remove
   */
  removeHighlight(highlightId) {
    // Find the highlight element in the DOM using its unique ID
    const element = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    
    if (element) {
      const parent = element.parentNode;
      
      // Move all child nodes (the actual text) out of the span element
      // This effectively "unwraps" the highlight span
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      
      // Remove the empty span element from the DOM
      parent.removeChild(element);
      
      // Normalize the DOM to merge adjacent text nodes
      parent.normalize();
    }

    // Remove highlight from memory
    this.highlights.delete(highlightId);
    
    // Remove highlight from persistent storage
    this.deleteHighlight(highlightId);
  }

  /**
   * Shows a tooltip on highlighted text with removal instructions
   * @param {HTMLElement} element - The highlighted element to show tooltip on
   * @param {MouseEvent} event - The click event (currently unused but available)
   */
  showHighlightTooltip(element, event) {
    // Remove any existing tooltips first
    this.hideHighlightTooltip();

    // Create a new tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'highlight-tooltip';
    tooltip.textContent = 'Double-click to remove';
    tooltip.style.display = 'block';

    // Append tooltip to the highlighted element
    element.appendChild(tooltip);
  }

  /**
   * Removes all highlight tooltips from the page
   * Called when clicking outside of highlighted text
   */
  hideHighlightTooltip() {
    // Find all existing tooltips
    const tooltips = document.querySelectorAll('.highlight-tooltip');
    // Remove each tooltip from the DOM
    tooltips.forEach(tooltip => tooltip.remove());
  }

  /**
   * Loads all saved highlights from Chrome storage and restores them on the current page
   * Only restores highlights that belong to the current URL
   */
  async loadHighlights() {
    try {
      // Retrieve all highlights from Chrome extension storage
      const result = await chrome.storage.local.get('highlights');
      const allHighlights = result.highlights || {};
      
      // Get the current page URL to filter relevant highlights
      const currentUrl = window.location.href;

      // Filter highlights to only include those from the current page
      const pageHighlights = Object.values(allHighlights).filter(
        highlight => highlight.url === currentUrl
      );

      // Restore each highlight by recreating the visual elements
      pageHighlights.forEach(highlight => {
        this.restoreHighlight(highlight);
      });
    } catch (error) {
      console.error('Failed to load highlights:', error);
    }
  }

  /**
   * Restores a previously saved highlight by recreating the visual elements
   * Uses XPath to locate the original text and wraps it with highlight span
   * @param {Object} highlightData - The saved highlight data to restore
   */
  restoreHighlight(highlightData) {
    try {
      // Find the DOM element using the saved XPath
      const element = this.getElementByXPath(highlightData.xpath);
      
      // Verify the element exists and still contains the original text
      if (element && element.textContent.includes(highlightData.text)) {
        // Find the specific text node containing our highlighted text
        const textNode = this.findTextNode(element, highlightData.text);
        
        if (textNode) {
          // Create a new range to select the text
          const range = document.createRange();
          const startIndex = textNode.textContent.indexOf(highlightData.text);
          
          if (startIndex !== -1) {
            // Set the range boundaries to match the original selection
            range.setStart(textNode, startIndex);
            range.setEnd(textNode, startIndex + highlightData.text.length);

            // Create the highlight span element
            const span = document.createElement('span');
            span.className = 'text-highlight';
            span.setAttribute('data-highlight-id', highlightData.id);
            span.setAttribute('title', 'Click to remove highlight');

            // Wrap the text with the highlight span
            range.surroundContents(span);
            
            // Add to memory for quick access
            this.highlights.set(highlightData.id, highlightData);

            // Add double-click removal functionality
            span.addEventListener('dblclick', () => this.removeHighlight(highlightData.id));
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore highlight:', error);
    }
  }

  /**
   * Finds the text node containing the specified text within an element
   * Uses TreeWalker to traverse only text nodes for efficiency
   * @param {HTMLElement} element - The parent element to search within
   * @param {string} text - The text to search for
   * @returns {Text|null} The text node containing the text, or null if not found
   */
  findTextNode(element, text) {
    // Create a TreeWalker that only visits text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT, // Only traverse text nodes
      null,
      false
    );

    let node;
    // Walk through each text node
    while (node = walker.nextNode()) {
      // Check if this text node contains our target text
      if (node.textContent.includes(text)) {
        return node;
      }
    }
    return null;
  }

  /**
   * Saves highlight data to Chrome extension's local storage
   * Retrieves existing highlights, adds new one, and saves back to storage
   * @param {Object} highlightData - The highlight data object to save
   */
  async saveHighlight(highlightData) {
    try {
      // Get all existing highlights from Chrome storage
      const result = await chrome.storage.local.get('highlights');
      // Initialize empty object if no highlights exist yet
      const highlights = result.highlights || {};
      
      // Add the new highlight to the existing highlights collection
      highlights[highlightData.id] = highlightData;
      
      // Save the updated highlights back to Chrome storage
      await chrome.storage.local.set({ highlights });
    } catch (error) {
      console.error('Failed to save highlight:', error);
    }
  }

  async deleteHighlight(highlightId) {
    try {
      const result = await chrome.storage.local.get('highlights');
      const highlights = result.highlights || {};
      delete highlights[highlightId];
      await chrome.storage.local.set({ highlights });
    } catch (error) {
      console.error('Failed to delete highlight:', error);
    }
  }

  /**
   * Generates an XPath expression to uniquely identify a DOM element
   * Used for saving highlight locations so they can be restored later
   * @param {HTMLElement} element - The element to generate XPath for
   * @returns {string} XPath expression that uniquely identifies the element
   */
  getXPath(element) {
    // If element has an ID, use the simple ID-based XPath
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    // Build XPath by traversing up the DOM tree
    const parts = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      // Count preceding siblings with the same tag name
      let index = 0;
      let sibling = element.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      // Create XPath part with tag name and position index
      const tagName = element.tagName.toLowerCase();
      const pathPart = index > 0 ? `${tagName}[${index + 1}]` : tagName;
      parts.unshift(pathPart); // Add to beginning of array
      element = element.parentNode; // Move up to parent
    }

    // Join all parts with forward slashes to create full XPath
    return '/' + parts.join('/');
  }

  getElementByXPath(xpath) {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    } catch (error) {
      console.error('XPath evaluation failed:', error);
      return null;
    }
  }

  /**
   * Generates a unique identifier for highlights
   * Combines timestamp and random string to ensure uniqueness
   * @returns {string} A unique identifier string
   */
  generateId() {
    // Create unique ID using current timestamp + random string
    return 'highlight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.textHighlighter = new TextHighlighter();
  });
} else {
  window.textHighlighter = new TextHighlighter();
}