// Popup script for OP.GG Stats Card extension

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on an OP.GG page
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const statusElement = document.getElementById('status');
        
        if (currentTab.url && currentTab.url.includes('op.gg/lol')) {
            statusElement.textContent = '✅ Active on OP.GG';
            statusElement.style.background = '#4CAF50';
        } else {
            statusElement.textContent = 'ℹ️ Visit OP.GG to use';
            statusElement.style.background = '#FF9800';
        }
    });
}); 