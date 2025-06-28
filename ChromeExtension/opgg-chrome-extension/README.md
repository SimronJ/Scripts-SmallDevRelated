# OP.GG Stats Card Chrome Extension

A Chrome extension that adds a draggable, collapsible stats card to OP.GG summoner pages with toggleable auto-scroll. Tracks playtime, games, laning win rate, and more.

## Features

- 📈 **Total Playtime & Games**: Automatically calculates total time spent and number of games
- 🏆 **Champion Statistics**: Shows your most played champion with detailed stats
- ⚔️ **Laning Analysis**: Tracks laning win rate for overall and per-champion performance
- 🥇 **Ranking Performance**: Displays average ranking across all games
- 🔄 **Auto-Scroll**: Automatically loads more games to get complete statistics
- 📱 **Draggable Interface**: Move the stats card anywhere on the screen
- 🔽 **Collapsible**: Minimize the card when not needed
- 💾 **Persistent Settings**: Your preferences are saved across browser sessions

## Installation

### Method 1: Chrome Web Store (Recommended)
1. Visit the Chrome Web Store (link will be added once published)
2. Click "Add to Chrome"
3. Confirm the installation

### Method 2: Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `opgg-chrome-extension` folder
5. The extension will now be installed and active

## Usage

1. Visit any OP.GG summoner page (e.g., `https://www.op.gg/summoners/na/username`)
2. The stats card will automatically appear on the page
3. Drag the card header to move it around
4. Click the `−` button to collapse/expand the card
5. Use the "Auto Scroll" button to automatically load more games for complete statistics

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

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details

## Author

Created by SimronJ

## Version History

- **v1.2.0**: Chrome extension version with persistent settings
- **v1.1.0**: Added auto-scroll functionality
- **v1.0.0**: Initial Tampermonkey script release 