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
            systemPrompt: `Explain the highlighted concept briefly.

Format the response in clean Markdown.

Guidelines:
- Use **bold** for key ideas
- Use bullet points when useful
- Put examples in code blocks
- Keep it concise (4–6 lines max)

Prefer practical explanations with an example over dictionary definitions.`,
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
            const finalPrompt = `You are helping a user who is studying something.

SYSTEM: ${systemPrompt}
CONSTRAINT: ${lengthInstruction}

STEP 1: Infer the topic being studied from the surrounding text.
STEP 2: Determine what the highlighted phrase means in that topic.
STEP 3: Explain the phrase briefly with a practical example.

Surrounding context:
${request.context || 'No context available'}

Highlighted phrase:
${request.text}`;

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
