const axios = require('axios');

async function testChatbase() {
    const apiKey = "1aac443e-e793-48bd-983c-6216dac950fa";  // Replace with actual key
    const botId = "WwbCX3dW4fAFsG3MKCUXR";  // Replace with actual ID

    try {
        console.log("🚀 Sending Request to Chatbase...");

        const response = await axios.post("https://www.chatbase.co/api/v1/conversation/sendMessage", {
            apiKey: apiKey,
            botId: botId,
            message: "hello"
        });

        console.log("✅ Chatbase Response:", response.data);
    } catch (error) {
        console.error("❌ Chatbase API Error:", error.response ? error.response.data : error.message);
        if (error.response) {
            console.error("🔍 Full Error Response:", error.response.status, error.response.statusText);
            console.error("📩 Error Details:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testChatbase();
