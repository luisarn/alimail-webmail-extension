// ==UserScript==
// @name         Alimail Reply Assistant
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Auto-generate professional email replies for Alimail webmail - 3 Column Layout
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

    // CSS Styles - 3 Column Layout
    const styles = `
        #alimail-reply-overlay {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 999999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            width: 95vw;
            max-width: 1200px;
            height: 85vh;
            max-height: 700px;
            display: none;
            cursor: default;
            user-select: text;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
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
        
        #alimail-reply-overlay .alimail-header {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            padding-bottom: 10px;
            flex-shrink: 0;
        }
        
        #alimail-reply-overlay .alimail-close {
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            background: rgba(255,255,255,0.2);
            font-size: 12px;
            transition: background 0.2s;
        }
        
        #alimail-reply-overlay .alimail-close:hover {
            background: rgba(255,255,255,0.3);
        }
        
        #alimail-reply-overlay .alimail-content {
            display: flex;
            flex: 1;
            gap: 16px;
            overflow: hidden;
            min-height: 0;
        }
        
        /* Column Styles */
        #alimail-reply-overlay .alimail-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 12px;
            overflow: hidden;
        }
        
        #alimail-reply-overlay .alimail-column-header {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        #alimail-reply-overlay .alimail-column-content {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }
        
        #alimail-reply-overlay .alimail-column-content::-webkit-scrollbar {
            width: 6px;
        }
        
        #alimail-reply-overlay .alimail-column-content::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
        }
        
        #alimail-reply-overlay .alimail-column-content::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
        }
        
        /* Original Email Column */
        #alimail-reply-overlay .alimail-original-content {
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            opacity: 0.9;
        }
        
        #alimail-reply-overlay .alimail-original-placeholder {
            font-style: italic;
            opacity: 0.6;
            font-size: 12px;
        }
        
        /* Middle Column - Input */
        #alimail-reply-overlay .alimail-section {
            margin-bottom: 12px;
        }
        
        #alimail-reply-overlay .alimail-label {
            font-size: 11px;
            opacity: 0.9;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        #alimail-reply-overlay .alimail-input {
            width: 100%;
            padding: 8px 10px;
            border: none;
            border-radius: 6px;
            background: rgba(255,255,255,0.15);
            color: white;
            font-size: 13px;
            font-family: inherit;
            box-sizing: border-box;
            resize: none;
        }
        
        #alimail-reply-overlay .alimail-input::placeholder {
            color: rgba(255,255,255,0.5);
        }
        
        #alimail-reply-overlay .alimail-input:focus {
            outline: none;
            background: rgba(255,255,255,0.2);
        }
        
        #alimail-reply-overlay textarea.alimail-input {
            min-height: 200px;
            height: calc(100% - 60px);
        }
        
        #alimail-reply-overlay .alimail-select {
            width: 100%;
            padding: 8px 10px;
            border: none;
            border-radius: 6px;
            background: rgba(255,255,255,0.15);
            color: white;
            font-size: 13px;
            font-family: inherit;
            cursor: pointer;
        }
        
        #alimail-reply-overlay .alimail-select:focus {
            outline: none;
            background: rgba(255,255,255,0.2);
        }
        
        #alimail-reply-overlay .alimail-select option {
            background: #667eea;
            color: white;
        }
        
        #alimail-reply-overlay .alimail-row {
            display: flex;
            gap: 8px;
        }
        
        #alimail-reply-overlay .alimail-col {
            flex: 1;
        }
        
        #alimail-reply-overlay .alimail-button {
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            background: rgba(255,255,255,0.25);
            color: white;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }
        
        #alimail-reply-overlay .alimail-button:hover {
            background: rgba(255,255,255,0.35);
            transform: translateY(-1px);
        }
        
        #alimail-reply-overlay .alimail-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        #alimail-reply-overlay .alimail-generate-btn {
            width: 100%;
            background: rgba(100,255,100,0.25);
            font-weight: 600;
            margin-top: 8px;
            padding: 12px;
        }
        
        #alimail-reply-overlay .alimail-generate-btn:hover:not(:disabled) {
            background: rgba(100,255,100,0.35);
        }
        
        /* Right Column - Result */
        #alimail-reply-overlay .alimail-result-content {
            background: rgba(0,0,0,0.2);
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            min-height: 200px;
            max-height: calc(100% - 60px);
            overflow-y: auto;
        }
        
        #alimail-reply-overlay .alimail-result-placeholder {
            font-style: italic;
            opacity: 0.6;
            text-align: center;
            padding: 40px 20px;
        }
        
        #alimail-reply-overlay .alimail-copy-btn {
            width: 100%;
            background: rgba(100,150,255,0.3);
            margin-top: 10px;
        }
        
        #alimail-reply-overlay .alimail-copy-btn:hover:not(:disabled) {
            background: rgba(100,150,255,0.4);
        }
        
        #alimail-reply-overlay .alimail-copy-btn.copied {
            background: rgba(100,255,100,0.3);
        }
        
        #alimail-reply-overlay .alimail-loading {
            text-align: center;
            padding: 40px 20px;
            font-size: 14px;
        }
        
        #alimail-reply-overlay .alimail-error {
            background: rgba(255,100,100,0.3);
            padding: 10px;
            border-radius: 6px;
            font-size: 12px;
            line-height: 1.4;
        }

        /* Floating button to open the assistant */
        #alimail-assistant-btn {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 999998;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #alimail-assistant-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
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

    // Create overlay element with 3-column layout
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'alimail-reply-overlay';
        overlay.innerHTML = `
            <div class="alimail-header">
                <span>📝 AI Reply Assistant</span>
                <span class="alimail-close" title="Close (Esc)">✕</span>
            </div>
            <div class="alimail-content">
                <!-- Left Column: Original Email -->
                <div class="alimail-column">
                    <div class="alimail-column-header">
                        <span>📧</span>
                        <span>Original Email</span>
                    </div>
                    <div class="alimail-column-content">
                        <div class="alimail-original-content" id="alimail-original-text">
                            <div class="alimail-original-placeholder">Loading original email...</div>
                        </div>
                    </div>
                </div>
                
                <!-- Middle Column: User Input -->
                <div class="alimail-column">
                    <div class="alimail-column-header">
                        <span>✏️</span>
                        <span>Your Key Points</span>
                    </div>
                    <div class="alimail-column-content">
                        <div class="alimail-section" style="height: calc(100% - 120px);">
                            <textarea class="alimail-input" id="alimail-user-input" placeholder="Enter your key points here...

