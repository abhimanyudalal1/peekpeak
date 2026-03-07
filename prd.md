Core Idea
A browser extension that lets a user:
Highlight any text on a webpage
Press a shortcut or click a small icon
Get an AI explanation in a small floating popup near the selection
The answer is short and contextual, so the user doesn’t leave the page or pollute a chat history.
This works anywhere:
ChatGPT responses
research papers
documentation
LeetCode
blogs
PDFs in browser
Basic User Flow
User highlights text:
counting frequency
Press shortcut (example Alt + A)
Popup appears beside the text:
Counting frequency usually refers to using a hashmap
or dictionary to track occurrences of elements.

Example:
nums = [1,2,2,3]
Counter(nums) → {1:1,2:2,3:1}
Close popup → continue reading.
No scrolling, no new chat messages.
Core Features (V1)
1. Highlight → Ask AI
User highlights text and presses a shortcut.
The extension captures:
window.getSelection()
Then sends it to the AI.
2. Floating Popup UI
A small overlay box appears near the selected text.
Contains:
• short explanation
• copy button
• close button
Example UI:
┌─────────────────────────────┐
│ AI Quick Explain            │
│                             │
│ Counting frequency means    │
│ tracking occurrences using  │
│ a hashmap or counter.       │
│                             │
│ Example: Counter(nums)      │
│                             │
│ [copy]      [close]         │
└─────────────────────────────┘
3. Short Response Mode
The extension enforces concise responses.
Prompt example:
Explain the following briefly in 2–3 sentences:

{text}
This keeps it fast and readable.
4. Custom System Prompt (Your Idea)
This is a very good feature.
Inside extension settings, users can define a system instruction that shapes responses.
Example settings panel:
System Prompt

"You are helping me understand Data Structures
and Algorithms. Explain concepts simply and
include small examples when useful."
Then the actual AI call becomes:
SYSTEM:
{user defined prompt}

USER:
Explain briefly: {highlighted text}
Why System Prompts Are Powerful
The same extension can adapt to different fields.
Examples:
DSA Mode
System prompt:
Explain algorithm concepts clearly and mention
time complexity if relevant.
Highlight:
two pointers
Response:
Two pointers is a technique where two indices move
through an array to reduce search complexity.

Common uses:
• sorted array problems
• pair sums
• palindrome checks
Research Mode
System prompt:
Explain academic concepts in simple language.
Highlight:
heteroskedasticity
Response:
Heteroskedasticity occurs when the variance of
errors in a regression model is not constant.
ML Mode
System prompt:
Explain machine learning concepts with intuition.
Highlight:
cross entropy loss
Response:
Cross entropy measures how different predicted
probabilities are from the true labels.
Optional Features (V2)
These are useful but not required initially.
1. Ask Follow-Up
Inside popup:
[ Ask follow-up ]
User types quick question.
2. Explain Code
If highlighted text contains code, show:
Explain code
Find bug
Optimize
3. Response Length Control
Settings:
Response length

• Short
• Medium
• Detailed
4. Quick Actions
Buttons in popup:
Explain
Summarize
Example
Settings Panel
Extension popup menu could contain:
API Key
System Prompt
Response Length
Shortcut Key
Model Selection
Example layout:
AI Lookup Settings

API Key: ********

System Prompt:
[ text box ]

Shortcut Key:
Alt + A

Response length:
Short
Tech Stack
Very simple stack.
Chrome Extension
Javascript
HTML / CSS popup
OpenAI API
Main files:
manifest.json
content.js
background.js
popup.html
settings.html
Architecture
User highlights text
        ↓
content.js detects selection
        ↓
keyboard shortcut triggered
        ↓
background.js calls AI API
        ↓
response returned
        ↓
floating popup rendered near selection

The One Rule That Keeps It Good
Avoid turning it into another AI chat app.
The extension should stay:
fast
minimal
contextual
Highlight → answer → close.
