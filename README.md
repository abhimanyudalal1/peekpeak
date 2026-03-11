# peekPeak ✨

peekPeak (formerly AI Quick Explain) is a powerful Chrome extension designed to be your ultimate study companion. It transforms any web page into an interactive study session by providing instant AI-generated explanations for text you highlight.

Unlike traditional transient popup extensions, peekPeak brings **persistent web annotations** and **floating answer cards** to your browsing experience, seamlessly integrating information exactly where you need it.

## 🚀 Features

* **Instant Explanations:** Highlight any confusing text, press a shortcut, and instantly get a clear AI-generated explanation.
* **Persistent Annotations:** Highlighted text remains underlined on the page. You can scroll away and come back without losing your place or context.
* **Floating Answer Cards:** Explanations appear in professional, glassmorphism-styled floating answer cards anchored right next to the highlighted text.
* **Minimize & Restore:** Minimize the answer card to keep your screen uncluttered while retaining the underline. Click the underline anytime to instantly reopen the card with its full conversation history intact.
* **Follow-up Chat:** Ask follow-up questions directly within the answer card to dive deeper into the topic.
* **Context Aware:** The AI reads the surrounding text to provide highly relevant and accurate explanations tailored to the specific context of your reading.
* **Seamless UI:** Features a sleek, responsive design that adapts to both light and dark modes of the websites you visit, complete with smooth animations and subtle styling.

## 🛠️ Installation

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click on the **Load unpacked** button.
5. Select the folder containing the extension's files (where this README is located).

## 💡 How to Use

1. **Highlight** any text on a webpage that you want explained.
2. Press the keyboard shortcut: **`Alt + A`** (or **`Option + A`** on Mac).
3. The text will be highlighted with a sleek purple underline, and a floating AI answer card will pop up near the text with your explanation.
4. Use the custom input box at the bottom of the card to ask any follow-up questions.
5. Click the **Minimize (–)** button in the header to hide the card. Keep reading, and click the underlined text again whenever you want to reopen it!

## 🔧 Technology Stack

* **HTML/CSS/JavaScript:** Built using standard web technologies for lightweight, fast performance.
* **Chrome Extensions API:** For managing background service workers, content scripts, and synchronized local storage (`chrome.storage.local` and `chrome.storage.sync`).
* **AI Integration:** Seamlessly connects to an AI backend to fetch contextual explanations.

## 📄 Storage & Persistence

peekPeak uses Chrome's local storage to save your annotations on a per-URL basis. This allows you to build a repository of study notes and explanations directly on the web pages you read. (Note: The core features are currently set up, dynamic page persistence handles most sites, though highly complex Single Page Applications may vary in restoration behavior).
