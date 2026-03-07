chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'explainText') {
        handleExplainRequest(request.text).then(sendResponse);
        return true; // Indicates asynchronous response
    }
});

async function handleExplainRequest(text) {
    try {
        const {
            apiKey,
            systemPrompt,
            modelSelection,
            responseLength
        } = await chrome.storage.sync.get({
            apiKey: '',
            systemPrompt: 'Briefly explain the highlighted text.',
            modelSelection: 'gemini-2.5-flash',
            responseLength: 'medium'
        });

        if (!apiKey) {
            return { error: 'API Key not configured. Please set it in the extension settings.' };
        }

        let lengthInstruction = '';
        if (responseLength === 'short') lengthInstruction = 'Keep the response to 1-2 very short sentences.';
        else if (responseLength === 'medium') lengthInstruction = 'Keep the response concise, around 2-4 sentences.';
        else if (responseLength === 'detailed') lengthInstruction = 'Provide a detailed explanation.';

        const finalPrompt = `SYSTEM INSTRUCTION:\n${systemPrompt}\n\nCONSTRAINT:\n${lengthInstruction}\n\nUSER:\nExplain the following briefly:\n\n${text}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelSelection}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: finalPrompt }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.error?.message || 'Error communicating with Gemini API' };
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        return { result: aiText };

    } catch (error) {
        return { error: error.message };
    }
}
