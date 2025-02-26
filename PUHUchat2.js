const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());

// Ensure the public/audio directory exists
const audioDir = path.join(__dirname, "public/audio");
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

// Serve static audio files
app.use("/audio", express.static(audioDir));

const PORT = process.env.PORT || 3001;
const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;
const CHATBASE_BOT_ID = process.env.CHATBASE_BOT_ID;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.VOICE_ID;

// Chatbot Route
app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.messages[0].content;

        console.log(`📩 User Message: ${userMessage}`);

        // Chatbase API Request
        const chatResponse = await axios.post(
            "https://www.chatbase.co/api/v1/chat",
            {
                chatbotId: CHATBASE_BOT_ID,
                messages: [{ content: userMessage, role: "user" }],
            },
            {
                headers: { Authorization: `Bearer ${CHATBASE_API_KEY}` },
            }
        );

        const botReply = chatResponse.data.text;
        console.log(`✅ Chatbase Response: ${botReply}`);

        // ElevenLabs API Request (Text-to-Speech)
        const elevenLabsResponse = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                text: botReply,
                voice_settings: { stability: 0.5, similarity_boost: 0.8 },
            },
            {
                headers: {
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                },
                responseType: "arraybuffer",
            }
        );

        // Save the audio file
        const audioFilePath = path.join(audioDir, "output.mp3");
        fs.writeFileSync(audioFilePath, elevenLabsResponse.data);
        console.log("✅ Speech saved successfully.");

        // Send response with text and audio file URL
        res.json({
            text: botReply,
            audio: "https://puhuchat2.onrender.com/audio/output.mp3",
        });

    } catch (error) {
        console.error("❌ Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Chatbot server running on port ${PORT}`);
});
