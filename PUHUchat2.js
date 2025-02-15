require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for WordPress and other frontends
app.use(cors());

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables...");
const requiredKeys = [
    "OPENAI_API_KEY",
    "CHATBASE_API_KEY",
    "ELEVENLABS_API_KEY",
    "VOICE_ID_API_KEY"
];

// ✅ Store missing keys
const missingKeys = requiredKeys.filter(key => !process.env[key]);

// ✅ Log results
requiredKeys.forEach(key => {
    console.log(`🔑 ${key}:`, process.env[key] ? "✅ Loaded" : "❌ Missing");
});

// ✅ Stop execution if any keys are missing
if (missingKeys.length > 0) {
    console.error(`❌ Error: Missing API keys -> ${missingKeys.join(', ')}`);
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

// ✅ NEW: Chat route to handle user messages
app.get('/chat', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    try {
        // Simulating chatbot logic - Replace with actual Chatbase API call
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
        res.json({ response: responseData.message || `🤖 You said: "${userMessage}"` });

    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Failed to generate chatbot response" });
    }
});

// ✅ NEW: Voice Response Route (Eleven Labs API)
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    try {
        const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID_API_KEY}`, {
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

        if (!voiceResponse.ok) {
            throw new Error(`❌ Voice synthesis failed: ${voiceResponse.statusText}`);
        }

        const audioBuffer = await voiceResponse.arrayBuffer();
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
