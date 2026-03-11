let popupContainer = null;
let conversationHistory = [];
let currentNoteId = null;
let currentNoteText = "";

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

            // Check if already in an annotation
            const parentAnnot = parentElement.closest('.ai-annotated');
            if (parentAnnot) {
                // Open existing annotation
                const id = parentAnnot.dataset.aiId;
                openAICard(id, parentAnnot);
                return;
            }

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

            // Wrap selection in .ai-annotated span
            _ppPauseMutations = true;
            const span = document.createElement('span');
            span.className = 'ai-annotated ai-annotated-active';
            const noteId = 'ai-note-' + Date.now();
            span.dataset.aiId = noteId;
            span.title = "AI explanation available (click to open)";

            try {
                range.surroundContents(span);
            } catch (err) {
                span.appendChild(range.extractContents());
                range.insertNode(span);
            }
            selection.removeAllRanges();
            setTimeout(() => { _ppPauseMutations = false; }, 200);

            const { theme } = await chrome.storage.sync.get({ theme: 'light' });

            conversationHistory = []; // Reset history for new popup
            currentNoteId = noteId;
            currentNoteText = text;

            // Save empty stub to storage first
            saveAnnotation(currentNoteId, currentNoteText, "", []);

            showPopup(span.getBoundingClientRect(), text, theme, currentNoteId);

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
                        saveAnnotation(currentNoteId, currentNoteText, response.result, conversationHistory);
                    } else {
                        setInitialContent('Unknown error occurred.');
                    }
                });
            } catch (err) {
                if (err.message.includes('Extension context invalidated')) {
                    setInitialContent('<strong>Error:</strong> The extension was just updated. Please <strong>refresh this webpage</strong> to continue using peekPeak.');
                } else {
                    setInitialContent('Error: ' + err.message);
                }
            }
        }
    }
});

function showPopup(rect, text, theme = 'light', noteId = null) {
    if (popupContainer) {
        removePopup();
    }

    popupContainer = document.createElement('div');
    popupContainer.className = 'ai-quick-explain-popup' + (theme === 'dark' ? ' ai-quick-explain-dark' : '');

    // Calculate position: just below and slightly to the right of the selection
    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;

    let isAbove = false;

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
        isAbove = true;

        // If there isn't enough space above either, stick it to the bottom of the viewport
        if (top < window.scrollY) {
            top = window.scrollY + window.innerHeight - 360;
            isAbove = false;
        }
    }

    if (isAbove) {
        popupContainer.classList.add('ai-qe-pos-above');
    } else {
        popupContainer.classList.add('ai-qe-pos-below');
    }

    popupContainer.style.top = `${top}px`;
    popupContainer.style.left = `${left}px`;

    popupContainer.innerHTML = `
    <div class="ai-qe-inner">
      <div class="ai-qe-header">
        <span class="ai-qe-title">peekPeak</span>
        <div class="ai-qe-header-actions">
           <button class="ai-qe-action-btn" id="ai-qe-minimize" title="Minimize">–</button>
           <button class="ai-qe-action-btn" id="ai-qe-close" title="Delete">✕</button>
        </div>
      </div>
      <div class="ai-qe-content" id="ai-qe-content">
        <div class="ai-qe-loading" id="ai-qe-active-loading">Thinking...</div>
      </div>
      <div class="ai-qe-footer">
        <div class="ai-qe-chat-container">
          <input type="text" class="ai-qe-chat-input" id="ai-qe-chat-input" placeholder="Ask a follow-up..." />
          <button class="ai-qe-chat-submit" id="ai-qe-chat-submit" aria-label="Send message">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V20M12 4L6 10M12 4L18 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <button class="ai-qe-btn" id="ai-qe-copy">Copy</button>
      </div>
    </div>
  `;

    document.body.appendChild(popupContainer);

    // Give it a tiny delay to ensure animation plays if it was previously removed
    requestAnimationFrame(() => {
        popupContainer.classList.remove('ai-qe-hidden');
    });

    document.getElementById('ai-qe-minimize').addEventListener('click', () => minimizeCard(noteId));
    document.getElementById('ai-qe-close').addEventListener('click', () => deleteAnnotation(noteId));
    document.getElementById('ai-qe-copy').addEventListener('click', () => {
        const content = document.getElementById('ai-qe-content').innerText;
        navigator.clipboard.writeText(content);
        const copyBtn = document.getElementById('ai-qe-copy');
        copyBtn.innerText = 'Copied!';
        setTimeout(() => copyBtn.innerText = 'Copy', 2000);
    });

    document.getElementById('ai-qe-chat-submit').addEventListener('click', handleFollowUp);

    const chatInput = document.getElementById('ai-qe-chat-input');
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFollowUp();
    });
    chatInput.addEventListener('input', (e) => {
        const btn = document.getElementById('ai-qe-chat-submit');
        if (e.target.value.trim().length > 0) {
            btn.classList.add('ai-qe-show');
        } else {
            btn.classList.remove('ai-qe-show');
        }
    });
}

