require('dotenv').config(); // ✅ Load environment variables

const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Debugging: Check if API key is being loaded
console.log("🔍 Checking API Key...");
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ MISSING API KEY: Check your .env file or Render environment variables.");
    process.exit(1); // Stop execution if missing
} else {
    console.log("✅ API Key Loaded Successfully!");
}

// ✅ Basic route for testing if the server is running
app.get('/', (req, res) => {
    res.send('✅ Chatbot is running!');
});

// ✅ Route to list available voices
app.get('/voices', (req, res) => {
    const voices = ["Aaron Clone", "Päivi Clone", "Junior Clone"];
    res.json({ availableVoices: voices });
});

// ✅ Example route to check API key is accessible via server
app.get('/check-api', (req, res) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "❌ API Key is missing from the environment variables!" });
    }
    res.json({ message: "✅ API Key is loaded and working!" });
});

// ✅ Example command execution (modify as needed)
app.get('/run', (req, res) => {
    exec('echo "Running command"', (error, stdout) => {
        if (error) return res.status(500).send("Error executing command");
        res.send(stdout);
    });
});

// ✅ Start the Express server
app.listen(port, () => console.log(`🚀 Chatbot server running on port ${port}`));
