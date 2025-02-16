require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for frontend (WordPress, Web, etc.)
app.use(cors());

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables...");
const requiredEnvVars = [
    "OPENAI_API_KEY",
    "CHATBASE_API_KEY",
    "CHATBASE_BOT_ID",
    "ELEVENLABS_API_KEY",
    "VOICE_ID_API_KEY"
];

requiredEnvVars.forEach((key) => {
    console.log(`🔑 ${key}:`, process.env[key] ? "✅ Loaded" : "❌ Missing");
});

// ✅ Ensure all API keys exist
if (requiredEnvVars.some(key => !process.env[key])) {
    console.error("❌ Error: Some API keys are missing! Check your .env file or Render environment.");
    process.exit(1);
}

// ✅ Root Route: Check if Server is Running
app.get('/', (req, res) => {
    res.send('✅ Chatbot is running!');
});

// ✅ Available Voices List
app.get('/voices', (req, res) => {
    const voices = ["Aaron Clone", "Päivi Clone", "Junior Clone"];
    res.json({ availableVoices: voices });
});

// ✅ Chat Route (Fixing Chatbase API Method & URL)
app.post('/chat', async (req, res) => {  // <-- Change to POST!
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    try {
        console.log(`📝 Sending message to Chatbase: ${userMessage}`);

        const response = await fetch(`https://www.chatbase.co/api/v1/chat/${process.env.CHATBASE_BOT_ID}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: userMessage }],
                chatflowid: process.env.CHATBASE_BOT_ID
            })
        });

        if (!response.ok) {
            throw new Error(`Chatbase API Error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({ response: data.text || "🤖 No response from Chatbase." });

    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Failed to generate chatbot response" });
    }
});

// ✅ Voice Response Route (Fixing Eleven Labs API Key Format)
app.get('/voice', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided for voice synthesis!" });
    }

    try {
        console.log(`🗣️ Generating voice response for: "${userMessage}"`);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID_API_KEY}`, {
            method: "POST",
            headers: {
                "xi-api-key": process.env.ELEVENLABS_API_KEY,  // ✅ Ensure the header key is correct
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: userMessage,
                model_id: "eleven_multilingual_v2",
 
