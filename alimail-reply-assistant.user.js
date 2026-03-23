// ==UserScript==
// @name         Alimail Reply Assistant
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto-generate professional email replies for Alimail webmail
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

    // CSS Styles - Matching Cantonese Romanizer look and feel
    const styles = `
        #alimail-reply-overlay {
            position: fixed;
            z-index: 999999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            max-width: 500px;
            width: 400px;
            max-height: 85vh;
            display: none;
            cursor: move;
            user-select: text;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            overflow: hidden;
        }
        
        #alimail-reply-overlay.visible {
            display: block;
            animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
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
            max-height: calc(85vh - 120px);
            overflow-y: auto;
        }
        
        #alimail-reply-overlay .alimail-content::-webkit-scrollbar {
            width: 6px;
        }
        
        #alimail-reply-overlay .alimail-content::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
        }
        
        #alimail-reply-overlay .alimail-content::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
        }
        
        #alimail-reply-overlay .alimail-section {
            margin-bottom: 12px;
        }
        
        #alimail-reply-overlay .alimail-label {
            font-size: 11px;
            opacity: 0.8;
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
            resize: vertical;
        }
        
        #alimail-reply-overlay .alimail-input::placeholder {
            color: rgba(255,255,255,0.5);
        }
        
        #alimail-reply-overlay .alimail-input:focus {
            outline: none;
            background: rgba(255,255,255,0.2);
        }
        
        #alimail-reply-overlay textarea.alimail-input {
            min-height: 80px;
            max-height: 150px;
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
        }
        
        #alimail-reply-overlay .alimail-generate-btn:hover:not(:disabled) {
            background: rgba(100,255,100,0.35);
        }
        
        #alimail-reply-overlay .alimail-result {
            background: rgba(0,0,0,0.25);
            padding: 12px;
            border-radius: 6px;
            margin-top: 12px;
            white-space: pre-wrap;
            line-height: 1.6;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        #alimail-reply-overlay .alimail-copy-btn {
            margin-top: 10px;
            width: 100%;
            background: rgba(100,150,255,0.3);
        }
        
        #alimail-reply-overlay .alimail-copy-btn:hover:not(:disabled) {
            background: rgba(100,150,255,0.4);
        }
        
        #alimail-reply-overlay .alimail-copy-btn.copied {
            background: rgba(100,255,100,0.3);
        }
        
        #alimail-reply-overlay .alimail-loading {
            text-align: center;
            padding: 20px;
            font-size: 14px;
        }
        
        #alimail-reply-overlay .alimail-error {
            background: rgba(255,100,100,0.3);
            padding: 10px;
            border-radius: 6px;
            font-size: 12px;
            line-height: 1.4;
            margin-top: 10px;
        }
        
        #alimail-reply-overlay .alimail-original-preview {
            background: rgba(255,255,255,0.1);
            padding: 8px;
            border-radius: 4px;
            font-size: 11px;
            max-height: 60px;
            overflow-y: auto;
            opacity: 0.9;
            line-height: 1.4;
        }
        
        #alimail-reply-overlay .alimail-row {
            display: flex;
            gap: 8px;
        }
        
        #alimail-reply-overlay .alimail-col {
            flex: 1;
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

    // Create overlay element
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'alimail-reply-overlay';
        overlay.innerHTML = `
            <div class="alimail-header">
                <span>📝 AI Reply Assistant</span>
                <span class="alimail-close" title="Close">✕</span>
            </div>
            <div class="alimail-content">
                <div class="alimail-section">
                    <div class="alimail-label">Original Email Preview:</div>
                    <div class="alimail-original-preview" id="alimail-original-text">Loading...</div>
                </div>
                <div class="alimail-section">
                    <div class="alimail-label">Your Points (bullet points or notes):</div>
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
                <div class="alimail-section" style="margin-top: 12px;">
                    <button class="alimail-button alimail-generate-btn" id="alimail-generate">✨ Generate Reply</button>
                </div>
                <div id="alimail-result-container"></div>
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

        // Make draggable
        makeDraggable(overlay);

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
                // Position near the button
                const btnRect = btn.getBoundingClientRect();
                overlay.style.top = 'auto';
                overlay.style.bottom = (window.innerHeight - btnRect.top + 10) + 'px';
                overlay.style.right = '20px';
                overlay.style.left = 'auto';
            }
        });

        return btn;
    }

    // Make element draggable
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('.alimail-header');
        
        (header || element).onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (e.target.classList.contains('alimail-close')) return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;
            
            // Keep within viewport
            const rect = element.getBoundingClientRect();
            newTop = Math.max(10, Math.min(newTop, window.innerHeight - rect.height - 10));
            newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - rect.width - 10));
            
            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
            element.style.bottom = 'auto';
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Extract original email content from Alimail compose page
    function extractOriginalEmail() {
        // Try multiple selectors to find the original email content
        // Alimail may have different structures depending on the view
        
        // Method 1: Look for the quoted email content in reply
        const quotedSelectors = [
            '.email-content-body',
            '.mail-body',
            '.message-body',
            '[class*="body"]',
            '.content-editable',
            '.email-body'
        ];
        
        for (const selector of quotedSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim().length > 50) {
                return el.textContent.trim();
            }
        }
        
        // Method 2: Look for iframe content (common in webmail)
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
        
        // Method 3: Get all visible text in the main content area
        const mainContent = document.querySelector('.main-content, .content, #content, .container');
        if (mainContent) {
            return mainContent.textContent.trim().substring(0, 2000);
        }
        
        return '';
    }

    // Update the original email preview in the overlay
    function updateOriginalEmail() {
        const originalText = extractOriginalEmail();
        const previewEl = document.getElementById('alimail-original-text');
        if (previewEl) {
            if (originalText) {
                // Show first 200 chars with ellipsis if longer
                const preview = originalText.length > 200 
                    ? originalText.substring(0, 200) + '...' 
                    : originalText;
                previewEl.textContent = preview;
                previewEl.dataset.fullText = originalText;
            } else {
                previewEl.textContent = 'Could not extract original email. Please paste it manually in the notes if needed.';
                previewEl.dataset.fullText = '';
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
        const previewEl = document.getElementById('alimail-original-text');
        const originalEmail = previewEl ? (previewEl.dataset.fullText || previewEl.textContent) : '';
        const resultContainer = document.getElementById('alimail-result-container');
        const generateBtn = document.getElementById('alimail-generate');
        
        if (!userInput) {
            resultContainer.innerHTML = '<div class="alimail-error">Please enter some points for the reply.</div>';
            return;
        }
        
        // Show loading
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Generating...';
        resultContainer.innerHTML = '<div class="alimail-loading">✨ Generating professional reply...</div>';
        
        try {
            const response = await callGenerateAPI(originalEmail, userInput, tone, language);
            showResult(response.generated_reply);
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
            <div class="alimail-section">
                <div class="alimail-label">Generated Reply:</div>
                <div class="alimail-result">${escapeHtml(generatedText)}</div>
                <button class="alimail-button alimail-copy-btn" id="alimail-copy">📋 Copy to Clipboard</button>
            </div>
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
                // Fallback for older browsers
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
