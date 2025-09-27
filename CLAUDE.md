# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension (Manifest V3) that enables text highlighting on web pages with persistent storage. The extension consists of:

- **Content Script** (`content.js`): Main highlighting functionality using a `TextHighlighter` class
- **Background Service Worker** (`background.js`): Handles storage operations and message passing
- **Popup Interface** (`popup.html/js`): Extension popup for managing highlights
- **Styling** (`highlight.css`): CSS for highlight appearance and UI elements

## Architecture

### Core Components

1. **TextHighlighter Class** (`content.js`):
   - Manages text selection and highlighting on web pages
   - Uses XPath-based element location for reliable highlight restoration
   - Handles keyboard shortcuts (Ctrl+H) and mouse interactions
   - Stores highlights with unique IDs and URL mapping

2. **Storage System** (`background.js`):
   - Uses Chrome Storage API for persistent data storage
   - Manages highlight CRUD operations
   - Handles cross-tab communication via message passing

3. **Popup Management** (`popup.js`):
   - Displays highlights for current page and all pages
   - Provides export functionality (JSON format)
   - Includes clear all highlights option

### Key Technical Details

- **Highlight Storage**: Each highlight includes `id`, `url`, `text`, `xpath`, `timestamp`
- **XPath Location**: Uses XPath expressions to precisely locate and restore highlights
- **Message Passing**: Content script communicates with background script for storage operations
- **Cross-site Compatibility**: Content script injected on all URLs (`*://*/*`)

## Development

### Testing the Extension

1. Load extension in Chrome:
   ```
   chrome://extensions/ → Enable Developer mode → Load unpacked
   ```

2. Test highlighting functionality:
   - Select text on any webpage
   - Use Ctrl+H or click highlight button
   - Verify highlights persist after page reload
   - Test popup interface for managing highlights

### Debugging

- Use Chrome DevTools Console for content script debugging
- Background script logs available in extension service worker console
- Popup debugging via popup inspection tools

### File Modifications

When modifying the extension:
- **Content Script changes**: Reload extension in chrome://extensions
- **Background Script changes**: Reload extension
- **Popup changes**: Close and reopen popup
- **CSS changes**: Reload extension and refresh affected pages

### Storage Structure

Highlights are stored in Chrome local storage as:
```javascript
{
  highlights: {
    [highlightId]: {
      id: string,
      url: string,
      text: string,
      xpath: string,
      timestamp: number
    }
  }
}
```