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
console.log("🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_API_KEY:", process.env.CHATBASE_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_BOT_ID:", process.env.CHATBASE_BOT_ID ? "✅ Loaded" : "❌ Missing");
console.log("🔑 ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 VOICE_ID_API_KEY:", process.env.VOICE_ID_API_KEY ? "✅ Loaded" : "❌ Missing");

// ✅ Ensure all API keys exist
if (!process.env.OPENAI_API_KEY || !process.env.CHATBASE_API_KEY || !process.env.ELEVENLABS_API_KEY || !process.env.VOICE_ID_API_KEY) {
    console.error("❌ Error: Some API keys are missing! Check your .env file or Render environment.");
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

// ✅ Chat Route (Send message to Chatbase)
app.get('/chat', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    try {
        const response = await fetch(`https://api.chatbase.co/api/v1/bots/${process.env.CHATBASE_BOT_ID}/chat`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!response.ok) {
            throw new Error(`Chatbase API Error: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log("📝 Chatbase Response:", responseData);
        res.json({ response: responseData.message || "🤖 No response from chatbot" });

    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Failed to generate chatbot response" });
    }
});

// ✅ Voice Response Route (Fixing Eleven Labs Issue)
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    try {
        const elevenLabsURL = "https://api.elevenlabs.io/v1/text-to-speech";
        const voiceID = process.env.VOICE_ID_API_KEY; // Ensure this is correct

        console.log(`🔊 Sending to Eleven Labs: ${userMessage}`);

        const response = await fetch(elevenLabsURL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.ELEVENLABS_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: userMessage,
                voice_id: voiceID,
                model_id: "eleven_monolingual_v1", // Ensure this is correct
                settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Eleven Labs API Error: ${errorText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("❌ Voice API Error:", error);
        res.status(500).json({ error: "Failed to generate voice response" });
    }
});

// ✅ Start the Express server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
