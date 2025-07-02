# OP.GG Stats Card Chrome Extension

Adds a draggable stats card to OP.GG summoner pages with:
- Playtime tracking
- Laning win rate
- Lifetime spend (API fetch)
- Auto-scroll to load more games
- Share (screenshot) button
- Modern, compact UI
- Long names are truncated and can be expanded on click

## Usage
1. Install the extension in Chrome.
2. Visit an OP.GG summoner page.
3. The stats card appears on the page. Drag it, collapse it, or use the buttons as needed.
4. Click "View Lifetime Spend" to fetch your total playtime.
5. Use auto-scroll to load more games and improve stats.
6. Click the camera icon to copy a screenshot of the card.
7. Click on a long summoner name to expand and view the full name.

## Features
- Draggable and collapsible stats card
- Playtime, games, laning win rate, and top champion stats
- Fetch and display lifetime spend via API
- Auto-scroll to load more games
- Share (screenshot) button
- Modern, compact, and responsive UI
- Handles long summoner names with truncation and expand-on-click

---
For more details, see the code or open an issue.

## Installation

### Method 1: Chrome Web Store (Recommended)
1. Visit the Chrome Web Store (link will be added once published)
2. Click "Add to Chrome"
3. Confirm the installation

### Method 2: Manual Installation (Developer Mode)
1. Download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `opgg-chrome-extension` folder
5. The extension will now be installed and active

## How It Works

The extension analyzes the game history on OP.GG pages by:
- Parsing game duration timestamps
- Counting champion selections
- Analyzing laning scores (X:Y format)
- Tracking ranking positions
- Calculating win rates and averages

## File Structure

```
opgg-chrome-extension/
├── manifest.json          # Extension configuration
├── content.js            # Main script that runs on OP.GG pages
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Publishing to Chrome Web Store

To publish this extension to the Chrome Web Store:

1. **Create a Developer Account**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Pay the one-time $5 registration fee

2. **Prepare Your Extension**:
   - Create a ZIP file of the extension folder
   - Ensure all required icons are present
   - Test thoroughly on different OP.GG pages

3. **Submit for Review**:
   - Upload the ZIP file
   - Fill out the store listing information
   - Provide screenshots and descriptions
   - Submit for Google's review process

4. **Store Listing Requirements**:
   - High-quality screenshots (1280x800 or 640x400)
   - Detailed description
   - Privacy policy (if collecting data)
   - Clear feature list

## Privacy

This extension:
- Only runs on OP.GG domains
- Does not collect or transmit any personal data
- Stores settings locally using Chrome's storage API
- Does not track user behavior

## Development

### Local Development
1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test on OP.GG pages

### Building for Distribution
1. Create a ZIP file of the extension folder
2. Ensure all files are included
3. Test the ZIP by loading it as an unpacked extension

## Troubleshooting

**Extension not working?**
- Ensure you're on an OP.GG summoner page
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the page

**Stats not updating?**
- Use the "Auto Scroll" feature to load more games
- Wait for the page to fully load
- Check if the summoner has recent games

**Card not visible?**
- Look for the stats card on the page
- Try dragging it if it's off-screen
- Check if it's collapsed (click the `+` button)

## Contributing

Feel free to submit feedback and enhancement requests!

## License

MIT License - see LICENSE file for details

## Author

Created by SimronJ

## Version History

- **v1.2.0**: Chrome extension version with persistent settings
- **v1.1.0**: Added auto-scroll functionality
- **v1.0.0**: Initial Tampermonkey script release 