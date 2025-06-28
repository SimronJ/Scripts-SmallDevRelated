// OP.GG Stats Card Chrome Extension
// Content script that runs on OP.GG pages

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
    
    // Convert number to ordinal suffix (1st, 2nd, 3rd, etc.)
    function getOrdinalSuffix(num) {
        if (num === 0) return '';
        if (num >= 11 && num <= 13) return 'th';
        switch (num % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
    
    // Go through each .box-border entry, find time, sum, and count games with time
    // Also count champion occurrences
    function calculateStats() {
        const entries = document.querySelectorAll('.box-border');
        let totalTimeInSeconds = 0;
        let gamesWithTimeCount = 0;
        const championCounts = {};
        const championLaningWins = {}; // Store laning wins per champion
        const championRankings = {}; // Store rankings per champion
        let totalLaningWins = 0;
        let totalGamesWithLaning = 0;
        let totalRanking = 0;
        let gamesWithRanking = 0;

        entries.forEach(entry => {
            // Find the champion image and get its alt text
            const championImg = entry.querySelector('.flex.items-center.gap-1 a img');
            if (championImg && championImg.alt) {
                const championName = championImg.alt;
                championCounts[championName] = (championCounts[championName] || 0) + 1;
                
                // Initialize champion laning wins and rankings if not exists
                if (!championLaningWins[championName]) {
                    championLaningWins[championName] = { wins: 0, total: 0 };
                }
                if (!championRankings[championName]) {
                    championRankings[championName] = { total: 0, count: 0 };
                }
            }

            // Check for laning score - look for "Laning X:Y" format
            const laningElements = entry.querySelectorAll('.text-xs.text-red-600, .text-red-600');
            let laningFound = false;
            for (let laningElement of laningElements) {
                const laningText = laningElement.textContent;
                const laningMatch = laningText.match(/Laning (\d+):(\d+)/);
                if (laningMatch) {
                    const yourScore = parseInt(laningMatch[1]);
                    const enemyScore = parseInt(laningMatch[2]);
                    
                    // You win lane if your score is higher than enemy score
                    const isLaningWin = yourScore > enemyScore;
                    
                    if (isLaningWin) {
                        totalLaningWins++;
                        if (championImg && championImg.alt) {
                            const championName = championImg.alt;
                            championLaningWins[championName].wins++;
                        }
                    }
                    totalGamesWithLaning++;
                    
                    if (championImg && championImg.alt) {
                        const championName = championImg.alt;
                        championLaningWins[championName].total++;
                    }
                    laningFound = true;
                    break;
                }
            }
            
            // If not found in red elements, try searching all text content for laning pattern
            if (!laningFound) {
                const entryText = entry.textContent;
                const laningMatch = entryText.match(/Laning (\d+):(\d+)/);
                if (laningMatch) {
                    const yourScore = parseInt(laningMatch[1]);
                    const enemyScore = parseInt(laningMatch[2]);
                    
                    const isLaningWin = yourScore > enemyScore;
                    
                    if (isLaningWin) {
                        totalLaningWins++;
                        if (championImg && championImg.alt) {
                            const championName = championImg.alt;
                            championLaningWins[championName].wins++;
                        }
                    }
                    totalGamesWithLaning++;
                    
                    if (championImg && championImg.alt) {
                        const championName = championImg.alt;
                        championLaningWins[championName].total++;
                    }
                }
            }

            // Check for ranking position - look for elements like "4th", "2nd", etc.
            const rankingElements = entry.querySelectorAll('span');
            for (let elem of rankingElements) {
                const text = elem.textContent.trim();
                const rankingMatch = text.match(/^(\d+)(?:st|nd|rd|th)$/);
                if (rankingMatch) {
                    const ranking = parseInt(rankingMatch[1]);
                    totalRanking += ranking;
                    gamesWithRanking++;
                    
                    if (championImg && championImg.alt) {
                        const championName = championImg.alt;
                        championRankings[championName].total += ranking;
                        championRankings[championName].count++;
                    }
                    break;
                }
            }

            // Find the one span that looks like a game-timer
            const spans = entry.querySelectorAll('span');
            for (let sp of spans) {
                const txt = sp.textContent.trim();
                if (/^\d+h\s*\d+m\s*\d+s$/.test(txt) || /^\d+m\s*\d+s$/.test(txt)) {
                    totalTimeInSeconds += parseTimeToSeconds(txt);
                    gamesWithTimeCount++;
                    break;
                }
            }
        });

        // Find the most frequent champion
        let mostFrequentChampion = 'N/A';
        let maxCount = 0;
        for (const champion in championCounts) {
            if (championCounts[champion] > maxCount) {
                maxCount = championCounts[champion];
                mostFrequentChampion = champion;
            }
        }

        // Calculate laning win percentages and average rankings
        const overallLaningWinPercentage = totalGamesWithLaning > 0 ? Math.round((totalLaningWins / totalGamesWithLaning) * 100) : 0;
        const mostPlayedChampionLaningWinPercentage = mostFrequentChampion !== 'N/A' && championLaningWins[mostFrequentChampion] ?
            Math.round((championLaningWins[mostFrequentChampion].wins / championLaningWins[mostFrequentChampion].total) * 100) : 0;
        
        const averageRanking = gamesWithRanking > 0 ? Math.round(totalRanking / gamesWithRanking) : 0;
        const mostPlayedChampionAverageRanking = mostFrequentChampion !== 'N/A' && championRankings[mostFrequentChampion] ?
            Math.round(championRankings[mostFrequentChampion].total / championRankings[mostFrequentChampion].count) : 0;

        return {
            totalSeconds: totalTimeInSeconds,
            gamesWithTimeCount: gamesWithTimeCount,
            mostFrequentChampion: mostFrequentChampion,
            mostFrequentChampionGames: maxCount,
            overallLaningWinPercentage: overallLaningWinPercentage,
            mostPlayedChampionLaningWinPercentage: mostPlayedChampionLaningWinPercentage,
            averageRanking: averageRanking,
            mostPlayedChampionAverageRanking: mostPlayedChampionAverageRanking
        };
    }
    
    // Helper to get current page key (e.g., pathname)
    function getPageKey() {
        return window.location.pathname + window.location.search;
    }

    let lastPageKey = null;

    // --- Card position state (using Chrome storage) ---
    let cardPos = { top: null, left: null };
    let autoScrollActive = false;
    let autoScrollInterval = null;
    let collapsed = false;

    // Load settings from Chrome storage
    function loadSettings() {
        chrome.storage.sync.get(['cardPosition', 'cardCollapsed', 'autoScrollActive'], function(result) {
            if (result.cardPosition) {
                cardPos = result.cardPosition;
            }
            if (result.cardCollapsed !== undefined) {
                collapsed = result.cardCollapsed;
            }
            if (result.autoScrollActive !== undefined) {
                autoScrollActive = result.autoScrollActive;
            }
        });
    }

    // Save settings to Chrome storage
    function saveSettings() {
        chrome.storage.sync.set({
            cardPosition: cardPos,
            cardCollapsed: collapsed,
            autoScrollActive: autoScrollActive
        });
    }

    function updateDisplay(force) {
        // Remove old card if exists
        let el = document.getElementById('time-stats-display');
        if (el) el.remove();

        const entries = document.querySelectorAll('.box-border');
        if (entries.length === 0) {
            // No stats to show, remove card if present
            return;
        }

        // Create new card
        el = document.createElement('div');
        el.id = 'time-stats-display';
        document.body.appendChild(el);
        Object.assign(el.style, {
            position:       'fixed',
            top:            cardPos.top || '50%',
            left:           cardPos.left || '10px',
            transform:      cardPos.top ? '' : 'translateY(-50%)',
            background:     '#23272f',
            color:          '#fff',
            padding:        '0',
            borderRadius:   '12px',
            zIndex:         '10000',
            fontFamily:     'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            whiteSpace:     'normal',
            boxShadow:      '0 2px 12px 0 rgba(0,0,0,0.25)',
            border:         '1.5px solid #31343b',
            maxWidth:       '240px',
            minWidth:       '180px',
            lineHeight:     '1.35',
            userSelect:     'none',
        });

        // Card header (draggable + collapse)
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            background: #263040; border-radius: 12px 12px 0 0; padding: 8px 12px; cursor: move; font-size: 15px; font-weight: 700; color: #4FC3F7; letter-spacing: 0.5px; user-select: none;`;
        header.innerHTML = `<span>📊 Stats</span><button id="collapse-btn" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;outline:none;">${collapsed ? '+' : '−'}</button>`;
        el.appendChild(header);

        // Card content
        const content = document.createElement('div');
        content.id = 'opgg-card-content';
        content.style.padding = '10px 18px 12px 18px';
        content.style.display = collapsed ? 'none' : 'block';

        // Calculate stats and render the stats card
        const stats = calculateStats();
        const { totalSeconds, gamesWithTimeCount, mostFrequentChampion, mostFrequentChampionGames, overallLaningWinPercentage, mostPlayedChampionLaningWinPercentage, averageRanking, mostPlayedChampionAverageRanking } = stats;
        const avgSeconds = gamesWithTimeCount > 0 ? Math.floor(totalSeconds / gamesWithTimeCount) : 0;
        content.innerHTML =
            `<div style=\"font-size: 13px; font-weight: 600; color: #4FC3F7; margin-bottom: 8px; letter-spacing: 0.5px;\"></div>
                <div style=\"margin-bottom: 8px;\">
                    <span style=\"color: #B0BEC5;\">Time:</span> <span style=\"color: #fff; font-weight: 600;\">${Math.floor(totalSeconds / 3600)}h</span>
                </div>
                <div style=\"margin-bottom: 8px;\">
                    <span style=\"color: #B0BEC5;\">Games:</span> <span style=\"color: #fff; font-weight: 600;\">${gamesWithTimeCount}</span>
                    <span style=\"color: #90A4AE; font-size: 15px; font-weight: bold; margin-left: 2px;\"> (~${Math.floor(avgSeconds / 60)}m)</span>
                </div>
                <div style=\"margin-bottom: 8px;\">
                    <span style=\"color: #B0BEC5;\">Top Champ:</span> <span style=\"color: #FF80AB; font-weight: 600;\">${mostFrequentChampion}</span>
                </div>
                <div style=\"background: #282c34; border-radius: 7px; padding: 7px 10px; margin-bottom: 10px;\">
                    <div style=\"margin-bottom: 3px;\"><span style=\"color: #90A4AE;\">Games:</span> <span style=\"color: #FFD54F; font-weight: 600;\">${mostFrequentChampionGames}</span></div>
                    <div style=\"margin-bottom: 3px;\"><span style=\"color: #90A4AE;\">Rank:</span> <span style=\"color: #FFD54F; font-weight: 600;\">${mostPlayedChampionAverageRanking}${getOrdinalSuffix(mostPlayedChampionAverageRanking)}</span></div>
                    <div><span style=\"color: #90A4AE;\">Lane:</span> <span style=\"color: ${mostPlayedChampionLaningWinPercentage >= 50 ? '#4CAF50' : '#F44336'}; font-weight: 600;\">${mostPlayedChampionLaningWinPercentage}%</span></div>
                </div>
                <div style=\"font-size: 12px; color: #4FC3F7; font-weight: 600; margin-bottom: 4px;\">Overall</div>
                <div style=\"background: #282c34; border-radius: 7px; padding: 7px 10px;\">
                    <div style=\"margin-bottom: 3px;\"><span style=\"color: #90A4AE;\">Rank:</span> <span style=\"color: #FFD54F; font-weight: 600;\">${averageRanking}${getOrdinalSuffix(averageRanking)}</span></div>
                    <div><span style=\"color: #90A4AE;\">Lane:</span> <span style=\"color: ${overallLaningWinPercentage >= 50 ? '#4CAF50' : '#F44336'}; font-weight: 600;\">${overallLaningWinPercentage}%</span></div>
                </div>`;
        el.appendChild(content);

        // Add scroll button if it doesn't exist
        let scrollButton = document.getElementById('auto-scroll-button');
        if (!scrollButton) {
            scrollButton = document.createElement('button');
            scrollButton.id = 'auto-scroll-button';
            scrollButton.textContent = autoScrollActive ? 'Auto Scroll: ON' : 'Auto Scroll: OFF';
            Object.assign(scrollButton.style, {
                display: 'block',
                marginTop: '12px',
                padding: '8px 0',
                backgroundColor: autoScrollActive ? '#4CAF50' : '#888',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: 'bold',
                fontSize: '15px',
                transition: 'background 0.2s',
            });
            content.appendChild(scrollButton);
        }
        scrollButton.disabled = false;
        scrollButton.textContent = autoScrollActive ? 'Auto Scroll: ON' : 'Auto Scroll: OFF';
        scrollButton.style.backgroundColor = autoScrollActive ? '#4CAF50' : '#888';
        scrollButton.onclick = function() {
            if (autoScrollActive) {
                // Turn OFF
                autoScrollActive = false;
                if (autoScrollInterval) clearInterval(autoScrollInterval);
                scrollButton.textContent = 'Auto Scroll: OFF';
                scrollButton.style.backgroundColor = '#888';
                scrollButton.disabled = false;
            } else {
                // Turn ON
                autoScrollActive = true;
                scrollButton.textContent = 'Auto Scroll: ON';
                scrollButton.style.backgroundColor = '#4CAF50';
                scrollButton.disabled = false;
                startAutoScroll();
            }
            saveSettings();
        };

        // Collapse/expand logic
        header.querySelector('#collapse-btn').onclick = function(e) {
            e.stopPropagation();
            collapsed = !collapsed;
            content.style.display = collapsed ? 'none' : 'block';
            this.textContent = collapsed ? '+' : '−';
            saveSettings();
        };

        // Drag logic (with Chrome storage)
        let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
        header.onmousedown = function(e) {
            if (e.target.id === 'collapse-btn') return; // Don't drag on collapse button
            isDragging = true;
            dragOffsetX = e.clientX - el.getBoundingClientRect().left;
            dragOffsetY = e.clientY - el.getBoundingClientRect().top;
            document.body.style.userSelect = 'none';
        };
        document.onmousemove = function(e) {
            if (!isDragging) return;
            el.style.left = (e.clientX - dragOffsetX) + 'px';
            el.style.top = (e.clientY - dragOffsetY) + 'px';
            el.style.transform = '';
            cardPos.left = el.style.left;
            cardPos.top = el.style.top;
        };
        document.onmouseup = function(e) {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                saveSettings();
            }
        };
    }

    // Toggleable auto scroll logic
    function startAutoScroll() {
        const button = document.getElementById('auto-scroll-button');
        button.textContent = 'Auto Scroll: ON';
        button.style.backgroundColor = '#4CAF50';
        button.disabled = false;

        let lastHeight = document.body.scrollHeight;
        let noChangeCount = 0;
        let notFoundCount = 0;
        const maxNotFound = 15; // Try for ~22 seconds (1.5s * 15)

        setTimeout(() => {
            const loadMore = () => {
                if (!autoScrollActive) {
                    clearInterval(autoScrollInterval);
                    button.textContent = 'Auto Scroll: OFF';
                    button.style.backgroundColor = '#888';
                    button.disabled = false;
                    return;
                }
                const showMoreButtons = Array.from(document.querySelectorAll('button.box-border'));
                const showMoreButton = showMoreButtons.find(btn => btn.textContent.trim().toLowerCase() === 'show more');
                if (showMoreButton) {
                    showMoreButton.click();
                    notFoundCount = 0; // Reset if found
                    setTimeout(() => {
                        const newHeight = document.body.scrollHeight;
                        if (newHeight === lastHeight) {
                            noChangeCount++;
                            if (noChangeCount >= 3) {
                                clearInterval(autoScrollInterval);
                                autoScrollActive = false;
                                button.textContent = 'Auto Scroll: OFF';
                                button.style.backgroundColor = '#888';
                                button.disabled = false;
                                saveSettings();
                            }
                        } else {
                            noChangeCount = 0;
                            lastHeight = newHeight;
                        }
                    }, 1000);
                } else {
                    notFoundCount++;
                    if (notFoundCount >= maxNotFound) {
                        clearInterval(autoScrollInterval);
                        autoScrollActive = false;
                        button.textContent = 'Auto Scroll: OFF';
                        button.style.backgroundColor = '#888';
                        button.disabled = false;
                        saveSettings();
                        console.log('[OPGG Stats] No Show more button found after waiting.');
                    }
                }
            };
            autoScrollInterval = setInterval(loadMore, 1500);
        }, 300);
    }

    // --- Optimized MutationObserver for SPA navigation ---
    let observer = null;
    let observedNode = null;

    function observeMainContent() {
        if (observer) observer.disconnect();
        const mainContainer = document.querySelector('#content-container') || document.body;
        observedNode = mainContainer;
        observer = new MutationObserver(() => {
            debouncedUpdateDisplay();
        });
        observer.observe(mainContainer, { childList: true, subtree: true });
    }

    // Debounce utility to prevent excessive updateDisplay calls
    function debounce(fn, delay) {
        let timer = null;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    const debouncedUpdateDisplay = debounce(() => updateDisplay(false), 200);

    // Initialize extension
    loadSettings();
    
    // Initial render and observer setup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            updateDisplay(true);
            observeMainContent();
        });
    } else {
        updateDisplay(true);
        observeMainContent();
    }
    
    // Listen for URL changes (SPA navigation)
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (observer) observer.disconnect();
            updateDisplay(true);
            observeMainContent();
        }
    }, 300);
})(); 