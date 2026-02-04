import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import multer from "multer";

// ======================
// Config
// ======================
const OPENAI_KEYS = process.env.OPENAI_KEYS.split(","); // 5 keys from Render env
let currentKeyIndex = 0;

// ======================
// App setup
// ======================
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Multer for file uploads
const upload = multer();

// ======================
// Helper functions
// ======================
function getNextAPIKey() {
  const key = OPENAI_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % OPENAI_KEYS.length;
  return key;
}

// ======================
// Routes
// ======================

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

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

    if (data.error || !data.choices) {
      throw new Error();
    }

    res.json({ reply: data.choices[0].message.content.trim() });

  } catch (err) {
    console.error("API error:", err);
    res.json({ reply: "Emmy-GPT server is currently unavailable." });
  }
});

// Voice / file endpoint example
app.post("/api/file", upload.single("file"), async (req, res) => {
  res.json({ reply: "File endpoint received your file!" });
});

// ======================
// Start server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Emmy-GPT backend running on port ${PORT}`);
});
