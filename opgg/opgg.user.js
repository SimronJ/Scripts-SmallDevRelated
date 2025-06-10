// ==UserScript==
// @name         OP.GG Total & Average Game Time Calculator (Robust Selector)
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Calculates and displays total time, average time, and the most frequent champion played on OP.GG match history.
// @author       SimronJ
// @match        https://*.op.gg/lol/summoners*
// @grant        none
// @updateURL    https://github.com/SimronJ/tempermonkeyScripts/raw/refs/heads/main/opgg/opgg.meta.js
// @downloadURL  https://github.com/SimronJ/tempermonkeyScripts/raw/refs/heads/main/opgg/opgg.user.js
// ==/UserScript==
(function() {
    'use strict';
    // Parse time strings like "32m 21s" or "1h 12m 5s" into seconds
    function parseTimeToSeconds(timeString) {
        let h=0, m=0, s=0;
        const parts = timeString.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);
        if (parts) {
            h = parseInt(parts[1]||0);
            m = parseInt(parts[2]||0);
            s = parseInt(parts[3]||0);
        }
        return h*3600 + m*60 + s;
    }
    // Format seconds into "Xh Ym Zs"
    function formatTime(sec) {
        const h = Math.floor(sec/3600);
        const m = Math.floor((sec%3600)/60);
        const s = sec%60;
        let str = '';
        if (h>0) str += h+'h ';
        if (m>0 || h>0) str += m+'m ';
        str += s+'s';
        return str.trim();
    }
    // Go through each .box-border entry, find time, sum, and count games with time
    // Also count champion occurrences
    function calculateStats() {
        const entries = document.querySelectorAll('.box-border');
        let totalTimeInSeconds = 0;
        let gamesWithTimeCount = 0; // Count only games where we found a timer
        const championCounts = {}; // To store champion counts
        entries.forEach(entry => {
            // Find the champion image and get its alt text
            const championImg = entry.querySelector('.flex.items-center.gap-1 a img');
            if (championImg && championImg.alt) {
                const championName = championImg.alt;
                championCounts[championName] = (championCounts[championName] || 0) + 1;
            }
            // Find the one span that looks like a game-timer
            const spans = entry.querySelectorAll('span');
            for (let sp of spans) {
                const txt = sp.textContent.trim();
                if (/^\d+h\s*\d+m\s*\d+s$/.test(txt) || /^\d+m\s*\d+s$/.test(txt)) {
                    totalTimeInSeconds += parseTimeToSeconds(txt);
                    gamesWithTimeCount++; // Increment count only if a timer is found
                    break;  // done looking for the timer in this entry
                }
            }
        });
        // Find the most frequent champion
        let mostFrequentChampion = 'N/A';
        let maxCount = 0;
        for (const champion in championCounts) {
            if (championCounts[champion] > maxCount) {
                maxCount = championCounts[champion];
                mostFrequentChampion = `${champion} (${maxCount} games)`;
            }
        }
        return {
            totalSeconds: totalTimeInSeconds,
            gamesWithTimeCount: gamesWithTimeCount,
            mostFrequentChampion: mostFrequentChampion
        };
    }
    // Create or update floating widget
    function updateDisplay() {
        const { totalSeconds, gamesWithTimeCount, mostFrequentChampion } = calculateStats();
        // Calculate average using gamesWithTimeCount
        const avgSeconds = gamesWithTimeCount > 0 ? Math.floor(totalSeconds / gamesWithTimeCount) : 0;
        const totalStr = formatTime(totalSeconds);
        const avgStr   = formatTime(avgSeconds);
        let el = document.getElementById('time-stats-display');
        if (!el) {
            el = document.createElement('div');
            el.id = 'time-stats-display';
            Object.assign(el.style, {
                position:       'fixed',
                top:            '50%',
                left:           '10px',
                transform:      'translateY(-50%)',
                backgroundColor:'rgba(0,0,0,0.7)',
                color:          '#fff',
                padding:        '10px',
                borderRadius:   '5px',
                zIndex:         '10000',
                fontFamily:     'sans-serif',
                whiteSpace:     'pre-line'
            });
            document.body.appendChild(el);
        }
        el.textContent =
            `Total Played Time: ${totalStr}\n` +
            `Average per Game:  ${avgStr} (${gamesWithTimeCount} games)\n` +
            `Most Played Champion: ${mostFrequentChampion}`; // Added new line for most frequent champion
    }
    // Watch for newly loaded games (infinite scroll)
    const observer = new MutationObserver(muts => {
        for (let m of muts) {
            if (m.addedNodes.length) {
                updateDisplay();
                break;
            }
        }
    });
    const container = document.querySelector('#content-container') || document.body;
    observer.observe(container, { childList: true, subtree: true });
    // Initial render
    updateDisplay();
})();