require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for WordPress and Frontends
app.use(cors());
app.use(express.json());

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables...");
const requiredEnvVars = [
    "OPENAI_API_KEY",
    "CHATBASE_API_KEY",
    "CHATBASE_BOT_ID",
    "ELEVENLABS_API_KEY",
    "VOICE_ID_API_KEY"
];

requiredEnvVars.forEach(key => {
    console.log(`🔑 ${key}:`, process.env[key] ? "✅ Loaded" : "❌ Missing");
});

// ✅ Ensure all API keys exist
if (!requiredEnvVars.every(key => process.env[key])) {
    console.error("❌ Error: Some API keys are missing! Check your .env file or Render environment.");
    process.exit(1);
}

// ✅ Basic Route to Check Server Status
app.get('/', (req, res) => {
    res.send('✅ Chatbot is running!');
});

// ✅ List Available Voices
app.get('/voices', (req, res) => {
    const voices = ["Aaron Clone", "Päivi Clone", "Junior Clone"];
    res.json({ availableVoices: voices });
});

// ✅ FIX: Adjust Chatbase API Request Method
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    console.log("📩 Received Chat Message:", userMessage);

    try {
        const chatbaseResponse = await fetch(`https://www.chatbase.co/api/v1/message?bot_id=${process.env.CHATBASE_BOT_ID}&message=${encodeURIComponent(userMessage)}`, {
            method: "GET", // ✅ Fix: Chatbase might require GET request instead of POST
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`
            }
        });

        if (!chatbaseResponse.ok) {
            throw new Error(`Chatbase API Error: ${chatbaseResponse.statusText}`);
        }

        const data = await chatbaseResponse.json();
        console.log("📝 Chatbase API Response:", data);

        if (!data.response) {
            throw new Error("Chatbase API Error: No response received.");
        }

        res.json({ response: data.response });

    } catch (error) {
        console.error("❌ Chatbase API Response Error:", error);
        res.status(500).json({ error: "Failed to generate chatbot response" });
    }
});

// ✅ Fix Eleven Labs Voice Response
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    console.log("🗣️ Generating voice response for:", userMessage);

    try {
        const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.ELEVENLABS_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: userMessage,
                voice_id: process.env.VOICE_ID_API_KEY // ✅ Fix: Use environment variable for voice ID
            })
        });

        if (!response.ok) {
            throw new Error(`❌ Eleven Labs API Error: ${await response.text()}`);
        }

        const audioBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("❌ Voice Error:", error);
        res.status(500).json({ error: "Failed to generate voice response" });
    }
});

// ✅ Start the Express Server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
