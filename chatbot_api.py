import os
from flask import Flask, request, jsonify
from elevenlabs import text_to_speech, play, set_api_key

# ✅ Load API Keys from .env
from dotenv import load_dotenv
load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# ✅ Ensure API Key is set
if not ELEVENLABS_API_KEY:
    raise ValueError("❌ ELEVENLABS_API_KEY is not set! Check your .env file.")
set_api_key(ELEVENLABS_API_KEY)

# ✅ Create Flask App
app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return "Chatbot API is running!"

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")

    # Process chatbot response (Modify with your logic)
    chatbot_response = f"You said: {user_input}"

    # ✅ Convert text to speech using ElevenLabs
    try:
        audio = text_to_speech(text=chatbot_response, voice="YourVoiceID")
        play(audio)  # Play audio response
    except Exception as e:
        return jsonify({"error": f"ElevenLabs Error: {e}"}), 500

    return jsonify({"reply": chatbot_response})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
