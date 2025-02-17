require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());  // 🔥 Make sure Express can parse JSON requests

// ✅ Environment Variables Debugging
console.log("🔍 Checking Environment Variables...");
console.log("🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_API_KEY:", process.env.CHATBASE_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_BOT_ID:", process.env.CHATBASE_BOT_ID ? "✅ Loaded" : "❌ Missing");
console.log("🔑 ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 VOICE_ID_API_KEY:", process.env.VOICE_ID_API_KEY ? "✅ Loaded" : "❌ Missing");

// ✅ Root Route (Check if server is running)
app.get('/', (req, res) => {
    res.send('✅ Chatbot is running!');
});

// ✅ Fix: Ensure /chat Route is Available & Using POST
app.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    console.log(`📝 Sending message to Chatbase: ${message}`);

    try {
        const chatbaseResponse = await fetch(`https://chatbase.co/api/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                botId: process.env.CHATBASE_BOT_ID,
                message: message,
                userId: "user-123"
            })
        });

        if (!chatbaseResponse.ok) {
            throw new Error(`Chatbase API Error: ${chatbaseResponse.statusText}`);
        }

        const data = await chatbaseResponse.json();
        res.json({ response: data.reply || "🤖 No response received!" });

    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Failed to generate chatbot response" });
    }
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