- Apologize for the delay
- Request more documents
- Meeting scheduled for Friday"></textarea>
                        </div>
                        <div class="alimail-row">
                            <div class="alimail-col">
                                <div class="alimail-label">Tone:</div>
                                <select class="alimail-select" id="alimail-tone">
                                    <option value="professional">Professional</option>
                                    <option value="friendly">Friendly</option>
                                    <option value="concise">Concise</option>
                                    <option value="detailed">Detailed</option>
                                </select>
                            </div>
                            <div class="alimail-col">
                                <div class="alimail-label">Language:</div>
                                <select class="alimail-select" id="alimail-language">
                                    <option value="english">English</option>
                                    <option value="chinese">繁體中文</option>
                                    <option value="portuguese">Portuguese</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                        </div>
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
                            Click "Generate Reply" to create a professional email response
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

    // Extract original email content from Alimail compose page
    function extractOriginalEmail() {
        // Try multiple selectors to find the original email content
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
        
        // Look for iframe content
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const body = iframeDoc.body;
                if (body && body.textContent.trim().length > 50) {
                    return body.textContent.trim();
                }
            } catch (e) {
                // Cross-origin iframe, skip
            }
        }
        
        // Get main content area
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
                container.innerHTML = '<div class="alimail-original-placeholder">Could not extract original email. The email content may be in a different format.</div>';
                container.dataset.fullText = '';
            }
        }
    }

    // Call server API to generate reply
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
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(payload),
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(JSON.parse(response.responseText));
                        } else {
                            reject(new Error(`Server error: ${response.status}`));
                        }
                    },
                    onerror: () => {
                        reject(new Error('Network error - is the server running?'));
                    }
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
        
        // Show loading
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Generating...';
        resultContainer.innerHTML = '<div class="alimail-loading">✨ Generating professional reply...</div>';
        
        try {
            const response = await callGenerateAPI(originalEmail, userInput, tone, language);
            generatedReplyText = response.generated_reply;
            showResult(generatedReplyText);
        } catch (error) {
            resultContainer.innerHTML = `
                <div class="alimail-error">
                    ❌ Error: ${error.message}<br><br>
                    <small>Make sure the server is running:<br>
                    <code>docker-compose up -d</code></small>
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
            <div class="alimail-result-content">${escapeHtml(generatedText)}</div>
            <button class="alimail-button alimail-copy-btn" id="alimail-copy">📋 Copy to Clipboard</button>
        `;
        
        // Copy button handler
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
                // Fallback
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

    // Escape HTML for display
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check if we're on a compose/reply page
    function isComposePage() {
        return window.location.pathname.includes('/compose') || 
               window.location.hash.includes('/compose') ||
               document.querySelector('.compose-area, .reply-area, [class*="compose"], [class*="reply"]') !== null;
    }

    // Initialize
    function init() {
        // Create UI elements
        const floatingBtn = createFloatingButton();
        createOverlay();
        
        // Show/hide floating button based on page
        function updateVisibility() {
            if (isComposePage()) {
                floatingBtn.classList.remove('hidden');
            } else {
                floatingBtn.classList.add('hidden');
                const overlay = document.getElementById('alimail-reply-overlay');
                if (overlay) overlay.classList.remove('visible');
            }
        }
        
        // Check initially and on URL changes
        updateVisibility();
        
        // Watch for URL changes (SPA navigation)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                updateVisibility();
            }
        }).observe(document, { subtree: true, childList: true });
        
        // Also check periodically for dynamic page changes
        setInterval(updateVisibility, 1000);
        
        // Hide overlay on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('alimail-reply-overlay');
                if (overlay) {
                    overlay.classList.remove('visible');
                }
            }
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
