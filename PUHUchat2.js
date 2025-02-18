require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json()); // Allow JSON request bodies
app.use(cors());

const port = process.env.PORT || 3000;

// ✅ Log Environment Variables (For Debugging)
console.log("🔍 Checking Environment Variables...");
console.log("🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_API_KEY:", process.env.CHATBASE_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_BOT_ID:", process.env.CHATBASE_BOT_ID ? "✅ Loaded" : "❌ Missing");
console.log("🔑 ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 VOICE_ID_API_KEY:", process.env.VOICE_ID_API_KEY ? "✅ Loaded" : "❌ Missing");

// ✅ Check if all API keys are available
if (!process.env.OPENAI_API_KEY || 
    !process.env.CHATBASE_API_KEY || 
    !process.env.CHATBASE_BOT_ID || 
    !process.env.ELEVENLABS_API_KEY || 
    !process.env.VOICE_ID_API_KEY) {
    
    console.error("❌ Error: Missing API keys. Check your .env file or Render environment.");
    process.exit(1);
}

// ✅ Chat Route (POST request)
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    console.log(`📩 Received Chat Message: ${userMessage}`);

    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    try {
        // 🔹 Send Message to Chatbase API
        const chatbaseResponse = await fetch(`https://www.chatbase.co/api/v1/bots/${process.env.CHATBASE_BOT_ID}/conversation`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!chatbaseResponse.ok) {
            throw new Error(`Chatbase API Error: ${chatbaseResponse.status} - ${await chatbaseResponse.text()}`);
        }

        const chatResponse = await chatbaseResponse.json();
        res.json({ response: chatResponse.reply });
        
    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: `Failed to generate chatbot response: ${error.message}` });
    }
});

// ✅ Voice Route (Fix API Key issue)
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    console.log(`🗣️ Generating voice response for: "${userMessage}"`);

    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

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
            throw new Error(`Eleven Labs API Error: ${response.status} - ${await response.text()}`);
        }

        const audioBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("❌ Voice Error:", error);
        res.status(500).json({ error: `Failed to generate voice response: ${error.message}` });
    }
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
