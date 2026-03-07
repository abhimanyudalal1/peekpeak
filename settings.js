document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);

function saveOptions() {
    const apiKey = document.getElementById('apiKey').value;
    const systemPrompt = document.getElementById('systemPrompt').value;
    const modelSelection = document.getElementById('modelSelection').value;
    const responseLength = document.getElementById('responseLength').value;

    chrome.storage.sync.set(
        {
            apiKey,
            systemPrompt,
            modelSelection,
            responseLength,
        },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('statusMessage');
            status.textContent = 'Settings saved!';
            status.classList.remove('hidden');
            setTimeout(() => {
                status.classList.add('hidden');
            }, 2000);
        }
    );
}

function restoreOptions() {
    chrome.storage.sync.get(
        {
            apiKey: '',
            systemPrompt: 'Briefly explain the highlighted text in 2-3 sentences.',
            modelSelection: 'gemini-2.5-flash',
            responseLength: 'medium',
        },
        (items) => {
            document.getElementById('apiKey').value = items.apiKey;
            document.getElementById('systemPrompt').value = items.systemPrompt;
            document.getElementById('modelSelection').value = items.modelSelection;
            document.getElementById('responseLength').value = items.responseLength;
        }
    );
}
