require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000; // Default to port 3000

// API Keys
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID_API_KEY = process.env.VOICE_ID_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;
const CHATBASE_BOT_ID = process.env.CHATBASE_BOT_ID;

if (!ELEVENLABS_API_KEY || !VOICE_ID_API_KEY || !OPENAI_API_KEY || !CHATBASE_API_KEY || !CHATBASE_BOT_ID) {
    console.error("❌ Missing API keys! Check your .env file.");
    process.exit(1);
}

console.log(`🚀 Chatbot server starting on port ${PORT}`);

// Simple Home Route
app.get('/', (req, res) => {
    res.send("🚀 Chatbot server is running successfully!");
});

// Chat Route
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        console.log(`📩 User Message: ${userMessage}`);

        // Send to Chatbase API
        const chatbaseResponse = await axios.post(
            "https://www.chatbase.co/api/v1/chat",
            {
                chatbotId: CHATBASE_BOT_ID,
                messages: [{ content: userMessage, role: "user" }]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CHATBASE_API_KEY}`
                }
            }
        );

        const chatbotText = chatbaseResponse.data.message;
        console.log(`✅ Chatbase Response: ${chatbotText}`);

        // Convert text to speech
        const audioData = await generateSpeech(chatbotText);
        const responsePayload = {
            text: chatbotText,
            audio: audioData ? 'output.mp3' : null
        };

        res.json(responsePayload);
    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Speech Generation Function
async function generateSpeech(text) {
    try {
        console.log(`🎙️ Generating Speech for: ${text}`);

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID_API_KEY}`,
            {
                text: text,
                voice_settings: { stability: 0.5, similarity_boost: 0.8 }
            },
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY
                },
                responseType: 'arraybuffer'
            }
        );

        fs.writeFileSync('output.mp3', response.data);
        console.log(`✅ Speech generated successfully.`);
        return 'output.mp3';
    } catch (error) {
        console.error("❌ Eleven Labs Error:", error.response ? error.response.data : error.message);
        return null;
    }
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Chatbot server running on port ${PORT}`);
});
