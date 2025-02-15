require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Ensure this package is installed

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for WordPress and other frontends
app.use(cors());

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables...");
console.log("🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 CHATBASE_API_KEY:", process.env.CHATBASE_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 ELEVEN_LABS_API_KEY:", process.env.ELEVEN_LABS_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("🔑 VOICE_ID:", process.env.VOICE_ID ? "✅ Loaded" : "❌ Missing");

// ✅ Ensure all API keys exist
if (!process.env.OPENAI_API_KEY || !process.env.CHATBASE_API_KEY || !process.env.ELEVEN_LABS_API_KEY || !process.env.VOICE_ID) {
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

// ✅ Chat route to handle user messages
app.get('/chat', (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    // Simulated chatbot logic - Replace with actual API call
    const botResponse = `🤖 You said: "${userMessage}"`;

    res.json({ response: botResponse });
});

// ✅ NEW: Voice Response Route (Integrate Eleven Labs API)
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.ELEVEN_LABS_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: userMessage,
                model_id: "eleven_monolingual_v1", // Change this if needed
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8
                }
            })
        });

        if (!response.ok) {
            throw new Error(`❌ Voice synthesis failed: ${response.statusText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("❌ Error in voice synthesis:", error);
        res.status(500).json({ error: "Failed to generate voice response" });
    }
});

// ✅ Start the Express server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
