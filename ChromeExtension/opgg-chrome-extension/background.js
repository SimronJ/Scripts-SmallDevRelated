// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_LIFETIME_SPEND') {
        const { gameName, tagLine, region } = request.payload;
        fetch('https://api.lolvalue.com/fetch', {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'Referer': 'https://lolvalue.com/'
            },
            body: JSON.stringify({ gameName, tagLine, region })
        })
        .then(r => r.json())
        .then(data => {
            sendResponse({ success: true, data });
        })
        .catch(error => {
            sendResponse({ success: false, error: error.toString() });
        });
        // Indicate async response
        return true;
    }
    if (request.type === 'CAPTURE_CARD_SCREENSHOT') {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(dataUrl) {
            sendResponse(dataUrl);
        });
        return true;
    }
}); 