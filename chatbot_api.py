import os
from flask import Flask, request, jsonify
from elevenlabs import TextToSpeech
from dotenv import load_dotenv

# ✅ Load API Keys from .env
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# ✅ Ensure API Key is set
if not ELEVENLABS_API_KEY:
    raise ValueError("❌ ELEVENLABS_API_KEY is not set! Check your .env file.")

# ✅ Define the voice name (Change this if needed)
VOICE_NAME = "Aaron Haskins clone"

# ✅ Create Flask App
app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return "🎙️ Chatbot API is running!"

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")

    # ✅ Process chatbot response (Modify with your logic)
    chatbot_response = f"You said: {user_input}"

    # ✅ Convert text to speech using ElevenLabs
    try:
        tts = TextToSpeech(api_key=ELEVENLABS_API_KEY)
        audio = tts.synthesize(chatbot_response, voice=VOICE_NAME)
        return jsonify({"reply": chatbot_response, "audio": audio})
    except Exception as e:
        return jsonify({"error": f"ElevenLabs Error: {e}"}), 500

# ✅ Run Flask App
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
