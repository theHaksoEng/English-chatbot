require('dotenv').config();
const express = require('express');
const cors = require('cors');  // ✅ Import CORS
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for all requests
app.use(cors({
    origin: '*',  // Allow requests from any domain (Can be restricted for security)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// ✅ Ensure API key exists
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: Missing API key. Check your .env file.");
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
app.get('/chat', (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "❌ No message provided!" });
    }

    // Simulating chatbot logic - Replace with actual AI API call
    const botResponse = `🤖 You said: "${userMessage}"`;

    res.json({ response: botResponse });
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
