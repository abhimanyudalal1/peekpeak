document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);

function saveOptions() {
    const apiKey = document.getElementById('apiKey').value;
    const systemPrompt = document.getElementById('systemPrompt').value;
    const modelSelection = document.getElementById('modelSelection').value;
    const responseLength = document.getElementById('responseLength').value;
    const theme = document.getElementById('theme').value;

    chrome.storage.sync.set(
        {
            apiKey,
            systemPrompt,
            modelSelection,
            responseLength,
            theme,
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
            systemPrompt: `Explain the highlighted concept briefly.

Format the response in clean Markdown.

Guidelines:
- Use **bold** for key ideas
- Use bullet points when useful
- Put examples in code blocks
- Keep it concise (4–6 lines max)

Prefer practical explanations with an example over dictionary definitions.`,
            modelSelection: 'gemini-2.5-flash',
            responseLength: 'medium',
            theme: 'light',
        },
        (items) => {
            document.getElementById('apiKey').value = items.apiKey;
            document.getElementById('systemPrompt').value = items.systemPrompt;
            document.getElementById('modelSelection').value = items.modelSelection;
            document.getElementById('responseLength').value = items.responseLength;
            document.getElementById('theme').value = items.theme;
        }
    );
}
