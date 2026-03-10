Goal of This Update

When the user asks AI about highlighted text:

The text becomes underlined (AI annotation)

A floating answer card appears

User can minimize the card

The underline remains on the page

Clicking the underline reopens the card

Even after scrolling away and coming back.

Think of it like:

Perplexity answer cards + web highlights.

Final UX Flow
Step 1 — User highlights text

Example:

counting frequency
Step 2 — User presses shortcut
Alt + A

Extension calls AI.

Step 3 — Text becomes annotated

The extension wraps the text:

<span class="ai-annotated" data-ai-id="note123">
  counting frequency
</span>
What is this?
Step 4 — Floating AI card appears

Attached near the highlighted text.

Example UI:

┌───────────────────────────────┐
│ Counting Frequency            │
│                               │
│ In array problems this means  │
│ counting occurrences using    │
│ a hashmap.                    │
│                               │
│ Example                       │
│ nums = [1,2,2,3]              │
│ freq = {1:1,2:2,3:1}          │
│                               │
│ O(n) time complexity          │
│                               │
│ [– minimize]   [× close]      │
└───────────────────────────────┘
Underline Style (Persistent Annotation)

Instead of a badge, underline the text.

CSS:

.ai-annotated {
  text-decoration: underline;
  text-decoration-color: #6366f1;
  text-decoration-thickness: 2px;
  cursor: pointer;
}

.ai-annotated:hover {
  background: rgba(99,102,241,0.1);
}

This keeps the UI clean.

Perplexity-Style Floating Card

The popup should feel like a floating answer card.

CSS example:

.ai-card {
  position: absolute;
  width: 340px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  padding: 14px;
  font-size: 13px;
  line-height: 1.5;
}

Header styling:

.ai-card-header {
  font-weight: 600;
  margin-bottom: 8px;
}

Code block styling:

.ai-card pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 8px;
  border-radius: 6px;
  overflow-x: auto;
}
Minimize Behavior (Key Feature)

When user clicks minimize:
simply hide the card but keep the underline.

Clicking the underline brings the card back.

Reopening the Card

Add a click listener:

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("ai-annotated")) {
    const id = e.target.dataset.aiId;
    openAICard(id);
  }
});

This restores the stored response.

Store Annotation Data

Each annotation should store:

id
highlighted text
AI response
page URL

Example structure:

{
  "note123": {
    "text": "counting frequency",
    "response": "...AI explanation...",
    "url": "current page"
  }
}

Use:

chrome.storage.local
Restore Annotations on Page Load

When a page loads:

Check storage for notes linked to that URL

Re-wrap the text

Reattach underline

Restore card if it was open

So highlights persist across refresh.

Smart Duplicate Handling

If the user highlights an already annotated phrase:

Show options:

Existing AI note found

[Open]
[Regenerate]
[Delete]

Prevents duplicate notes.

Card Positioning

Card should appear near the highlighted text.

Use:

range.getBoundingClientRect()

Then position:

top: rect.bottom + 8px
left: rect.left

This anchors the card to the text.

Optional Polishing

These are small but make the extension feel professional.

Hover Tooltip
AI explanation available
(click to open)
Smooth Card Animation
transition: transform 0.15s ease, opacity 0.15s ease;
Card Width Control
max-width: 360px

Keeps explanations readable.

What This Update Achieves

Your extension becomes:

AI-powered web annotations with floating explanations.

Capabilities:

• persistent highlights
• reopen explanations anytime
• scroll-safe annotations
• structured answers
• Perplexity-style answer cards

This feels much more like a study tool than just a popup AI query.

Final Architecture
highlight text
↓
wrap text with ai-annotated span
↓
call AI
↓
render floating card
↓
user minimizes
↓
underline remains
↓
click underline → reopen card