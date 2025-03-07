import os
from flask import Flask, request, jsonify
from elevenlabs.client import ElevenLabs
from elevenlabs import play
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")  # ✅ Get voice ID

# ✅ Ensure API Key & Voice ID are set
if not ELEVENLABS_API_KEY:
    raise ValueError("❌ ELEVENLABS_API_KEY is not set! Check your .env file.")
if not ELEVENLABS_VOICE_ID:
    raise ValueError("❌ ELEVENLABS_VOICE_ID is not set! Check your .env file.")

# ✅ Flask App
app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return "Chatbot API is running!"

# ✅ Function to Generate Speech
def generate_speech(text):
    try:
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

        audio = client.text_to_speech.convert(text=text, voice_id=ELEVENLABS_VOICE_ID)  # ✅ Pass voice_id
        play(audio)  # ✅ Play the generated speech
        return "Audio generated and played."
    except Exception as e:
        return f"Error: {str(e)}"

# ✅ Chat Endpoint
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")

    # Process chatbot response
    chatbot_response = f"You said: {user_input}"

    # ✅ Convert text to speech using ElevenLabs
    speech_result = generate_speech(chatbot_response)

    return jsonify({"reply": chatbot_response, "speech": speech_result})

# ✅ Run Flask App
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
