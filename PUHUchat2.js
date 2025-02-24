require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

// API keys from .env
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID_API_KEY = process.env.VOICE_ID_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;
const CHATBASE_BOT_ID = process.env.CHATBASE_BOT_ID;

// Verify all API keys are loaded
if (!ELEVENLABS_API_KEY || !VOICE_ID_API_KEY || !OPENAI_API_KEY || !CHATBASE_API_KEY || !CHATBASE_BOT_ID) {
    console.error("❌ Missing API keys! Check your .env file.");
    process.exit(1);
}

// Root route for health check
app.get('/', (req, res) => {
    res.send('🚀 Chatbot server is running successfully!');
});

// Chat route
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        console.log(`📩 User Request: ${userMessage}`);

        // Chatbase request
        const chatbaseResponse = await axios.post(`https://www.chatbase.co/api/v1/chat`, {
            api_key: CHATBASE_API_KEY,
            bot_id: CHATBASE_BOT_ID,
            messages: [{ content: userMessage, role: 'user' }]
        });

        const chatbotReply = chatbaseResponse.data.text;
        console.log(`✅ Chatbase Response: ${chatbotReply}`);

        // Generate speech using ElevenLabs
        const audioData = await generateSpeech(chatbotReply);

        const audioFilename = 'output.mp3';
        if (audioData) {
            fs.writeFileSync(audioFilename, audioData);
        }

        res.json({ text: chatbotReply, audio: audioFilename });
    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Speech Generation Function
async function generateSpeech(text) {
    try {
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

        console.log("🎙️ Speech generated successfully.");
        return response.data;
    } catch (error) {
        console.error("❌ Eleven Labs Error:", error.response ? error.response.data : error.message);
        return null;
    }
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Chatbot server running on port ${PORT}`);
});
