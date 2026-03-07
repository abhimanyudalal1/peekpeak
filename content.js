let popupContainer = null;

document.addEventListener('keydown', async (e) => {
    // Listen for Alt+A or Option+A
    if (e.altKey && e.code === 'KeyA') {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            showPopup(rect, text);

            // Send message to background script
            chrome.runtime.sendMessage({ action: 'explainText', text: text }, (response) => {
                if (chrome.runtime.lastError) {
                    updatePopupContent('Error: Could not connect to background script. ' + chrome.runtime.lastError.message);
                } else if (response && response.error) {
                    updatePopupContent('Error: ' + response.error);
                } else if (response && response.result) {
                    updatePopupContent(response.result);
                } else {
                    updatePopupContent('Unknown error occurred.');
                }
            });
        }
    }
});

function showPopup(rect, text) {
    removePopup(); // Remove existing popup if any

    popupContainer = document.createElement('div');
    popupContainer.className = 'ai-quick-explain-popup';

    // Calculate position: just below and slightly to the right of the selection
    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;

    // Basic bounds checking so it doesn't go off screen
    if (left + 300 > window.innerWidth) {
        left = window.innerWidth - 320;
    }

    popupContainer.style.top = `${top}px`;
    popupContainer.style.left = `${left}px`;

    popupContainer.innerHTML = `
    <div class="ai-qe-header">
      <span class="ai-qe-title">✨ AI Quick Explain</span>
    </div>
    <div class="ai-qe-content" id="ai-qe-content">
      <div class="ai-qe-loading">Thinking...</div>
    </div>
    <div class="ai-qe-footer">
      <button class="ai-qe-btn" id="ai-qe-copy">Copy</button>
      <button class="ai-qe-btn" id="ai-qe-close">Close</button>
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
}

function updatePopupContent(markdownText) {
    if (!popupContainer) return;
    const contentDiv = document.getElementById('ai-qe-content');
    if (contentDiv) {
        // Basic Markdown to HTML formatting (bold and paragraphs)
        let formattedText = markdownText
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\n\\n/g, '<br><br>');
        contentDiv.innerHTML = formattedText;
    }
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
