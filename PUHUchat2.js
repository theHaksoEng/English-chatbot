require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for WordPress and other frontends
app.use(cors());

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables...");
const requiredKeys = ["OPENAI_API_KEY", "CHATBASE_API_KEY", "CHATBASE_BOT_ID", "ELEVENLABS_API_KEY", "VOICE_ID_API_KEY"];
requiredKeys.forEach(key => {
    console.log(`🔑 ${key}:`, process.env[key] ? "✅ Loaded" : "❌ Missing");
});

// ✅ Ensure all API keys exist
const missingKeys = requiredKeys.filter(key => !process.env[key]);
if (missingKeys.length > 0) {
    console.error(`❌ Error: Missing API keys: ${missingKeys.join(", ")}`);
    process.exit(1);
}

// ✅ Basic route to check if the server is running
app.get('/', (req, res) => {
    res.send('✅ Chatbot is running!');
});

// ✅ Route to list available voices
app.get('/voices', (req, res) => {
    const voices = ["Aaron Clone", "Päivi Clone", "Junior Clone"];
    res.json({ availableVoices: voices });
});

// ✅ Fix: Chat route using GET (instead of POST) to avoid "Method Not Allowed"
app.get('/chat', async (req, res) => {
    const userMessage = req.query.message;  // Now using GET query params
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    console.log(`📩 Received Chat Message: ${userMessage}`);

    try {
        const chatbaseResponse = await fetch(`https://www.chatbase.co/api/v1/bots/${process.env.CHATBASE_BOT_ID}/query?message=${encodeURIComponent(userMessage)}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
                "Accept": "application/json"
            }
        });

        if (!chatbaseResponse.ok) {
            const errorText = await chatbaseResponse.text(); // Log full response
            throw new Error(`Chatbase API Error: ${chatbaseResponse.status} - ${errorText}`);
        }

        const chatData = await chatbaseResponse.json();
        console.log("✅ Chatbase Response:", chatData);
        res.json({ response: chatData.response });

    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: `Failed to generate chatbot response: ${error.message}` });
    }
});

// ✅ Fix: Eleven Labs voice synthesis using correct authorization header
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    console.log(`🗣️ Generating voice response for: "${userMessage}"`);

    try {
        const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID_API_KEY}`, {
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
            throw new Error(`Eleven Labs API Error: ${voiceResponse.status} - ${errorText}`);
        }

        const audioBuffer = await voiceResponse.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("❌ Voice Error:", error);
        res.status(500).json({ error: `Failed to generate voice response: ${error.message}` });
    }
});

// ✅ Start the Express server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
