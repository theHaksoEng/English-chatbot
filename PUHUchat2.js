require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());  // ✅ Enables parsing of JSON requests

// ✅ Debugging: Log Environment Variables
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

// ✅ FIXED: Chat Route (Ensures Proper POST Request)
app.post('/chat', async (req, res) => {
    console.log("📩 Received Request:", req.body); // ✅ Log Request Data

    const { message } = req.body;
    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "❌ Invalid message format. Expecting a text string." });
    }

    console.log(`📝 Sending message to Chatbase: ${message}`);

    try {
        const chatbaseResponse = await fetch(`https://www.chatbase.co/api/v1/completions`, {
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
            console.error("❌ Chatbase API Response Error:", await chatbaseResponse.text());
            throw new Error(`Chatbase API Error: ${chatbaseResponse.statusText}`);
        }

        const data = await chatbaseResponse.json();
        console.log("✅ Chatbase Response:", data);

        res.json({ response: data.reply || "🤖 No response received!" });

    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Failed to generate chatbot response" });
    }
});

// ✅ Voice Response Route (Eleven Labs API)
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    console.log(`🗣️ Generating voice response for: "${userMessage}"`);

    try {
        const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
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

        if (!response.ok) {
            console.error("❌ Eleven Labs API Response Error:", await response.text());
            throw new Error(`Eleven Labs API Error: ${response.statusText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("❌ Voice Error:", error);
        res.status(500).json({ error: "Failed to generate voice response" });
    }
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
