const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'public/audio'))); // Serve audio files

// Chatbot Route
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.messages[0].content;

        // Send request to Chatbase
        const chatResponse = await axios.post('https://www.chatbase.co/api/v1/chat', {
            chatbotId: process.env.CHATBASE_BOT_ID,
            messages: [{ content: userMessage, role: "user" }]
        }, {
            headers: { Authorization: `Bearer ${process.env.CHATBASE_API_KEY}` }
        });

        const botReply = chatResponse.data.text;

        // Generate Speech via ElevenLabs API
        const elevenLabsResponse = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID_API_KEY}`,
            {
                text: botReply,
                voice_settings: { stability: 0.5, similarity_boost: 0.8 }
            },
            {
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );

        // Save the audio file
        const audioPath = path.join(__dirname, 'public/audio/output.mp3');
        fs.writeFileSync(audioPath, elevenLabsResponse.data);

        // Send response back
        res.json({
            text: botReply,
            audio: '/audio/output.mp3'
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Chatbot server running on port ${PORT}`);
});
