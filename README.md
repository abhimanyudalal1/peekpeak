# peekPeak ✨

peekPeak is a powerful Chrome extension designed to solve **Context Drift** and **Cognitive Breakage** while reading, researching, or studying with LLMs. 

It acts as an **AI-powered contextual glossary** for anything on the web, giving you instant micro-explanations as persistent web annotations without derailing your main workflow.

## 🧠 The Problem It Solves

When studying complex topics or reading research (e.g., Learning Array Patterns for DSA), you often encounter nested micro-concepts you don't fully grasp (like `counting frequency`, `hashmap`, or `prefix sum`). 

If you ask your primary LLM chat about these micro-questions, you run into three major issues:

1. **Context Drift:** The LLM optimizes its reasoning around your latest small question, eventually forgetting the main learning goal you started with.
2. **Cognitive Flow Break:** Asking a question requires scrolling down, typing, waiting, and scrolling back—completely breaking your reading focus.
3. **Context Pollution:** Small clarifications waste valuable context window tokens, pushing important earlier information out and making the model's reasoning less focused.

## 🚀 The Solution: A Parallel Explanation Layer

peekPeak separates your micro-clarifications from your main conversation. Instead of tangling everything into one long chat, it creates a **secondary AI layer**.

* **Main Learning Conversation:** Stays focused in your primary LLM window.
* **Inline Micro Explanations:** Handled instantly by peekPeak as floating annotations directly over the text you're reading.

### Practical Use Cases:
* **Learning DSA:** Highlight `counting frequency` → Get an explanation without polluting your main discussion.
* **Reading Research Papers:** Highlight `heteroskedasticity` → Instant statistical clarification.
* **Studying ML Documentation:** Highlight `cross entropy` → Quick contextual definition.
* **Reading LLM Outputs:** Clarify confusing terms the model used without derailing its current chain of thought.

## ✨ Core Features

* **Instant Explanations:** Highlight any text and press **`Alt + A`** (or **`Option + A`** on Mac) to get a clear AI explanation.
* **Persistent Annotations:** Highlighted text becomes persistently underlined on the page. You can scroll away and return without losing your place.
* **Floating Answer Cards:** Explanations appear in professional, Perplexity-style glass floating cards anchored right to the text.
* **Minimize & Restore:** Minimize the answer card to keep your screen uncluttered; the underline remains. Click the underline anytime to instantly reopen the card with its full history intact.
* **Follow-up Chat:** Ask follow-up questions directly within the mini answer card.

## 🛠️ Installation

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click on the **Load unpacked** button.
5. Select the folder containing the extension's files (where this README is located).
