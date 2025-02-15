require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fetch = require('node-fetch'); // Ensure this is installed using `npm install node-fetch`

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

// ✅ Ensure all API keys exist before running the server
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

// ✅ Chat route to handle user messages via Chatbase API
app.get('/chat', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    try {
        console.log("📝 Sending message to Chatbase:", userMessage);
        
        const chatResponse = await fetch("https://api.chatbase.co/chat", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!chatResponse.ok) {
            throw new Error(`Chatbase API Error: ${chatResponse.statusText}`);
        }

        const responseData = await chatResponse.json();
        console.log("💬 Chatbase Response:", responseData);

        res.json({ response: responseData.message || `🤖 You said: "${userMessage}"` });

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

    try {
        console.log("🗣️ Sending text to Eleven Labs:", userMessage);

        const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.ELEVENLABS_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: userMessage,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8
                }
            })
        });

        if (!voiceResponse.ok) {
            throw new Error(`❌ Voice synthesis failed: ${voiceResponse.statusText}`);
        }

        const audioBuffer = await voiceResponse.arrayBuffer();
        console.log("🔊 Voice generated successfully!");

        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("❌ Error in voice synthesis:", error);
        res.status(500).json({ error: "Failed to generate voice response" });
    }
});

// ✅ Example route for executing shell commands (modify as needed)
app.get('/run', (req, res) => {
    exec('echo "Running command"', (error, stdout) => {
        if (error) return res.status(500).send("Error executing command");
        res.send(stdout);
    });
});

// ✅ Start the Express server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
