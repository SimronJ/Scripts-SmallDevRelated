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

    // --- Lifetime Spend Fetch Logic ---
    let lifetimeSpendData = null;
    let lifetimeSpendLoading = false;
    let lifetimeSpendError = null;

    function extractSummonerInfo() {
        // Find the h1 > div > span structure
        const h1 = document.querySelector('h1 > div.flex.items-center.gap-1.truncate');
        if (!h1) return null;
        const spans = h1.querySelectorAll('span');
        if (spans.length < 2) return null;
        const gameName = spans[0].textContent.trim();
        let tagLine = spans[1].textContent.trim();
        if (tagLine.startsWith('#')) tagLine = tagLine.slice(1);
        return { gameName, tagLine };
    }

    function formatUnixToDate(unix) {
        const d = new Date(unix * 1000);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}-${dd}-${yyyy}`;
    }

    function fetchLifetimeSpend(buttonEl, updateCardCallback) {
        const info = extractSummonerInfo();
        if (!info) {
            lifetimeSpendError = 'Summoner not found';
            updateCardCallback();
            return;
        }
        lifetimeSpendLoading = true;
        lifetimeSpendError = null;
        updateCardCallback();
        buttonEl.disabled = true;
        buttonEl.textContent = 'Loading...';
        // Default to NA1, could be improved
        const region = 'na1';
        const apiPayload = {
            gameName: info.gameName,
            tagLine: info.tagLine,
            region: region
        };
        chrome.runtime.sendMessage({
            type: 'FETCH_LIFETIME_SPEND',
            payload: apiPayload
        }, (response) => {
            if (!response) {
                lifetimeSpendError = 'No response from background';
                lifetimeSpendData = null;
                // Log the API call payload for debugging
                console.log('[OPGG Stats] Lifetime Spend API call payload:', apiPayload);
            } else if (!response.success || !response.data || response.data.error || !response.data.response) {
                lifetimeSpendError = 'Not found';
                lifetimeSpendData = null;
                // Log the API call payload for debugging
                console.log('[OPGG Stats] Lifetime Spend API call payload:', apiPayload);
            } else {
                const { totalTimeSpent, updatedAt } = response.data.response;
                // totalTimeSpent is in minutes, convert to hours
                const hours = Math.floor(totalTimeSpent / 60);
                const lastUpdate = formatUnixToDate(updatedAt);
                lifetimeSpendData = { hours, lastUpdate };
                lifetimeSpendError = null;
            }
            lifetimeSpendLoading = false;
            updateCardCallback();
            buttonEl.disabled = false;
            buttonEl.textContent = 'Check the Lifetime Playtime';
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

        // --- Card header (summoner name + share button, inside card) ---
        let summonerName = '';
        let summonerTag = '';
        const summonerInfo = extractSummonerInfo();
        if (summonerInfo && summonerInfo.gameName) {
            summonerName = summonerInfo.gameName;
            if (summonerInfo.tagLine) {
                summonerTag = summonerInfo.tagLine;
            }
        }
        // Top row: Summoner name (center) + Share button (right), inside card
        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.alignItems = 'center';
        topRow.style.justifyContent = 'space-between';
        topRow.style.padding = '18px 12px 0 12px';
        topRow.style.marginBottom = '10px';
        // Summoner name (bold, white, modern font)
        const nameDiv = document.createElement('div');
        nameDiv.style.flex = '1 1 0';
        nameDiv.style.textAlign = 'left';
        nameDiv.style.display = 'flex';
        nameDiv.style.alignItems = 'baseline';
        nameDiv.style.overflow = 'hidden';
        nameDiv.style.whiteSpace = 'nowrap';
        nameDiv.style.textOverflow = 'ellipsis';
        nameDiv.style.maxWidth = '140px'; // Prevents overflow, adjust as needed
        nameDiv.style.cursor = 'pointer';
        nameDiv.title = summonerTag ? `${summonerName} #${summonerTag}` : summonerName;
        let nameExpanded = false;
        // Name span
        const nameSpan = document.createElement('span');
        nameSpan.textContent = summonerName;
        nameSpan.style.fontWeight = 'bold';
        nameSpan.style.fontSize = '22px';
        nameSpan.style.color = '#fff';
        nameSpan.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        nameSpan.style.letterSpacing = '0.5px';
        nameSpan.style.overflow = 'hidden';
        nameSpan.style.whiteSpace = 'nowrap';
        nameSpan.style.textOverflow = 'ellipsis';
        // Tag span
        const tagSpan = document.createElement('span');
        if (summonerTag) {
            tagSpan.textContent = ' #' + summonerTag;
            tagSpan.style.fontWeight = '400';
            tagSpan.style.fontSize = '16px';
            tagSpan.style.color = '#fff';
            tagSpan.style.fontFamily = 'monospace, Menlo, Consolas, "Liberation Mono", "Courier New", monospace';
            tagSpan.style.marginLeft = '6px';
            tagSpan.style.opacity = '0.85';
            tagSpan.style.overflow = 'hidden';
            tagSpan.style.whiteSpace = 'nowrap';
            tagSpan.style.textOverflow = 'ellipsis';
        }
        nameDiv.appendChild(nameSpan);
        if (summonerTag) nameDiv.appendChild(tagSpan);
        // Toggle expand/collapse on click
        nameDiv.addEventListener('click', function(e) {
            e.stopPropagation();
            nameExpanded = !nameExpanded;
            if (nameExpanded) {
                nameDiv.style.maxWidth = 'none';
                nameDiv.style.overflow = 'visible';
                nameDiv.style.whiteSpace = 'normal';
                nameSpan.style.overflow = 'visible';
                nameSpan.style.whiteSpace = 'normal';
                nameSpan.style.textOverflow = 'clip';
                if (summonerTag) {
                    tagSpan.style.overflow = 'visible';
                    tagSpan.style.whiteSpace = 'normal';
                    tagSpan.style.textOverflow = 'clip';
                }
                // Expand the card width to fit content
                const card = document.getElementById('time-stats-display');
                if (card) card.style.maxWidth = 'none';
            } else {
                nameDiv.style.maxWidth = '140px';
                nameDiv.style.overflow = 'hidden';
                nameDiv.style.whiteSpace = 'nowrap';
                nameSpan.style.overflow = 'hidden';
                nameSpan.style.whiteSpace = 'nowrap';
                nameSpan.style.textOverflow = 'ellipsis';
                if (summonerTag) {
                    tagSpan.style.overflow = 'hidden';
                    tagSpan.style.whiteSpace = 'nowrap';
                    tagSpan.style.textOverflow = 'ellipsis';
                }
                // Restore card max width
                const card = document.getElementById('time-stats-display');
                if (card) card.style.maxWidth = '240px';
            }
        });
        topRow.appendChild(nameDiv);
        // Share button (right, styled as icon)
        const shareBtn = document.createElement('button');
        shareBtn.innerHTML = '📸';
        shareBtn.title = 'Share this card';
        shareBtn.style.background = 'none';
        shareBtn.style.border = 'none';
        shareBtn.style.fontSize = '22px';
        shareBtn.style.cursor = 'pointer';
        shareBtn.style.marginLeft = '8px';
        shareBtn.style.padding = '2px 6px';
        shareBtn.style.borderRadius = '6px';
        shareBtn.style.transition = 'background 0.2s';
        shareBtn.disabled = false;
        shareBtn.style.opacity = '1';
        shareBtn.onmouseover = function() { shareBtn.style.background = '#263040'; };
        shareBtn.onmouseout = function() { shareBtn.style.background = 'none'; };
        shareBtn.onclick = async function(e) {
            e.stopPropagation();
            shareBtn.disabled = true;
            shareBtn.style.opacity = '0.6';
            setTimeout(async () => {
                const card = document.getElementById('time-stats-display');
                console.log('Card size:', card ? card.offsetWidth : 'null', card ? card.offsetHeight : 'null');
                if (!card || card.offsetWidth === 0 || card.offsetHeight === 0) {
                    showScreenshotError('Screenshot failed: Card is not visible or has zero size.');
                    shareBtn.disabled = false;
                    shareBtn.style.opacity = '1';
                    return;
                }
                // Get card position relative to viewport
                const rect = card.getBoundingClientRect();
                // Ask background to capture the visible tab
                chrome.runtime.sendMessage({ type: 'CAPTURE_CARD_SCREENSHOT' }, async (dataUrl) => {
                    if (!dataUrl) {
                        showScreenshotError('Failed to capture screenshot.');
                        shareBtn.disabled = false;
                        shareBtn.style.opacity = '1';
                        return;
                    }
                    // Create an image and crop to the card
                    const img = new window.Image();
                    img.onload = async function() {
                        const dpr = window.devicePixelRatio;
                        const canvas = document.createElement('canvas');
                        canvas.width = rect.width;
                        canvas.height = rect.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(
                            img,
                            rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr, // source
                            0, 0, rect.width, rect.height // destination
                        );
                        // Copy to clipboard
                        canvas.toBlob(async blob => {
                            if (navigator.clipboard && window.ClipboardItem) {
                                await navigator.clipboard.write([
                                    new window.ClipboardItem({ 'image/png': blob })
                                ]);
                                showCopyConfirm();
                            } else {
                                showScreenshotError('Clipboard API not supported.');
                            }
                        }, 'image/png');
                    };
                    img.src = dataUrl;
                });
                shareBtn.disabled = false;
                shareBtn.style.opacity = '1';
            }, 700); // 700ms delay
        };
        topRow.appendChild(shareBtn);
        el.appendChild(topRow);
        // Divider below top row
        const divider = document.createElement('div');
        divider.style.height = '1px';
        divider.style.background = 'linear-gradient(90deg, #263040 0%, #4FC3F7 100%)';
        divider.style.margin = '10px 0 8px 0';
        el.appendChild(divider);

        // --- Lifetime Spend Section ---
        const lifetimeDiv = document.createElement('div');
        lifetimeDiv.style.padding = '0 10px 0 10px';
        lifetimeDiv.style.background = 'none';
        lifetimeDiv.style.marginBottom = '18px';
        lifetimeDiv.style.textAlign = 'center';
        // Button or Data
        if (lifetimeSpendData) {
            const days = Math.floor(lifetimeSpendData.hours / 24);
            lifetimeDiv.innerHTML = `
                <div style="font-size: 17px; font-weight: bold; margin-bottom: 8px; text-align: center; color: #4FC3F7;">Lifetime Playtime</div>
                <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 0px;">
                    <div style="flex: 1 1 0; min-width: 56px; background: #232f3e; border: 1.5px solid #4FC3F7; border-radius: 12px; padding: 12px 0 10px 0; display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 14px; color: #4FC3F7; margin-bottom: 2px;">Hours</span>
                        <span style="font-size: 24px; font-weight: bold; color: #fff; letter-spacing: 0.5px;">${lifetimeSpendData.hours.toLocaleString()}</span>
                    </div>
                    <div style="flex: 1 1 0; min-width: 56px; background: #232f3e; border: 1.5px solid #4FC3F7; border-radius: 12px; padding: 12px 0 10px 0; display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 14px; color: #4FC3F7; margin-bottom: 2px;">Days</span>
                        <span style="font-size: 24px; font-weight: bold; color: #fff; letter-spacing: 0.5px;">${days.toLocaleString()}</span>
                    </div>
                </div>
                <div style="font-size: 14px; color: #90a4ae; margin: 10px 0 8px 0; text-align: center;">Last Update: ${lifetimeSpendData.lastUpdate}</div>
            `;
        } else if (lifetimeSpendLoading) {
            lifetimeDiv.textContent = 'Loading...';
        } else if (lifetimeSpendError) {
            lifetimeDiv.textContent = "Couldn't get the data at this time.";
        } else {
            const btn = document.createElement('button');
            btn.textContent = 'View Lifetime Playtime';
            btn.style.background = '#4FC3F7';
            btn.style.color = '#23272f';
            btn.style.fontWeight = 'bold';
            btn.style.border = 'none';
            btn.style.borderRadius = '6px';
            btn.style.padding = '8px 0';
            btn.style.margin = '12px 0 12px 0';
            btn.style.width = '100%';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '13px';
            btn.onclick = function() {
                fetchLifetimeSpend(btn, () => updateDisplay(false));
            };
            lifetimeDiv.appendChild(btn);
        }
        el.appendChild(lifetimeDiv);

        // Card header (draggable + collapse)
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            background: #263040; border-radius: 12px 12px 0 0; padding: 8px 12px; font-size: 15px; font-weight: 700; color: #4FC3F7; letter-spacing: 0.5px; user-select: none;`;
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
            // Helper text under auto scroll
            const scrollHelper = document.createElement('div');
            scrollHelper.textContent = 'Turn on auto scroll to load more games and improve your stats.';
            scrollHelper.style.fontSize = '12px';
            scrollHelper.style.color = '#B0BEC5';
            scrollHelper.style.margin = '6px 0 10px 0';
            scrollHelper.style.textAlign = 'center';
            scrollHelper.style.lineHeight = '1.3';
            content.appendChild(scrollHelper);
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

        // --- Drag logic (whole card, not just header, but not on buttons/inputs/links) ---
        let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
        el.onmousedown = function(e) {
            // Only start drag if not clicking on a button, input, textarea, select, or link
            const tag = e.target.tagName.toLowerCase();
            if (["button","input","textarea","select","a","label"].includes(tag)) return;
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
            // Reset lifetime spend state on SPA navigation
            lifetimeSpendData = null;
            lifetimeSpendError = null;
            lifetimeSpendLoading = false;
            if (observer) observer.disconnect();
            updateDisplay(true);
            observeMainContent();
        }
    }, 300);

    function showScreenshotError(msg) {
        let errDiv = document.getElementById('opgg-screenshot-error');
        if (errDiv) errDiv.remove();
        errDiv = document.createElement('div');
        errDiv.id = 'opgg-screenshot-error';
        errDiv.textContent = msg;
        errDiv.style.background = '#F44336';
        errDiv.style.color = '#fff';
        errDiv.style.fontWeight = 'bold';
        errDiv.style.borderRadius = '6px';
        errDiv.style.padding = '8px 12px';
        errDiv.style.margin = '10px auto';
        errDiv.style.textAlign = 'center';
        errDiv.style.maxWidth = '90%';
        errDiv.style.zIndex = '10001';
        // Insert at the top of the card
        const card = document.getElementById('time-stats-display');
        if (card) card.insertBefore(errDiv, card.firstChild);
        setTimeout(() => { if (errDiv) errDiv.remove(); }, 3500);
    }

    function showCopyConfirm() {
        let conf = document.getElementById('opgg-copy-confirm');
        if (conf) conf.remove();
        conf = document.createElement('div');
        conf.id = 'opgg-copy-confirm';
        conf.textContent = 'Copied to your clipboard!';
        conf.style.background = '#4FC3F7';
        conf.style.color = '#23272f';
        conf.style.fontWeight = 'bold';
        conf.style.borderRadius = '6px';
        conf.style.padding = '8px 16px';
        conf.style.margin = '10px auto';
        conf.style.textAlign = 'center';
        conf.style.maxWidth = '90%';
        conf.style.zIndex = '10001';
        // Insert at the top of the card
        const card = document.getElementById('time-stats-display');
        if (card) card.insertBefore(conf, card.firstChild);
        setTimeout(() => { if (conf) conf.remove(); }, 2000);
    }
})(); 