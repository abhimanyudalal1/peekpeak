chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'explainText') {
        handleExplainRequest(request).then(sendResponse);
        return true; // Indicates asynchronous response
    }
});

async function handleExplainRequest(request) {
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

        let contents = [];
        let returnedPrompt = null;

        if (request.history && request.history.length > 0) {
            contents = request.history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));
            contents.push({
                role: 'user',
                parts: [{ text: request.text }]
            });
        } else {
            const finalPrompt = `SYSTEM:\n${systemPrompt}\n\nCONSTRAINT:\n${lengthInstruction}\n\nCONTEXT FROM PAGE:\n${request.context || 'No context available'}\n\nUSER:\nExplain the highlighted phrase in the context of the page.\n\nHighlighted text:\n${request.text}`;
            returnedPrompt = finalPrompt;
            contents = [{
                role: 'user',
                parts: [{ text: finalPrompt }]
            }];
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelSelection}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.error?.message || 'Error communicating with Gemini API' };
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        return { result: aiText, firstPrompt: returnedPrompt };

    } catch (error) {
        return { error: error.message };
    }
}
