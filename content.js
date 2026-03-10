let popupContainer = null;
let conversationHistory = [];

document.addEventListener('keydown', async (e) => {
    // Listen for Alt+A or Option+A
    if (e.altKey && e.code === 'KeyA') {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Extract context (approx 250 chars before and after)
            let contextText = "";
            const container = range.commonAncestorContainer;
            const parentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;

            let fullText = parentElement.innerText || parentElement.textContent || "";
            // If parent contains very little text, try grabbing from grandparent
            if (fullText.length < 300 && parentElement.parentElement) {
                fullText = parentElement.parentElement.innerText || parentElement.parentElement.textContent || fullText;
            }

            const index = fullText.indexOf(text);
            if (index !== -1) {
                const start = Math.max(0, index - 250);
                const end = Math.min(fullText.length, index + text.length + 250);
                contextText = fullText.substring(start, end);
            } else {
                contextText = fullText.substring(0, 500); // fallback
            }

            const { theme } = await chrome.storage.sync.get({ theme: 'light' });

            conversationHistory = []; // Reset history for new popup
            showPopup(rect, text, theme);

            // Send message to background script with context
            try {
                chrome.runtime.sendMessage({ action: 'explainText', text: text, context: contextText }, (response) => {
                    if (chrome.runtime.lastError) {
                        setInitialContent('Error: Could not connect to background script. ' + chrome.runtime.lastError.message);
                    } else if (response && response.error) {
                        setInitialContent('Error: ' + response.error);
                    } else if (response && response.result) {
                        setInitialContent(response.result);
                        conversationHistory.push({ role: 'user', text: response.firstPrompt || text });
                        conversationHistory.push({ role: 'model', text: response.result });
                    } else {
                        setInitialContent('Unknown error occurred.');
                    }
                });
            } catch (err) {
                if (err.message.includes('Extension context invalidated')) {
                    setInitialContent('<strong>Error:</strong> The extension was just updated. Please <strong>refresh this webpage</strong> to continue using AI Quick Explain.');
                } else {
                    setInitialContent('Error: ' + err.message);
                }
            }
        }
    }
});

function showPopup(rect, text, theme = 'light') {
    removePopup(); // Remove existing popup if any

    popupContainer = document.createElement('div');
    popupContainer.className = 'ai-quick-explain-popup' + (theme === 'dark' ? ' ai-quick-explain-dark' : '');

    // Calculate position: just below and slightly to the right of the selection
    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;

    // Basic bounds checking for width
    if (left + 300 > window.innerWidth + window.scrollX) {
        left = window.innerWidth + window.scrollX - 320;
        if (left < window.scrollX) left = window.scrollX + 10; // Prevent going off left edge
    }

    // Basic bounds checking for height
    // Prevent the popup from going below the visible viewport
    if (rect.bottom + 350 > window.innerHeight) {
        // Put it above the selection instead
        top = window.scrollY + rect.top - 360;

        // If there isn't enough space above either, stick it to the bottom of the viewport
        if (top < window.scrollY) {
            top = window.scrollY + window.innerHeight - 360;
        }
    }

    popupContainer.style.top = `${top}px`;
    popupContainer.style.left = `${left}px`;

    popupContainer.innerHTML = `
    <div class="ai-qe-header">
      <span class="ai-qe-title">✨ AI Quick Explain</span>
      <button class="ai-qe-close-header" id="ai-qe-close">✕</button>
    </div>
    <div class="ai-qe-content" id="ai-qe-content">
      <div class="ai-qe-loading" id="ai-qe-active-loading">Thinking...</div>
    </div>
    <div class="ai-qe-footer">
      <div class="ai-qe-chat-container">
        <input type="text" class="ai-qe-chat-input" id="ai-qe-chat-input" placeholder="Ask a follow-up..." />
        <button class="ai-qe-chat-submit" id="ai-qe-chat-submit">➔</button>
      </div>
      <button class="ai-qe-btn" id="ai-qe-copy">Copy</button>
    </div>
  `;

    document.body.appendChild(popupContainer);

    document.getElementById('ai-qe-close').addEventListener('click', removePopup);
    document.getElementById('ai-qe-copy').addEventListener('click', () => {
        const content = document.getElementById('ai-qe-content').innerText;
        navigator.clipboard.writeText(content);
        const copyBtn = document.getElementById('ai-qe-copy');
        copyBtn.innerText = 'Copied!';
        setTimeout(() => copyBtn.innerText = 'Copy', 2000);
    });

    document.getElementById('ai-qe-chat-submit').addEventListener('click', handleFollowUp);
    document.getElementById('ai-qe-chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFollowUp();
    });
}

