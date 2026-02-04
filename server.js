import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";

const OPENAI_KEYS = process.env.OPENAI_KEYS.split(",");
let currentKeyIndex = 0;

const app = express();
app.use(cors());
app.use(bodyParser.json());
const upload = multer({ dest: 'uploads/' });

function getNextAPIKey() {
  const key = OPENAI_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % OPENAI_KEYS.length;
  return key;
}

// Root route
app.get("/", (req, res) => {
  res.send("Emmy-GPT backend is running! 🚀");
});

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
    if (data.error || !data.choices) throw new Error();
    res.json({ reply: data.choices[0].message.content.trim() });
  } catch (err) {
    console.error("API error:", err);
    res.json({ reply: "Emmy-GPT server is currently unavailable." });
  }
});

// File / image / voice endpoint
app.post("/api/file", upload.single("file"), async (req, res) => {
  if(!req.file) return res.status(400).json({ reply: "No file uploaded" });

  const filePath = req.file.path;
  const apiKey = getNextAPIKey();

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    // Choose endpoint based on mimetype
    let openAIEndpoint = "https://api.openai.com/v1/images/edits"; // default for image
    if(req.file.mimetype.startsWith("audio/")){
      openAIEndpoint = "https://api.openai.com/v1/audio/transcriptions";
      formData.append("model", "whisper-1");
    }

    if(openAIEndpoint.includes("images")){
      formData.append("model", "gpt-image-1");
      formData.append("prompt", "Analyze this image and describe it."); // simple example
    }

    const response = await fetch(openAIEndpoint, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: formData
    });

    const data = await response.json();
    fs.unlinkSync(filePath); // delete file after sending

    // Return meaningful response depending on type
    if(openAIEndpoint.includes("audio")){
      res.json({ reply: data.text || "Audio processed!" });
    } else {
      res.json({ reply: data.data?.[0]?.url || "Image processed!" });
    }

  } catch (err) {
    fs.unlinkSync(filePath);
    console.error("File processing error:", err);
    res.json({ reply: "Emmy-GPT server is currently unavailable." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Emmy-GPT backend running on port ${PORT}`);
});
