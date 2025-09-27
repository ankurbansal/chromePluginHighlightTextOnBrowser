# Text Highlighter Chrome Extension

A Chrome extension that allows users to highlight text on web pages and persistently store those highlights using Chrome's local storage API.

## Features

- **Text Highlighting**: Select text and highlight it with a single click or keyboard shortcut (Ctrl+H)
- **Persistent Storage**: Highlights are automatically saved and restored when you revisit pages
- **Easy Removal**: Double-click any highlight to remove it
- **Popup Interface**: Manage all your highlights from the extension popup
- **Export Functionality**: Export all highlights to a JSON file
- **Cross-page Management**: View highlights from all websites in one place

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the extension directory
4. The extension will be installed and ready to use

## Usage

### Creating Highlights
1. Select any text on a webpage
2. Click the "Highlight" button that appears, or press `Ctrl+H`
3. The text will be highlighted in yellow and automatically saved

### Managing Highlights
- **Remove a highlight**: Double-click on any highlighted text
- **View all highlights**: Click the extension icon in the toolbar
- **Export highlights**: Use the "Export All Highlights" button in the popup
- **Clear all highlights**: Use the "Clear All Highlights" button in the popup

### Keyboard Shortcuts
- `Ctrl+H`: Highlight selected text
- `Escape`: Hide the highlight option button

## Files Structure

- `manifest.json`: Extension configuration
- `content.js`: Main highlighting functionality
- `background.js`: Background service worker for data management
- `popup.html/js`: Extension popup interface
- `highlight.css`: Styling for highlights and UI elements

## Technical Details

- Uses Chrome Storage API for persistent data storage
- XPath-based element location for reliable highlight restoration
- Content script injection for cross-site compatibility
- Manifest V3 compliant

## Permissions

- `storage`: To save highlights persistently
- `activeTab`: To interact with the current tab
- `scripting`: To inject content scripts
- `host_permissions`: To work on all websites