function handleFollowUp() {
    const inputField = document.getElementById('ai-qe-chat-input');
    const followUpText = inputField.value.trim();
    if (!followUpText) return;

    inputField.value = '';

    appendUserMessage(followUpText);

    const contentDiv = document.getElementById('ai-qe-content');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-qe-loading';
    loadingDiv.innerText = 'Thinking...';
    loadingDiv.id = 'ai-qe-active-loading';
    contentDiv.appendChild(loadingDiv);
    contentDiv.scrollTop = contentDiv.scrollHeight;

    try {
        chrome.runtime.sendMessage({ action: 'explainText', text: followUpText, history: conversationHistory }, (response) => {
            document.getElementById('ai-qe-active-loading')?.remove();

            if (chrome.runtime.lastError) {
                appendModelMessage('Error: Could not connect to background script. ' + chrome.runtime.lastError.message);
            } else if (response && response.error) {
                appendModelMessage('Error: ' + response.error);
            } else if (response && response.result) {
                appendModelMessage(response.result);
                conversationHistory.push({ role: 'user', text: followUpText });
                conversationHistory.push({ role: 'model', text: response.result });
            } else {
                appendModelMessage('Unknown error occurred.');
            }
        });
    } catch (err) {
        document.getElementById('ai-qe-active-loading')?.remove();
        if (err.message.includes('Extension context invalidated')) {
            appendModelMessage('<strong>Error:</strong> The extension was just updated. Please <strong>refresh this webpage</strong>. ');
        } else {
            appendModelMessage('Error: ' + err.message);
        }
    }
}

function setInitialContent(markdownText) {
    if (!popupContainer) return;
    const contentDiv = document.getElementById('ai-qe-content');
    if (contentDiv) {
        contentDiv.innerHTML = `<div class="ai-qe-msg-model">${formatMarkdown(markdownText)}</div>`;
    }
}

function appendModelMessage(markdownText) {
    if (!popupContainer) return;
    const contentDiv = document.getElementById('ai-qe-content');
    if (contentDiv) {
        const div = document.createElement('div');
        div.className = 'ai-qe-msg-model';
        div.style.marginTop = '12px';
        div.innerHTML = formatMarkdown(markdownText);
        contentDiv.appendChild(div);
        contentDiv.scrollTop = contentDiv.scrollHeight;
    }
}

function appendUserMessage(text) {
    if (!popupContainer) return;
    const contentDiv = document.getElementById('ai-qe-content');
    if (contentDiv) {
        const div = document.createElement('div');
        div.className = 'ai-qe-msg-user';
        div.innerText = text;
        contentDiv.appendChild(div);
        contentDiv.scrollTop = contentDiv.scrollHeight;
    }
}

function formatMarkdown(markdownText) {
    // 1. Escape HTML
    let text = markdownText
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 2. Identify and format Code Blocks first, and replace them with a placeholder
    const codeBlocks = [];
    text = text.replace(/```([\w]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const langDisplay = lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Code';

        // Safe, single-pass syntax highlighting to prevent overlapping HTML tags
        let highlightedCode = code.replace(
            /((?:&quot;|").*?(?:&quot;|")|'.*?')|((?:\/\/|#).*?(?=\n|$))|\b(True|False|None|true|false|null|undefined)\b|\b(def|class|if|else|elif|for|while|in|return|import|from|const|let|var|function|async|await|try|catch)\b|\b(\d+)\b|\b([a-zA-Z_]\w*)(?=\()/g,
            (match, str, com, bool, kw, num, func) => {
                if (str) return `<span class="ai-qe-str">${str}</span>`;
                if (com) return `<span class="ai-qe-com">${com}</span>`;
                if (bool) return `<span class="ai-qe-bool">${bool}</span>`;
                if (kw) return `<span class="ai-qe-kw">${kw}</span>`;
                if (num) return `<span class="ai-qe-num">${num}</span>`;
                if (func) return `<span class="ai-qe-func">${func}</span>`;
                return match;
            }
        );

        const block = `<div class="ai-qe-code-container">
            <div class="ai-qe-code-header">
                <span class="ai-qe-code-icon">&lt;/&gt;</span>
                <span class="ai-qe-code-lang">${langDisplay}</span>
            </div>
            <pre><code>${highlightedCode}</code></pre>
        </div>`;
        codeBlocks.push(block);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 3. Fallback for inline code blocks without lang formatting
    text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
        const block = `<pre><code>${code}</code></pre>`;
        codeBlocks.push(block);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 4. Format the rest of markdown
    text = text
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
        .replace(/\n{2,}/g, '<br><br>')
        .replace(/\n/g, '<br>');

    // 5. Restore code blocks
    for (let i = 0; i < codeBlocks.length; i++) {
        text = text.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
    }

    return text;
}

function removePopup() {
    if (popupContainer) {
        popupContainer.remove();
        popupContainer = null;
    }
}

// Remove popup if user clicks outside of it
document.addEventListener('mousedown', (e) => {
    if (popupContainer && !popupContainer.contains(e.target)) {
        removePopup();
    }
});
