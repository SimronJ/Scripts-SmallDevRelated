// ==UserScript==
// @name         NPoweronline Question and Answers Extractor with OpenAI Support
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Extract Q&A and get responses from OpenAI
// @match        https://nii.npoweronline.org/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.openai.com
// @run-at       document-idle
// @author       @SimronJ
// ==/UserScript==

(function() {
    'use strict';

    // Load saved settings
    const settings = {
        apiKey: GM_getValue('apiKey', ''),
        model: GM_getValue('model', 'gpt-3.5-turbo')
    };

    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    function consoleLog(label, data) {
        console.group('🔍 OpenAI Debug: ' + label);
        console.log(data);
        console.groupEnd();
    }

    function extractContent() {
        let content = '';
        const questionText = document.querySelector('#question__body p');
        if (questionText) {
            content += 'Question:\n' + questionText.innerText.trim() + '\n\n';
        }
        content += 'Answers:\n';
        document.querySelectorAll('li.choice--multiple .choice').forEach(choice => {
            content += choice.innerText.replace(/\n+/g, ' ').trim() + '\n';
        });
        return content;
    }

    function createLoadingIndicator() {
        const loading = document.createElement('div');
        loading.id = 'openai-loading';
        loading.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px;
            color: #1a73e8;
            font-size: 14px;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #1a73e8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        const text = document.createElement('span');
        text.textContent = 'Getting response from OpenAI...';

        loading.appendChild(spinner);
        loading.appendChild(text);
        return loading;
    }

    function createResponseContainer() {
        const existingContainer = document.getElementById('openai-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'openai-container';
        container.style.cssText = `
            width: 90%;
            max-width: 800px;
            margin: 20px auto;
            padding-bottom: 80px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            min-height: 100px;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px 8px 0 0;
        `;

        const title = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString();
        title.textContent = 'OpenAI Response (' + timestamp + ')';
        title.style.cssText = `
            font-weight: 600;
            font-size: 14px;
            color: #1a73e8;
        `;

        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.style.cssText = `
            padding: 4px 10px;
            background: #f1f3f4;
            border: 1px solid #dadce0;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            color: #5f6368;
            transition: background 0.2s;
        `;

        copyButton.onmouseover = () => copyButton.style.background = '#e8eaed';
        copyButton.onmouseout = () => copyButton.style.background = '#f1f3f4';
        copyButton.onclick = () => {
            const responseDiv = container.querySelector('.openai-response');
            if (responseDiv) {
                GM_setClipboard(responseDiv.textContent);
                copyButton.textContent = 'Copied!';
                setTimeout(() => (copyButton.textContent = 'Copy'), 2000);
            }
        };

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = copyButton.style.cssText;
        closeButton.onmouseover = () => closeButton.style.background = '#e8eaed';
        closeButton.onmouseout = () => closeButton.style.background = '#f1f3f4';
        closeButton.onclick = () => container.remove();

        controls.appendChild(copyButton);
        controls.appendChild(closeButton);
        header.appendChild(title);
        header.appendChild(controls);

        const responseDiv = document.createElement('div');
        responseDiv.className = 'openai-response';
        responseDiv.style.cssText = `
            padding: 15px;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            color: #202124;
            background: #ffffff;
            border-radius: 0 0 8px 8px;
            overflow-x: auto;
        `;

        container.appendChild(header);
        container.appendChild(responseDiv);
        document.body.appendChild(container);

        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);

        return container;
    }

    function showResponse(content, isLoading = false) {
        const container = createResponseContainer();
        const responseDiv = container.querySelector('.openai-response');
        if (isLoading) {
            responseDiv.innerHTML = '';
            responseDiv.appendChild(createLoadingIndicator());
        } else {
            responseDiv.textContent = content;
        }
    }

    function askOpenAI(question) {
        showResponse('', true);

        const headers = {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json'
        };

        const payload = {
            model: settings.model,
            messages: [{
                role: "user",
                content: question
            }],
            temperature: 0.7,
            max_tokens: 2048
        };

        consoleLog('Request Headers', headers);
        consoleLog('Request Payload', payload);

        GM_xmlhttpRequest({
            method: 'POST',
            url: OPENAI_API_URL,
            headers: headers,
            data: JSON.stringify(payload),
            onload: function(response) {
                consoleLog('Response Status', response.status);
                try {
                    const responseData = JSON.parse(response.responseText);
                    if (response.status === 401) {
                        showResponse('Authentication Error: Invalid API Key - Please check your settings');
                        return;
                    }
                    if (responseData.error) {
                        showResponse('Error: ' + responseData.error.message);
                        return;
                    }
                    if (response.status === 200 && responseData.choices) {
                        const content = responseData.choices[0].message.content;
                        showResponse(content);
                    }
                } catch (error) {
                    showResponse('Error parsing response: ' + error.message);
                }
            },
            onerror: function(error) {
                showResponse('Error making request to OpenAI API');
            }
        });
    }

    function toggleSettings() {
        const existingSettings = document.getElementById('openai-settings');
        if (existingSettings) {
            existingSettings.style.display = existingSettings.style.display === 'none' ? 'block' : 'none';
            return;
        }

        const settingsContainer = document.createElement('div');
        settingsContainer.id = 'openai-settings';
        settingsContainer.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9998;
            width: 300px;
        `;

        settingsContainer.innerHTML = `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">API Key:</label>
                <input type="password" id="openai-api-key" value="${settings.apiKey}"
                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Model:</label>
                <input type="text" id="openai-model" value="${settings.model}"
                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <button id="save-settings" style="
                padding: 8px 16px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                width: 100%;
            ">Save Settings</button>
        `;

        document.body.appendChild(settingsContainer);

        document.getElementById('save-settings').onclick = function() {
            settings.apiKey = document.getElementById('openai-api-key').value;
            settings.model = document.getElementById('openai-model').value;

            GM_setValue('apiKey', settings.apiKey);
            GM_setValue('model', settings.model);

            settingsContainer.style.display = 'none';
        };
    }

    function init() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            display: flex;
            gap: 10px;
        `;

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Q&A';
        copyButton.style.cssText = `
            padding: 10px 20px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        const askButton = document.createElement('button');
        askButton.textContent = 'Ask OpenAI';
        askButton.style.cssText = `
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        const settingsButton = document.createElement('button');
        settingsButton.textContent = '⚙️ Settings';
        settingsButton.style.cssText = `
            padding: 10px 20px;
            background: #757575;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        copyButton.onclick = () => {
            const content = extractContent();
            if (content) {
                GM_setClipboard(content);
                copyButton.textContent = 'Copied!';
                setTimeout(() => (copyButton.textContent = 'Copy Q&A'), 2000);
            }
        };

        askButton.onclick = () => {
            if (!settings.apiKey) {
                alert('Please configure your API key in settings first');
                return;
            }
            const content = extractContent();
            if (content) {
                askOpenAI(content);
            }
        };

        settingsButton.onclick = toggleSettings;

        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(askButton);
        buttonContainer.appendChild(settingsButton);
        document.body.appendChild(buttonContainer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();