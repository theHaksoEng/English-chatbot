import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS  # ✅ Ensure CORS is enabled

app = Flask(__name__)
CORS(app)  # ✅ Allow all origins (fixes frontend connection issues)

CHATBASE_API_KEY = os.getenv("CHATBASE_API_KEY")
CHATBASE_BOT_ID = os.getenv("CHATBASE_BOT_ID")

CHATBASE_URL = "https://www.chatbase.co/api/v1/chat"

@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_message = request.json.get("message")
        if not user_message:
            return jsonify({"error": "Message required"}), 400

        # ✅ Send message to Chatbase API
        headers = {"Authorization": f"Bearer {CHATBASE_API_KEY}", "Content-Type": "application/json"}
        data = {"messages": [{"role": "user", "content": user_message}], "chatbotId": CHATBASE_BOT_ID}

        response = requests.post(CHATBASE_URL, headers=headers, json=data)

        # ✅ Check if Chatbase responds correctly
        if response.status_code == 200:
            chatbot_response = response.json().get("text", "No response from Chatbase")
            return jsonify({"response": chatbot_response})
        else:
            return jsonify({"error": "Chatbase API error", "details": response.text}), response.status_code

    except Exception as e:
        return jsonify({"error": "Server error", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)
