import os
from flask import Flask, request, jsonify
from elevenlabs import Voices, TextToSpeech
from dotenv import load_dotenv

# ✅ Load API Keys from .env
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# ✅ Ensure API Key is set
if not ELEVENLABS_API_KEY:
    raise ValueError("❌ ELEVENLABS_API_KEY is not set! Check your .env file.")

# ✅ Initialize ElevenLabs TTS
tts = TextToSpeech(api_key=ELEVENLABS_API_KEY)

# ✅ Find Your Voice ID
voice_name = "Aaron Haskins clone"  # Change this to the correct name of your voice
voices = Voices(api_key=ELEVENLABS_API_KEY).list()

voice_id = None
for v in voices:
    if v.name == voice_name:
        voice_id = v.voice_id
        break

if not voice_id:
    raise ValueError(f"❌ Voice '{voice_name}' not found in ElevenLabs. Check your voice settings!")

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
        audio = tts.synthesize(text=chatbot_response, voice_id=voice_id)
        return jsonify({"reply": chatbot_response, "audio": audio})
    except Exception as e:
        return jsonify({"error": f"ElevenLabs Error: {e}"}), 500

# ✅ Run Flask App
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
