require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000; // Default port 3000

// API Keys
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID_API_KEY = process.env.VOICE_ID_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHATBASE_BOT_ID = process.env.CHATBASE_BOT_ID;

// Check if all necessary API keys are available
if (!ELEVENLABS_API_KEY || !VOICE_ID_API_KEY || !OPENAI_API_KEY || !CHATBASE_BOT_ID) {
    console.error("❌ Missing API keys! Check your .env file.");
    process.exit(1);
}

console.log(`🚀 Chatbot server starting on port ${PORT}`);

// Chat Route
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        console.log(`📩 User Message: ${userMessage}`);

        // Get response from OpenAI
        const chatbotResponseText = await getOpenAIResponse(userMessage);
        console.log(`✅ OpenAI Response: ${chatbotResponseText}`);

        const chatbotResponse = {
            text: chatbotResponseText,
            audio: null
        };

        // Convert response text to speech using Eleven Labs
        const audioData = await generateSpeech(chatbotResponseText);
        if (audioData) {
            chatbotResponse.audio = 'output.mp3';
            fs.writeFileSync('output.mp3', audioData);
        }

        res.json(chatbotResponse);
    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Function to call OpenAI API for chatbot response
async function getOpenAIResponse(prompt) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4", // Use GPT-4 model
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7 // Adjust creativity level
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("❌ OpenAI API Error:", error.response ? error.response.data : error.message);
        return "I'm having trouble processing your request right now. Please try again later.";
    }
}

// Function to generate speech using Eleven Labs API
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

        console.log(`✅ Speech generated successfully.`);
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
