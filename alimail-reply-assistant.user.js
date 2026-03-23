// ==UserScript==
// @name         Alimail Reply Assistant
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Auto-generate professional email replies for Alimail webmail - 2 Column Layout with Alimail Theme
// @author       Tifa Lockhart
// @match        https://qiye.aliyun.com/alimail/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Server configuration
    const SERVER_URL = 'http://localhost:8000';

    // CSS Styles - Alimail Theme (2 Column Layout)
    const styles = `
        #alimail-reply-overlay {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 999999;
            background: #ffffff;
            color: #333333;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            width: 90vw;
            max-width: 900px;
            height: 80vh;
            max-height: 600px;
            display: none;
            cursor: default;
            user-select: text;
            border: 1px solid #e0e0e0;
            overflow: hidden;
        }
        
        #alimail-reply-overlay.visible {
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        
        /* Header - Alimail Blue */
        #alimail-reply-overlay .alimail-header {
            background: #1a73e8;
            color: white;
            font-size: 15px;
            font-weight: 500;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        
        #alimail-reply-overlay .alimail-close {
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            background: rgba(255,255,255,0.15);
            font-size: 14px;
            transition: background 0.2s;
        }
        
        #alimail-reply-overlay .alimail-close:hover {
            background: rgba(255,255,255,0.25);
        }
        
        /* Content - 2 Column Layout */
        #alimail-reply-overlay .alimail-content {
            display: flex;
            flex: 1;
            overflow: hidden;
            min-height: 0;
        }
        
        /* Column Styles */
        #alimail-reply-overlay .alimail-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
        }
        
        #alimail-reply-overlay .alimail-column:first-child {
            border-right: 1px solid #e8eaed;
        }
        
        #alimail-reply-overlay .alimail-column-header {
            font-size: 13px;
            font-weight: 500;
            color: #5f6368;
            padding: 12px 16px;
            border-bottom: 1px solid #e8eaed;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
        }
        
        #alimail-reply-overlay .alimail-column-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        
        #alimail-reply-overlay .alimail-column-content::-webkit-scrollbar {
            width: 8px;
        }
        
        #alimail-reply-overlay .alimail-column-content::-webkit-scrollbar-track {
            background: transparent;
        }
        
        #alimail-reply-overlay .alimail-column-content::-webkit-scrollbar-thumb {
            background: #dadce0;
            border-radius: 4px;
        }
        
        #alimail-reply-overlay .alimail-column-content::-webkit-scrollbar-thumb:hover {
            background: #bdc1c6;
        }
        
        /* Left Column - Input Section */
        #alimail-reply-overlay .alimail-section {
            margin-bottom: 16px;
        }
        
        #alimail-reply-overlay .alimail-section:last-child {
            margin-bottom: 0;
        }
        
        #alimail-reply-overlay .alimail-label {
            font-size: 12px;
            color: #5f6368;
            margin-bottom: 6px;
            font-weight: 500;
        }
        
        #alimail-reply-overlay .alimail-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            background: #ffffff;
            color: #202124;
            font-size: 14px;
            font-family: inherit;
            box-sizing: border-box;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        #alimail-reply-overlay .alimail-input::placeholder {
            color: #9aa0a6;
        }
        
        #alimail-reply-overlay .alimail-input:focus {
            outline: none;
            border-color: #1a73e8;
            box-shadow: 0 0 0 2px rgba(26,115,232,0.1);
        }
        
        #alimail-reply-overlay textarea.alimail-input {
            min-height: 80px;
            resize: vertical;
        }
        
        #alimail-reply-overlay textarea.alimail-input.large {
            min-height: 120px;
        }
        
        #alimail-reply-overlay .alimail-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            background: #ffffff;
            color: #202124;
            font-size: 14px;
            font-family: inherit;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        
        #alimail-reply-overlay .alimail-select:focus {
            outline: none;
            border-color: #1a73e8;
            box-shadow: 0 0 0 2px rgba(26,115,232,0.1);
        }
        
        #alimail-reply-overlay .alimail-row {
            display: flex;
            gap: 12px;
        }
        
        #alimail-reply-overlay .alimail-col {
            flex: 1;
        }
        
        /* Original Email Preview */
        #alimail-reply-overlay .alimail-original-box {
            background: #f8f9fa;
            border: 1px solid #e8eaed;
            border-radius: 4px;
            padding: 12px;
            font-size: 13px;
            line-height: 1.5;
            color: #5f6368;
            max-height: 150px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        #alimail-reply-overlay .alimail-original-placeholder {
            font-style: italic;
            color: #9aa0a6;
        }
        
        /* Buttons */
        #alimail-reply-overlay .alimail-button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            background: #1a73e8;
            color: white;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s, box-shadow 0.2s;
            font-family: inherit;
        }
        
        #alimail-reply-overlay .alimail-button:hover {
            background: #1557b0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        #alimail-reply-overlay .alimail-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            box-shadow: none;
        }
        
        #alimail-reply-overlay .alimail-generate-btn {
            width: 100%;
            margin-top: 8px;
            padding: 12px;
            font-size: 14px;
        }
        
        #alimail-reply-overlay .alimail-copy-btn {
            background: #34a853;
        }
        
        #alimail-reply-overlay .alimail-copy-btn:hover {
            background: #2d8e47;
        }
        
        #alimail-reply-overlay .alimail-copy-btn.copied {
            background: #188038;
        }
        
        /* Right Column - Result */
        #alimail-reply-overlay .alimail-result-box {
            background: #f8f9fa;
            border: 1px solid #e8eaed;
            border-radius: 4px;
            padding: 16px;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            min-height: 200px;
            color: #202124;
        }
        
        #alimail-reply-overlay .alimail-result-placeholder {
            font-style: italic;
            color: #9aa0a6;
            text-align: center;
            padding: 60px 20px;
        }
        
        #alimail-reply-overlay .alimail-loading {
            text-align: center;
            padding: 60px 20px;
            color: #5f6368;
        }
        
        #alimail-reply-overlay .alimail-loading::before {
            content: '';
            display: inline-block;
            width: 24px;
            height: 24px;
            border: 2px solid #e8eaed;
            border-top-color: #1a73e8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 12px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        #alimail-reply-overlay .alimail-error {
            background: #fce8e8;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 12px;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.5;
        }
        
        #alimail-reply-overlay .alimail-error code {
            background: rgba(0,0,0,0.05);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }

        /* Floating button */
        #alimail-assistant-btn {
            position: fixed;
            right: 24px;
            bottom: 24px;
            z-index: 999998;
            background: #1a73e8;
            color: white;
            border: none;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #alimail-assistant-btn:hover {
            background: #1557b0;
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(0,0,0,0.25);
        }
        
        #alimail-assistant-btn.hidden {
            display: none;
        }
    `;

    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(styles);
    } else {
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // Global state
    let generatedReplyText = '';

    // Create overlay element with 2-column layout
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'alimail-reply-overlay';
        overlay.innerHTML = `
            <div class="alimail-header">
                <span>📝 AI Reply Assistant</span>
                <span class="alimail-close" title="Close (Esc)">✕</span>
            </div>
            <div class="alimail-content">
                <!-- Left Column: Input (Original Email + Key Points) -->
                <div class="alimail-column">
                    <div class="alimail-column-header">
                        <span>📧</span>
                        <span>Compose Reply</span>
                    </div>
                    <div class="alimail-column-content">
                        <!-- Original Email Section -->
                        <div class="alimail-section">
                            <div class="alimail-label">Original Email</div>
                            <div class="alimail-original-box" id="alimail-original-text">
                                <div class="alimail-original-placeholder">Loading original email...</div>
                            </div>
                        </div>
                        
                        <!-- Key Points Section -->
                        <div class="alimail-section">
                            <div class="alimail-label">Your Key Points</div>
                            <textarea class="alimail-input large" id="alimail-user-input" placeholder="Enter the key points you want to include in your reply...

Example:
- Apologize for the delay
- Request additional documents
- Propose meeting on Friday at 2pm"></textarea>
                        </div>
                        
                        <!-- Options -->
                        <div class="alimail-row">
                            <div class="alimail-col">
                                <div class="alimail-label">Tone</div>
                                <select class="alimail-select" id="alimail-tone">
                                    <option value="professional">Professional</option>
                                    <option value="friendly">Friendly</option>
                                    <option value="concise">Concise</option>
                                    <option value="detailed">Detailed</option>
                                </select>
                            </div>
                            <div class="alimail-col">
                                <div class="alimail-label">Language</div>
                                <select class="alimail-select" id="alimail-language">
                                    <option value="english">English</option>
                                    <option value="chinese">繁體中文</option>
                                    <option value="portuguese">Portuguese</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Generate Button -->
                        <button class="alimail-button alimail-generate-btn" id="alimail-generate">✨ Generate Reply</button>
                    </div>
                </div>
                
                <!-- Right Column: Generated Reply -->
                <div class="alimail-column">
                    <div class="alimail-column-header">
                        <span>✨</span>
                        <span>Generated Reply</span>
                    </div>
                    <div class="alimail-column-content" id="alimail-result-container">
                        <div class="alimail-result-placeholder">
                            Your generated reply will appear here
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close button
        overlay.querySelector('.alimail-close').addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.classList.remove('visible');
        });

        // Generate button
        overlay.querySelector('#alimail-generate').addEventListener('click', (e) => {
            e.stopPropagation();
            generateReply();
        });

        return overlay;
    }

    // Create floating button
    function createFloatingButton() {
        const btn = document.createElement('button');
        btn.id = 'alimail-assistant-btn';
        btn.innerHTML = '✨';
        btn.title = 'AI Reply Assistant';
        btn.classList.add('hidden');
        document.body.appendChild(btn);

        btn.addEventListener('click', () => {
            const overlay = document.getElementById('alimail-reply-overlay') || createOverlay();
            if (overlay.classList.contains('visible')) {
                overlay.classList.remove('visible');
            } else {
                updateOriginalEmail();
                overlay.classList.add('visible');
            }
        });

        return btn;
    }

    // Extract original email content
    function extractOriginalEmail() {
        const quotedSelectors = [
            '.email-content-body',
            '.mail-body',
            '.message-body',
            '[class*="body"]',
            '.content-editable',
            '.email-body',
            '.reply-content',
            '.quoted-content'
        ];
        
        for (const selector of quotedSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim().length > 50) {
                return el.textContent.trim();
            }
        }
        
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const body = iframeDoc.body;
                if (body && body.textContent.trim().length > 50) {
                    return body.textContent.trim();
                }
            } catch (e) {
                // Cross-origin iframe
            }
        }
        
        const mainContent = document.querySelector('.main-content, .content, #content, .container');
        if (mainContent) {
            return mainContent.textContent.trim().substring(0, 3000);
        }
        
        return '';
    }

    // Update the original email display
    function updateOriginalEmail() {
        const originalText = extractOriginalEmail();
        const container = document.getElementById('alimail-original-text');
        if (container) {
            if (originalText) {
                container.textContent = originalText;
                container.dataset.fullText = originalText;
            } else {
                container.innerHTML = '<div class="alimail-original-placeholder">Could not extract original email. You can still enter your key points to generate a reply.</div>';
                container.dataset.fullText = '';
            }
        }
    }

    // Call server API
    async function callGenerateAPI(originalEmail, userInput, tone, language) {
        return new Promise((resolve, reject) => {
            const payload = {
                original_email: originalEmail,
                user_input: userInput,
                tone: tone,
                language: language
            };
            
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${SERVER_URL}/generate-reply`,
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify(payload),
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(JSON.parse(response.responseText));
                        } else {
                            reject(new Error(`Server error: ${response.status}`));
                        }
                    },
                    onerror: () => reject(new Error('Network error - is the server running?'))
                });
            } else {
                fetch(`${SERVER_URL}/generate-reply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(r => r.json())
                .then(resolve)
                .catch(reject);
            }
        });
    }

    // Generate reply
    async function generateReply() {
        const userInput = document.getElementById('alimail-user-input').value.trim();
        const tone = document.getElementById('alimail-tone').value;
        const language = document.getElementById('alimail-language').value;
        const originalEl = document.getElementById('alimail-original-text');
        const originalEmail = originalEl ? (originalEl.dataset.fullText || originalEl.textContent) : '';
        const resultContainer = document.getElementById('alimail-result-container');
        const generateBtn = document.getElementById('alimail-generate');
        
        if (!userInput) {
            resultContainer.innerHTML = '<div class="alimail-error">Please enter some key points for the reply.</div>';
            return;
        }
        
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Generating...';
        resultContainer.innerHTML = '<div class="alimail-loading">Generating your professional reply...</div>';
        
        try {
            const response = await callGenerateAPI(originalEmail, userInput, tone, language);
            generatedReplyText = response.generated_reply;
            showResult(generatedReplyText);
        } catch (error) {
            resultContainer.innerHTML = `
                <div class="alimail-error">
                    <strong>Error:</strong> ${error.message}<br><br>
                    Make sure the server is running:<br>
                    <code>docker-compose up -d</code>
                </div>
            `;
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '✨ Generate Reply';
        }
    }

    // Show generated result
    function showResult(generatedText) {
        const resultContainer = document.getElementById('alimail-result-container');
        
        resultContainer.innerHTML = `
            <div class="alimail-result-box">${escapeHtml(generatedText)}</div>
            <button class="alimail-button alimail-copy-btn" id="alimail-copy" style="margin-top: 12px; width: 100%;">📋 Copy to Clipboard</button>
        `;
        
        document.getElementById('alimail-copy').addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(generatedText);
                this.textContent = '✅ Copied!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.textContent = '📋 Copy to Clipboard';
                    this.classList.remove('copied');
                }, 2000);
            } catch (err) {
                const textArea = document.createElement('textarea');
                textArea.value = generatedText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.textContent = '✅ Copied!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.textContent = '📋 Copy to Clipboard';
                    this.classList.remove('copied');
                }, 2000);
            }
        });
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check compose page
    function isComposePage() {
        return window.location.pathname.includes('/compose') || 
               window.location.hash.includes('/compose') ||
               document.querySelector('.compose-area, .reply-area, [class*="compose"], [class*="reply"]') !== null;
    }

    // Initialize
    function init() {
        const floatingBtn = createFloatingButton();
        createOverlay();
        
        function updateVisibility() {
            if (isComposePage()) {
                floatingBtn.classList.remove('hidden');
            } else {
                floatingBtn.classList.add('hidden');
                const overlay = document.getElementById('alimail-reply-overlay');
                if (overlay) overlay.classList.remove('visible');
            }
        }
        
        updateVisibility();
        
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                updateVisibility();
            }
        }).observe(document, { subtree: true, childList: true });
        
        setInterval(updateVisibility, 1000);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('alimail-reply-overlay');
                if (overlay) overlay.classList.remove('visible');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
