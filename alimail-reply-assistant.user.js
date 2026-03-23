// ==UserScript==
// @name         Alimail Reply Assistant
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Auto-generate professional email replies for Alimail webmail - Theme-aware 2 Column Layout
// @author       luisarn
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

    // Theme definitions matching Alimail themes
    const THEMES = {
        black: {
            primary: '#3a3a3a',
            primaryHover: '#2a2a2a',
            buttonText: '#ffffff',
            copyBtn: '#4a4a4a',
            copyBtnHover: '#3a3a3a'
        },
        silver: {
            primary: '#5f6368',
            primaryHover: '#494c50',
            buttonText: '#ffffff',
            copyBtn: '#1557b0',
            copyBtnHover: '#1557b0'
        },
        blue: {
            primary: '#4a90d9',
            primaryHover: '#357abd',
            buttonText: '#ffffff',
            copyBtn: '#34a853',
            copyBtnHover: '#2d8e47'
        },
        red: {
            primary: '#d9534f',
            primaryHover: '#c9302c',
            buttonText: '#ffffff',
            copyBtn: '#5cb85c',
            copyBtnHover: '#449d44'
        },
        gold: {
            primary: '#c4a35a',
            primaryHover: '#a88b4a',
            buttonText: '#ffffff',
            copyBtn: '#4a90d9',
            copyBtnHover: '#357abd'
        },
        green: {
            primary: '#3d8b5a',
            primaryHover: '#2d6b45',
            buttonText: '#ffffff',
            copyBtn: '#4a90d9',
            copyBtnHover: '#357abd'
        },
        lakeBlue: {
            primary: '#3a8aa5',
            primaryHover: '#2d6f87',
            buttonText: '#ffffff',
            copyBtn: '#34a853',
            copyBtnHover: '#2d8e47'
        },
        pink: {
            primary: '#d64d7a',
            primaryHover: '#b53a63',
            buttonText: '#ffffff',
            copyBtn: '#4a90d9',
            copyBtnHover: '#357abd'
        },
        // Default fallback
        default: {
            primary: '#fff',
            primaryHover: '#ffffff',
            buttonText: '#3a3a3a',
            copyBtn: '#fff',
            copyBtnHover: '#fff'
        }
    };

    // Detect current Alimail theme
    function detectTheme() {
        // First, try #app-body background color (theme control element)
        const appBody = document.getElementById('app-body');
        if (appBody) {
            const bgColor = window.getComputedStyle(appBody).backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                return matchColorToTheme(bgColor);
            }
        }
        
        // Fallback: try other header selectors
        const possibleHeaders = [
            '.header-container',
            '.mail-header',
            '.alimail-header',
            '.nav-header',
            '[class*="header"]',
            '.top-bar',
            '.navbar'
        ];
        
        for (const selector of possibleHeaders) {
            const header = document.querySelector(selector);
            if (header) {
                const bgColor = window.getComputedStyle(header).backgroundColor;
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    return matchColorToTheme(bgColor);
                }
            }
        }
        
        // Try to find any element with theme-specific classes
        const themeClasses = ['theme-black', 'theme-silver', 'theme-blue', 'theme-red', 
                              'theme-gold', 'theme-green', 'theme-lake-blue', 'theme-pink'];
        for (const cls of themeClasses) {
            if (document.querySelector('.' + cls) || document.body.classList.contains(cls)) {
                return cls.replace('theme-', '').replace('-', '');
            }
        }
        
        return 'default';
    }

    // Match RGB color to closest theme
    function matchColorToTheme(rgbColor) {
        // Parse RGB values
        const match = rgbColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return 'default';
        
        const [_, r, g, b] = match.map(Number);
        
        // Calculate distances to theme colors
        const themeColors = {
            black: { r: 58, g: 58, b: 58 },
            blue: { r: 74, g: 144, b: 217 },
            red: { r: 217, g: 83, b: 79 },
            gold: { r: 196, g: 163, b: 90 },
            green: { r: 61, g: 139, b: 90 },
            lakeBlue: { r: 58, g: 138, b: 165 },
            pink: { r: 214, g: 77, b: 122 }
        };
        
        // Check if it's light (silver theme)
        const brightness = (r + g + b) / 3;
        if (brightness > 200) return 'silver';
        
        let closestTheme = 'default';
        let minDistance = Infinity;
        
        for (const [theme, color] of Object.entries(themeColors)) {
            const distance = Math.sqrt(
                Math.pow(r - color.r, 2) + 
                Math.pow(g - color.g, 2) + 
                Math.pow(b - color.b, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestTheme = theme;
            }
        }
        
        return closestTheme;
    }

    // Get current theme colors
    function getCurrentThemeColors() {
        const themeName = detectTheme();
        return THEMES[themeName] || THEMES.default;
    }

    // Apply theme to the overlay
    function applyTheme() {
        const colors = getCurrentThemeColors();
        const overlay = document.getElementById('alimail-reply-overlay');
        if (!overlay) return;
        
        const header = overlay.querySelector('.alimail-header');
        const buttons = overlay.querySelectorAll('.alimail-button:not(.alimail-copy-btn)');
        const copyBtn = overlay.querySelector('.alimail-copy-btn');
        
        if (header) {
            header.style.background = colors.primary;
        }
        
        buttons.forEach(btn => {
            btn.style.background = colors.primary;
            btn.style.color = colors.buttonText;
            btn.onmouseenter = () => btn.style.background = colors.primaryHover;
            btn.onmouseleave = () => btn.style.background = colors.primary;
        });
        
        if (copyBtn) {
            copyBtn.style.background = colors.copyBtn;
            copyBtn.onmouseenter = () => copyBtn.style.background = colors.copyBtnHover;
            copyBtn.onmouseleave = () => copyBtn.style.background = colors.copyBtn;
        }
    }

    // CSS Styles - Theme-aware 2 Column Layout
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
            width: 95vw;
            max-width: 900px;
            height: 85vh;
            max-height: 610px;
            display: none;
            cursor: default;
            user-select: text;
            border: 1px solid #e0e0e0;
            overflow: hidden;
        }
        
        @media (max-width: 768px) {
            #alimail-reply-overlay {
                width: 100vw;
                height: 100vh;
                max-width: 100vw;
                max-height: 100vh;
                border-radius: 0;
            }
            
            #alimail-reply-overlay .alimail-content {
                flex-direction: column;
            }
            
            #alimail-reply-overlay .alimail-column:first-child {
                border-right: none;
                border-bottom: 1px solid #e8eaed;
                max-height: 50%;
            }
            
            #alimail-reply-overlay .alimail-column {
                max-height: 50%;
            }
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
        
        /* Header */
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
            transition: background 0.3s;
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
            margin-bottom: 16px;
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
            transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
            font-family: inherit;
        }
        
        #alimail-reply-overlay .alimail-button:hover {
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        #alimail-reply-overlay .alimail-button:active {
            transform: translateY(1px);
        }
        
        #alimail-reply-overlay .alimail-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
        }
        
        #alimail-reply-overlay .alimail-generate-btn {
            width: 100%;
            margin-top: auto;
            margin-bottom: 16px;
            padding: 12px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #alimail-reply-overlay .alimail-copy-btn {
            background: #ffffff;
            color: #202124;
            border: 1px solid #dadce0;
        }
        
        #alimail-reply-overlay .alimail-copy-btn:hover:not(:disabled) {
            background: #f8f9fa;
            border-color: #bdc1c6;
        }
        
        #alimail-reply-overlay .alimail-copy-btn.copied {
            background: #34a853;
            color: white;
            border-color: #34a853;
        }
        
        #alimail-reply-overlay .alimail-insert-btn {
            background: rgb(239, 73, 68) !important;
            color: white !important;
        }
        
        #alimail-reply-overlay .alimail-insert-btn:hover:not(:disabled) {
            background: rgb(220, 60, 55) !important;
        }
        
        #alimail-reply-overlay .alimail-insert-btn.inserted {
            
        }
        
        #alimail-reply-overlay .alimail-button-row {
            display: flex;
            gap: 8px;
            margin-top: 16px;
            align-items: center;
        }
        
        #alimail-reply-overlay .alimail-button-row .alimail-button {
            flex: 1;
            margin-top: 0;
            display: flex;
            align-items: center;
            justify-content: center;
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
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #5f6368;
            gap: 12px;
        }
        
        #alimail-reply-overlay .alimail-loading::before {
            content: '';
            display: block;
            width: 24px;
            height: 24px;
            border: 2px solid #e8eaed;
            border-top-color: currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            order: -1;
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

        /* AI Toolbar Button - Matches Alimail toolbar style */
        #alimail-ai-toolbar-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        
        #alimail-ai-toolbar-btn:hover {
            background-color: rgba(0,0,0,0.05);
        }
        
        #alimail-ai-toolbar-btn .ai-icon {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: #666;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        #alimail-ai-toolbar-btn:hover .ai-icon {
            color: #333;
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

    // Create overlay element
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'alimail-reply-overlay';
        overlay.innerHTML = `
            <div class="alimail-header">
                <span>AI Reply Assistant</span>
                <span class="alimail-close" title="Close (Esc)">✕</span>
            </div>
            <div class="alimail-content">
                <!-- Left Column: Input (Original Email + Key Points) -->
                <div class="alimail-column">
                    <div class="alimail-column-header">
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
                                    <option value="chinese" selected>繁體中文</option>
                                    <option value="english">English</option>
                                    <option value="portuguese">Portuguese</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Generate Button -->
                        <button class="alimail-button alimail-generate-btn" id="alimail-generate">Generate Reply</button>
                    </div>
                </div>
                
                <!-- Right Column: Generated Reply -->
                <div class="alimail-column">
                    <div class="alimail-column-header">
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

        // Apply theme
        applyTheme();

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

    // Create toolbar button (inserted into Alimail's toolbar)
    function createToolbarButton() {
        // Find the toolbar
        const toolbar = document.querySelector('.e_editor_toolbar');
        if (!toolbar) return null;

        // Find the subscript button (the one before where we want to insert)
        const subscriptBtn = document.getElementById('sqm_339') || 
                            document.querySelector('[_id="subscript"]') ||
                            toolbar.querySelector('.e_i_subscript')?.closest('.e_editor_toolbar_item');
        
        if (!subscriptBtn) return null;

        // Create separator element
        const separator = document.createElement('div');
        separator.id = 'alimail-ai-separator';
        separator.className = 'e_editor_toolbar_item e_editor_toolbar_separator';
        separator.setAttribute('_id', 'separator');
        separator.innerHTML = '<div class="e_editor_toolbar_separator_b"></div>';

        // Create AI button matching Alimail's toolbar style
        const aiBtn = document.createElement('div');
        aiBtn.id = 'alimail-ai-toolbar-btn';
        aiBtn.className = 'e_editor_toolbar_item e_editor_toolbar_b_wrap e_editor_toolbar_w';
        aiBtn.setAttribute('_id', 'aireply');
        aiBtn.setAttribute('_clk', 'exec');
        aiBtn.setAttribute('title', 'AI Reply Assistant');
        aiBtn.setAttribute('jstype', 'ToolbarCommonButton');
        aiBtn.innerHTML = '<b class="e_i e_i_fs16 e_i_hover ai-icon" style="font-style: normal;">AI</b>';

        // Insert separator and AI button after subscript button
        subscriptBtn.insertAdjacentElement('afterend', separator);
        separator.insertAdjacentElement('afterend', aiBtn);

        // Add click handler
        aiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const overlay = document.getElementById('alimail-reply-overlay') || createOverlay();
            if (overlay.classList.contains('visible')) {
                overlay.classList.remove('visible');
            } else {
                updateOriginalEmail();
                overlay.classList.add('visible');
                applyTheme();
            }
        });

        return aiBtn;
    }

    // Remove toolbar button and separator if they exist
    function removeToolbarButton() {
        const btn = document.getElementById('alimail-ai-toolbar-btn');
        const separator = document.getElementById('alimail-ai-separator');
        if (btn) btn.remove();
        if (separator) separator.remove();
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
        const colors = getCurrentThemeColors();
        
        if (!userInput) {
            resultContainer.innerHTML = '<div class="alimail-error">Please enter some key points for the reply.</div>';
            return;
        }
        
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Generating...';
        resultContainer.innerHTML = '<div class="alimail-loading">Generating your reply</div>';
        
        try {
            const response = await callGenerateAPI(originalEmail, userInput, tone, language);
            generatedReplyText = response.generated_reply;
            showResult(generatedReplyText, colors);
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
            generateBtn.textContent = 'Generate Reply';
        }
    }

    // Insert text into Alimail email body
    function insertIntoEmailBody(text) {
        // Try to find the email compose editor iframe first (Alimail uses e_iframe e_scroll)
        const iframeSelectors = [
            'iframe.e_iframe.e_scroll',
            '.e_editor iframe',
            'iframe[src="javascript:document.open();document.close();"]',
            '.compose-editor iframe',
            '.mail-editor iframe',
            'iframe[class*="editor"]',
            'iframe[allowtransparency="true"]'
        ];
        
        for (const selector of iframeSelectors) {
            const iframes = document.querySelectorAll(selector);
            for (const iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!iframeDoc) continue;
                    
                    // Alimail editor body is usually the iframe's body with contenteditable="true"
                    const body = iframeDoc.body;
                    if (body && body.getAttribute('contenteditable') === 'true') {
                        insertTextAtCursor(body, text, iframeDoc);
                        return true;
                    }
                    
                    // Or find contenteditable element inside
                    const contentEditable = iframeDoc.querySelector('[contenteditable="true"]');
                    if (contentEditable) {
                        insertTextAtCursor(contentEditable, text, iframeDoc);
                        return true;
                    }
                } catch (e) {
                    // Cross-origin or other issue
                    continue;
                }
            }
        }
        
        // Fallback: try other editor selectors
        const editorSelectors = [
            '.e_editor_body',
            '[contenteditable="true"]',
            '.mail-body-editable',
            '.compose-body',
            '.reply-body',
            '.email-body'
        ];
        
        for (const selector of editorSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
                    insertTextAtCursor(el, text, document);
                    return true;
                }
            }
        }
        
        // Fallback: try to find any contenteditable area in the document
        const contentEditables = document.querySelectorAll('[contenteditable="true"]');
        for (const el of contentEditables) {
            if (el.offsetParent !== null && el.textContent.length < 10000) {
                insertTextAtCursor(el, text, document);
                return true;
            }
        }
        
        return false;
    }
    
    // Helper to insert text at cursor position
    function insertTextAtCursor(element, text, doc) {
        doc = doc || document;
        const win = doc.defaultView || window;
        
        // Focus the element first
        element.focus();
        
        // Get selection from the correct document
        const selection = win.getSelection();
        
        // Check if we have a valid selection within this element
        let range = null;
        if (selection.rangeCount > 0) {
            const currentRange = selection.getRangeAt(0);
            // Check if the selection is inside our element
            if (element.contains(currentRange.commonAncestorContainer)) {
                range = currentRange;
            }
        }
        
        // If no valid range, create one at the end of the element
        if (!range) {
            range = doc.createRange();
            range.selectNodeContents(element);
            range.collapse(false); // Collapse to end
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        // Delete any selected content
        range.deleteContents();
        
        // Create fragment with the text (preserve line breaks)
        const lines = text.split('\n');
        const fragment = doc.createDocumentFragment();
        
        lines.forEach((line, index) => {
            if (line) {
                fragment.appendChild(doc.createTextNode(line));
            }
            if (index < lines.length - 1) {
                fragment.appendChild(doc.createElement('br'));
            }
        });
        
        // Insert the fragment
        range.insertNode(fragment);
        
        // Move cursor after inserted text
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event to notify Alimail of the change
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
    }

    // Show generated result
    function showResult(generatedText, colors) {
        const resultContainer = document.getElementById('alimail-result-container');
        colors = colors || getCurrentThemeColors();
        
        resultContainer.innerHTML = `
            <div class="alimail-result-box">${escapeHtml(generatedText)}</div>
            <div class="alimail-button-row">
                <button class="alimail-button alimail-copy-btn" id="alimail-copy">Copy</button>
                <button class="alimail-button alimail-insert-btn" id="alimail-insert">Insert to Email</button>
            </div>
        `;
        
        // Copy button handler
        const copyBtn = document.getElementById('alimail-copy');
        copyBtn.addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(generatedText);
                this.textContent = '✅ Copied!';
                setTimeout(() => {
                    this.textContent = 'Copy';
                }, 2000);
            } catch (err) {
                const textArea = document.createElement('textarea');
                textArea.value = generatedText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.textContent = '✅ Copied!';
                setTimeout(() => {
                    this.textContent = 'Copy';
                }, 2000);
            }
        });
        // Copy button hover effects are handled by CSS
        copyBtn.addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(generatedText);
                this.textContent = 'Copied!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.textContent = 'Copy';
                    this.classList.remove('copied');
                }, 2000);
            } catch (err) {
                const textArea = document.createElement('textarea');
                textArea.value = generatedText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.textContent = 'Copied!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.textContent = 'Copy';
                    this.classList.remove('copied');
                }, 2000);
            }
        });
        
        // Insert button handler
        const insertBtn = document.getElementById('alimail-insert');
        insertBtn.addEventListener('click', function() {
            const success = insertIntoEmailBody(generatedText);
            if (success) {
                this.textContent = 'Inserted!';
                this.classList.add('inserted');
                setTimeout(() => {
                    this.textContent = 'Insert to Email';
                    this.classList.remove('inserted');
                }, 2000);
            } else {
                this.textContent = '❌ Failed';
                setTimeout(() => {
                    this.textContent = 'Insert to Email';
                }, 2000);
            }
        });
        // Insert button hover effects are handled by CSS
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
        createOverlay();
        
        // Track toolbar button
        let toolbarBtn = null;
        
        function updateVisibility() {
            const isCompose = isComposePage();
            if (isCompose) {
                // Add toolbar button if not present
                if (!document.getElementById('alimail-ai-toolbar-btn')) {
                    toolbarBtn = createToolbarButton();
                }
            } else {
                // Remove toolbar button and close overlay
                removeToolbarButton();
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
