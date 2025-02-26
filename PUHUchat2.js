require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Ensure required environment variables exist
if (!process.env.CHATBASE_API_KEY || !process.env.CHATBASE_BOT_ID) {
    console.error("❌ Missing API keys! Check your .env file or Render environment variables.");
    process.exit(1);
}

console.log(`🚀 Chatbot server running on port ${PORT}`);

// Chat Route
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.messages[0].content;
        console.log(`📩 User Request: ${userMessage}`);

        // Send request to Chatbase
        const chatResponse = await axios.post("https://www.chatbase.co/api/v1/chat", {
            chatbotId: process.env.CHATBASE_BOT_ID,
            messages: [{ content: userMessage, role: "user" }]
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`
            }
        });

        console.log(`✅ Chatbase Response: ${chatResponse.data.text}`);

        // Convert text to speech
        const audioData = await generateSpeech(chatResponse.data.text);
        let audioFilePath = null;
        if (audioData) {
            audioFilePath = 'output.mp3';
            fs.writeFileSync(audioFilePath, audioData);
        }

        res.json({ text: chatResponse.data.text, audio: audioFilePath });
    } catch (error) {
        console.error("❌ Chatbot Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Speech Generation Function
async function generateSpeech(text) {
    try {
        console.log(`🎙️ Generating Speech for: ${text}`);

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID_API_KEY}`,
            {
                text: text,
                voice_settings: { stability: 0.5, similarity_boost: 0.8 }
            },
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'xi-api-key': process.env.ELEVENLABS_API_KEY
                },
                responseType: 'arraybuffer'
            }
        );

        console.log(`✅ Speech generated successfully.`);
        return response.data;
    } catch (error) {
        console.error("❌ Eleven Labs Error:", error.response ? error.response.data : error.message);
        return null;
    }
}

// Root Route for Health Check
app.get('/', (req, res) => {
    res.send('🚀 Chatbot server is running successfully!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Chatbot server running on port ${PORT}`);
});