function handleFollowUp() {
    const inputField = document.getElementById('ai-qe-chat-input');
    const submitBtn = document.getElementById('ai-qe-chat-submit');
    const followUpText = inputField.value.trim();
    if (!followUpText) return;

    inputField.value = '';
    if (submitBtn) {
        submitBtn.classList.remove('ai-qe-show');
    }

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
                if (currentNoteId) saveAnnotation(currentNoteId, currentNoteText, response.result, conversationHistory);
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

// Use mousedown with capture phase to prevent SPAs from swallowing the event
document.addEventListener('mousedown', (e) => {
    if (e.target.closest && e.target.closest(".ai-annotated")) {
        e.stopPropagation();
        const span = e.target.closest('.ai-annotated');
        const id = span.dataset.aiId;
        openAICard(id, span);
    } else if (popupContainer && !popupContainer.contains(e.target)) {
        if (!popupContainer.classList.contains('ai-qe-hidden') && currentNoteId) {
            minimizeCard(currentNoteId);
        }
    }
}, true);

/* ===== Annotation Helper Functions ===== */

function minimizeCard(id) {
    if (popupContainer) {
        popupContainer.classList.add('ai-qe-hidden');
    }
    document.querySelectorAll('.ai-annotated').forEach(el => el.classList.remove('ai-annotated-active'));
}

function deleteAnnotation(id) {
    _ppPauseMutations = true;
    removePopup();
    const span = document.querySelector(`.ai-annotated[data-ai-id="${id}"]`);
    if (span) {
        const parent = span.parentNode;
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
        parent.normalize();
    }
    const url = window.location.href.split('#')[0];
    chrome.storage.local.get({ annotations: {} }, (data) => {
        const ann = data.annotations;
        if (ann[url] && ann[url][id]) {
            delete ann[url][id];
            chrome.storage.local.set({ annotations: ann });
        }
    });
    setTimeout(() => { _ppPauseMutations = false; }, 100);
}

function saveAnnotation(id, text, resultHTML, history) {
    if (!id) return;
    const url = window.location.href.split('#')[0];
    chrome.storage.local.get({ annotations: {} }, (data) => {
        const ann = data.annotations;
        if (!ann[url]) ann[url] = {};
        ann[url][id] = {
            id: id,
            text: text,
            response: resultHTML || '',
            history: history || []
        };
        chrome.storage.local.set({ annotations: ann });
    });
}

function openAICard(id, spanElement) {
    const url = window.location.href.split('#')[0];
    // Theme is in sync storage, annotations are in local storage
    chrome.storage.sync.get({ theme: 'light' }, (syncData) => {
        const theme = syncData.theme;
        chrome.storage.local.get({ annotations: {} }, (data) => {
            const ann = data.annotations ? data.annotations[url] : null;
            if (ann && ann[id]) {
                const note = ann[id];
                currentNoteId = id;
                currentNoteText = note.text;
                conversationHistory = note.history || [];

                document.querySelectorAll('.ai-annotated').forEach(el => el.classList.remove('ai-annotated-active'));
                if (spanElement) spanElement.classList.add('ai-annotated-active');

                const rect = spanElement ? spanElement.getBoundingClientRect() : { bottom: 0, left: 0, top: 0 };
                showPopup(rect, note.text, theme, id);

            if (conversationHistory.length > 0) {
                const contentDiv = document.getElementById('ai-qe-content');
                contentDiv.innerHTML = '';
                conversationHistory.forEach((msg, idx) => {
                    if (idx === 0 && msg.role === 'user') return;
                    if (msg.role === 'model') {
                        appendModelMessage(msg.text);
                    } else {
                        appendUserMessage(msg.text);
                    }
                });
            } else if (note.response) {
                setInitialContent(note.response);
            }
            }
        });
    });
}

/* ===== Error-Proof Annotation Restoration System ===== */

// Guard flag: when true, the MutationObserver won't trigger restoreAnnotations
let _ppPauseMutations = false;

// Debounce timer
let _ppRestoreTimer = null;

// Track the last known URL for SPA navigation detection
let _ppLastUrl = window.location.href.split('#')[0];

// MutationObserver: only react when *our* spans might have been removed
const _ppObserver = new MutationObserver((mutations) => {
    if (_ppPauseMutations) return;

    // Check if any removed nodes contained our annotations
    let lostAnnotation = false;
    for (const mutation of mutations) {
        for (const removed of mutation.removedNodes) {
            if (removed.nodeType === Node.ELEMENT_NODE) {
                if (removed.classList && removed.classList.contains('ai-annotated')) {
                    lostAnnotation = true;
                    break;
                }
                if (removed.querySelector && removed.querySelector('.ai-annotated')) {
                    lostAnnotation = true;
                    break;
                }
            }
        }
        if (lostAnnotation) break;
    }

    // Also check for SPA URL changes
    const currentUrl = window.location.href.split('#')[0];
    if (currentUrl !== _ppLastUrl) {
        _ppLastUrl = currentUrl;
        lostAnnotation = true; // new page, try to restore
    }

    if (lostAnnotation) {
        clearTimeout(_ppRestoreTimer);
        _ppRestoreTimer = setTimeout(restoreAnnotations, 600);
    }
});

// Start observing
_ppObserver.observe(document.documentElement, { childList: true, subtree: true });

// Also restore on initial page load
window.addEventListener('load', () => {
    setTimeout(restoreAnnotations, 300);
});

// Additional: periodically check (every 3s) as a safety-net for aggressive SPAs
setInterval(() => {
    const url = window.location.href.split('#')[0];
    chrome.storage.local.get({ annotations: {} }, (data) => {
        const ann = data.annotations[url];
        if (!ann) return;
        for (const [id, note] of Object.entries(ann)) {
            if (!document.querySelector(`.ai-annotated[data-ai-id="${id}"]`)) {
                restoreAnnotations();
                return;
            }
        }
    });
}, 3000);

function restoreAnnotations() {
    if (_ppPauseMutations) return;

    const url = window.location.href.split('#')[0];
    chrome.storage.local.get({ annotations: {} }, (data) => {
        const ann = data.annotations[url];
        if (!ann) return;

        // Collect IDs that are missing from the DOM
        const missingIds = [];
        for (const [id, note] of Object.entries(ann)) {
            if (!document.querySelector(`.ai-annotated[data-ai-id="${id}"]`)) {
                missingIds.push(id);
            }
        }

        if (missingIds.length === 0) return;

        // Pause the observer while we inject our spans
        _ppPauseMutations = true;

        for (const id of missingIds) {
            wrapTextInDOM(document.body, ann[id].text, id);
        }

        // Resume the observer after a tick
        setTimeout(() => { _ppPauseMutations = false; }, 200);
    });
}

function wrapTextInDOM(root, text, id) {
    if (!text || text.length < 3) return false;

    // Skip script, style, and our own popup elements
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT']);

    const treeWalker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (node.parentElement.closest('.ai-annotated')) return NodeFilter.FILTER_REJECT;
                if (node.parentElement.closest('.ai-quick-explain-popup')) return NodeFilter.FILTER_REJECT;
                if (SKIP_TAGS.has(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );

    let n;
    while (n = treeWalker.nextNode()) {
        const idx = n.nodeValue.indexOf(text);
        if (idx === -1) continue;

        try {
            const range = document.createRange();
            range.setStart(n, idx);
            range.setEnd(n, idx + text.length);

            const span = document.createElement('span');
            span.className = 'ai-annotated';
            span.dataset.aiId = id;
            span.title = "AI explanation available (click to open)";

            const extracted = range.extractContents();
            span.appendChild(extracted);
            range.insertNode(span);
            return true;
        } catch (e) {
            // Boundary error, skip this text node
        }
    }
    return false;
}

