require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// Ensure API keys exist
if (!process.env.API_KEY) {
    console.error("❌ Error: Missing API keys. Check your .env file.");
    process.exit(1);
}

// Middleware to parse JSON requests
app.use(express.json());

// Root route for testing
app.get('/', (req, res) => res.send('✅ Chatbot Server is Running!'));

// Voices route
app.get('/voices', (req, res) => {
    const voices = ["Aaron Clone", "Päivi Clone", "Junior Clone"];
    res.json({ availableVoices: voices });
});

// Example command execution route
app.get('/run', (req, res) => {
    exec('echo "Running command"', (error, stdout) => {
        if (error) return res.status(500).send("Error executing command");
        res.send(stdout);
    });
});

// Start server
app.listen(port, () => console.log(`🚀 Chatbot Server is running on port ${port}`));
