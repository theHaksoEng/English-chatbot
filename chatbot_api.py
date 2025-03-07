import os
from flask import Flask, request, jsonify
from elevenlabs import generate, play  # ✅ Correct import for ElevenLabs
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not ELEVENLABS_API_KEY:
    raise ValueError("❌ ELEVENLABS_API_KEY is not set! Check your .env file.")

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
        audio = generate(text=chatbot_response, voice="YourVoiceID", api_key=ELEVENLABS_API_KEY)
        play(audio)  
    except Exception as e:
        return jsonify({"error": f"ElevenLabs Error: {str(e)}"}), 500

    return jsonify({"reply": chatbot_response, "speech": "Audio generated and played."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
