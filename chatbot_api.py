import os
from flask import Flask, request, jsonify
from elevenlabs import Voice, save, play
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

if not ELEVENLABS_API_KEY:
    raise ValueError("❌ ELEVENLABS_API_KEY is not set! Check your .env file.")

if not ELEVENLABS_VOICE_ID:
    raise ValueError("❌ ELEVENLABS_VOICE_ID is not set! Check your .env file.")

# ✅ Flask App
app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return "Chatbot API is running!"

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")

    chatbot_response = f"You said: {user_input}"

    try:
        speech_result = generate_speech(chatbot_response, ELEVENLABS_VOICE_ID)
    except Exception as e:
        return jsonify({"error": f"ElevenLabs Error: {str(e)}"}), 500

    return jsonify({"reply": chatbot_response, "speech": speech_result})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
