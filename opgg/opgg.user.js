// ==UserScript==
// @name         OP.GG Total & Average Game Time Calculator (Robust Selector)
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Calculates and displays total and average game time on OP.GG match history using a regex-based selector for the timer.
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

    // Go through each .box-border entry, pick the span matching our time-regex, sum and count
    function calculateStats() {
        const entries = document.querySelectorAll('.box-border');
        let total=0, count=0;

        entries.forEach(entry => {
            // find the one span that looks like a game-timer
            const spans = entry.querySelectorAll('span');
            for (let sp of spans) {
                const txt = sp.textContent.trim();
                if (/^\d+h\s*\d+m\s*\d+s$/.test(txt) || /^\d+m\s*\d+s$/.test(txt)) {
                    total += parseTimeToSeconds(txt);
                    count++;
                    break;  // done with this entry
                }
            }
        });

        return { totalSeconds: total, gameCount: count };
    }

    // Create or update floating widget
    function updateDisplay() {
        const { totalSeconds, gameCount } = calculateStats();
        const avgSeconds = gameCount>0 ? Math.floor(totalSeconds/gameCount) : 0;

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
            `Average per Game:  ${avgStr} (${gameCount} games)`;
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