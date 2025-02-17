require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS to allow access from WordPress
app.use(cors());
app.use(express.json());

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables...");
const requiredKeys = [
    "OPENAI_API_KEY",
    "CHATBASE_API_KEY",
    "CHATBASE_BOT_ID",
    "ELEVENLABS_API_KEY",
    "VOICE_ID_API_KEY"
];
let missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
    console.error(`❌ Error: Missing API Keys -> ${missingKeys.join(", ")}`);
    process.exit(1);
}

// ✅ Chat Route (Text-Based Response)
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    console.log(`📩 Received Chat Message: ${userMessage}`);

    try {
        const chatbaseResponse = await fetch(`https://www.chatbase.co/api/v1/bots/${process.env.CHATBASE_BOT_ID}/query`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!chatbaseResponse.ok) {
            throw new Error(`Chatbase API Error: ${chatbaseResponse.statusText}`);
        }

        const chatData = await chatbaseResponse.json();
        res.json({ response: chatData.response });
    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Failed to generate chatbot response" });
    }
});

// ✅ Voice Route (Generate Speech with Eleven Labs)
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    console.log(`🗣️ Generating voice response for: ${userMessage}`);

    try {
        const voiceResponse = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.ELEVENLABS_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: userMessage,
                voice_id: process.env.VOICE_ID_API_KEY
            })
        });

        if (!voiceResponse.ok) {
            const errorText = await voiceResponse.text();
            throw new Error(`❌ Eleven Labs API Error: ${errorText}`);
        }

        const audioBuffer = await voiceResponse.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audioBuffer));
    } catch (error) {
        console.error("❌ Voice Error:", error);
        res.status(500).json({ error: "Failed to generate voice response" });
    }
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
