require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for WordPress
app.use(cors());

// ✅ Ensure API keys exist
if (!process.env.CHATBASE_API_KEY || !process.env.ELEVEN_LABS_API_KEY) {
    console.error("❌ Error: Missing API keys. Check your .env file.");
    process.exit(1);
}

// ✅ Basic test route
app.get('/', (req, res) => {
    res.send('✅ Chatbot is running with Chatbase & Eleven Labs!');
});

// ✅ Chat route (process user messages with Chatbase & generate voice)
app.get('/chat', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    try {
        // 🔹 Send message to Chatbase AI
        const chatbaseResponse = await axios.post(
            `https://www.chatbase.co/api/v1/chat`,
            { message: userMessage },
            { headers: { "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}` } }
        );

        const botMessage = chatbaseResponse.data.response || "Sorry, I didn't understand that.";

        // 🔹 Convert botMessage to speech using Eleven Labs
        const voiceData = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID`,
            { text: botMessage },
            {
                headers: {
                    "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
                    "Content-Type": "application/json"
                },
                responseType: "arraybuffer"
            }
        );

        // Convert voice response to Base64
        const audioBase64 = Buffer.from(voiceData.data, 'binary').toString('base64');

        res.json({ response: botMessage, audio: `data:audio/mp3;base64,${audioBase64}` });

    } catch (error) {
        console.error("❌ Error processing chatbot request:", error);
        res.status(500).json({ error: "Chatbot error. Try again later!" });
    }
});

// ✅ Start the Express server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
