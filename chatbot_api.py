import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS  # ✅ Enables cross-origin requests

# ✅ Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow all CORS requests

# ✅ Load API keys from environment variables
CHATBASE_API_KEY = os.getenv("CHATBASE_API_KEY")
CHATBASE_BOT_ID = os.getenv("CHATBASE_BOT_ID")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "YOUR_DEFAULT_VOICE_ID")

# ✅ Ensure static folder exists
os.makedirs("static", exist_ok=True)

@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_message = request.json.get("message")
        if not user_message:
            return jsonify({"error": "Message required"}), 400

        # ✅ Send message to Chatbase
        chatbase_headers = {"Authorization": f"Bearer {CHATBASE_API_KEY}", "Content-Type": "application/json"}
        chatbase_data = {"messages": [{"role": "user", "content": user_message}], "chatbotId": CHATBASE_BOT_ID}
        chatbase_response = requests.post("https://www.chatbase.co/api/v1/chat", headers=chatbase_headers, json=chatbase_data)

        if chatbase_response.status_code != 200:
            return jsonify({"error": "Chatbase API error", "details": chatbase_response.text}), chatbase_response.status_code

        chatbot_text = chatbase_response.json().get("text", "No response from Chatbase")

        # ✅ Send text to ElevenLabs
        elevenlabs_headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
        elevenlabs_data = {
            "text": chatbot_text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}
        }

        elevenlabs_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
            headers=elevenlabs_headers,
            json=elevenlabs_data
        )

        if elevenlabs_response.status_code != 200:
            return jsonify({"error": "ElevenLabs API error", "details": elevenlabs_response.text}), elevenlabs_response.status_code

        # ✅ Save audio file
        audio_file_path = "static/chatbot_audio.mp3"
        with open(audio_file_path, "wb") as f:
            f.write(elevenlabs_response.content)

        return jsonify({"response": chatbot_text, "audio_url": f"http://127.0.0.1:4000/static/chatbot_audio.mp3"})

    except Exception as e:
        return jsonify({"error": "Server error", "details": str(e)}), 500

@app.route("/static/<filename>")
def serve_audio(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)
