require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 10000;

// ✅ Enable CORS for WordPress & other frontends
app.use(cors());
app.use(express.json()); // ✅ Allow JSON request body parsing

// ✅ Debugging: Check Environment Variables
console.log("🔍 Checking Environment Variables...");
console.log("🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_API_KEY:", process.env.CHATBASE_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_BOT_ID:", process.env.CHATBASE_BOT_ID ? "✅ Loaded" : "❌ Missing");
console.log("🔑 ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 VOICE_ID_API_KEY:", process.env.VOICE_ID_API_KEY ? "✅ Loaded" : "❌ Missing");

// ✅ Ensure all API keys exist
if (!process.env.OPENAI_API_KEY || !process.env.CHATBASE_API_KEY || !process.env.CHATBASE_BOT_ID || !process.env.ELEVENLABS_API_KEY || !process.env.VOICE_ID_API_KEY) {
    console.error("❌ Error: Some API keys are missing! Check your .env file or Render environment.");
    process.exit(1);
}

// ✅ Route to check if server is running
app.get('/', (req, res) => {
    res.send('✅ Chatbot is running!');
});

// ✅ FIXED: `/chat` Route (Now using POST)
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    console.log("📩 Received Chat Message:", userMessage);

    try {
        const response = await axios.post("https://www.chatbase.co/api/v1/conversation/sendMessage", 
        {
            apiKey: process.env.CHATBASE_API_KEY,
            botId: process.env.CHATBASE_BOT_ID,
            message: userMessage
        });

        if (response.data && response.data.response) {
            res.json({ response: response.data.response });
        } else {
            throw new Error("Invalid response from Chatbase.");
        }
    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: `Failed to generate chatbot response: ${error.message}` });
    }
});

// ✅ FIXED: `/voice` Route (Now properly requests Eleven Labs API)
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    console.log("🗣️ Generating voice response for:", userMessage);

    try {
        const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID_API_KEY}`, 
        {
            text: userMessage,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        }, 
        {
            headers: {
                "Authorization": `Bearer ${process.env.ELEVENLABS_API_KEY}`,
                "Content-Type": "application/json"
            },
            responseType: 'arraybuffer'
        });

        res.setHeader("Content-Type", "audio/mpeg");
        res.send(response.data);

    } catch (error) {
        console.error("❌ Voice Error:", error.response ? error.response.data : error);
        res.status(500).json({ error: `Failed to generate voice response: Eleven Labs API Error: ${error.message}` });
    }
});

// ✅ Start the Express server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
