// ======================
// Configuration
// ======================
const OPENAI_KEYS = [
  "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",
  "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",
  "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",
  "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",
  "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"
];
let currentKeyIndex = 0;

// ======================
// DOM Elements
// ======================
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// ======================
// User info
// ======================
const username = localStorage.getItem('emmy_username') || "there";

// ======================
// Helper Functions
// ======================
function saveChatHistory(chatHistory) {
  localStorage.setItem(`chat_${username}`, JSON.stringify(chatHistory));
}

function loadChatHistory() {
  const data = localStorage.getItem(`chat_${username}`);
  return data ? JSON.parse(data) : [];
}

function addMessage(text, sender = "ai") {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);

  if(sender === "ai") {
    // Disable send button while AI is typing
    sendBtn.disabled = true;
    userInput.disabled = true;
    typeAIMessage(text, msgDiv).then(() => {
      // Re-enable send button after typing
      sendBtn.disabled = false;
      userInput.disabled = false;
      userInput.focus();
    });
  } else {
    msgDiv.textContent = text;
  }

  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Typing effect for AI messages with Promise to know when finished
function typeAIMessage(text, aiDiv) {
  return new Promise(resolve => {
    aiDiv.textContent = "";
    let i = 0;
    const speed = 20; // fast typing
    const interval = setInterval(() => {
      aiDiv.textContent += text.charAt(i);
      i++;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

// Rotate to next API key
function getNextAPIKey() {
  const key = OPENAI_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % OPENAI_KEYS.length;
  return key;
}

// ======================
// Send message to OpenAI with professional fallback
// ======================
async function sendToOpenAI(message) {
  const apiKey = getNextAPIKey();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        max_tokens: 500
      })
    });

    const data = await response.json();
    if (data.error || !data.choices) throw new Error();

    return data.choices[0].message.content.trim();

  } catch (err) {
    console.error("API error:", err);
    return "Emmy-GPT server is currently unavailable.";
  }
}

// ======================
// Handle Sending
// ======================
async function handleSend() {
  const message = userInput.value.trim();
  if (!message) return;

  // Add user message
  addMessage(message, "user");

  // Save chat
  chatHistory.push({ sender: "user", text: message });
  saveChatHistory(chatHistory);

  // Clear input
  userInput.value = "";

  // Get AI response
  const aiResponse = await sendToOpenAI(message);

  // Add AI message (typing effect will handle disabling/enabling button)
  addMessage(aiResponse, "ai");

  // Save AI response
  chatHistory.push({ sender: "ai", text: aiResponse });
  saveChatHistory(chatHistory);
}

// ======================
// Load previous chat
// ======================
let chatHistory = loadChatHistory();
chatHistory.forEach(msg => addMessage(msg.text, msg.sender));

// ======================
// Event listeners
// ======================
sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keypress", e => {
  if(e.key === "Enter" && !sendBtn.disabled) handleSend();
});

// ======================
// Automated welcome message
// ======================
window.addEventListener("load", () => {
  setTimeout(() => {
    const welcomeText = `Hello 👋 ${username}, this is Emmy-GPT your virtual AI assistant to help you solve problems and answer questions intelligently.`;
    addMessage(welcomeText, "ai");
    chatHistory.push({ sender: "ai", text: welcomeText });
    saveChatHistory(chatHistory);
  }, 3000);
});
