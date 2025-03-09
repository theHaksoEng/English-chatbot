from flask import Flask, request, jsonify
import os
import requests

app = Flask(__name__)

@app.route("/")
def home():
    return "Chatbot API is running!"

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    return jsonify({"response": f"You said: {user_message}"})

@app.route("/voice_chat", methods=["POST"])
def voice_chat():
    data = request.get_json()
    audio_url = data.get("audio_url")

    if not audio_url:
        return jsonify({"error": "No audio URL provided"}), 400

    # Example: Convert speech to text using OpenAI Whisper API
    audio_response = requests.get(audio_url)
    if audio_response.status_code != 200:
        return jsonify({"error": "Failed to download audio"}), 500

    with open("input_audio.wav", "wb") as f:
        f.write(audio_response.content)

    # Replace with actual OpenAI Whisper or Speech-to-Text processing
    transcribed_text = "Example transcription: Hello chatbot!"

    return jsonify({"response": transcribed_text})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 4000))
    app.run(host="0.0.0.0", port=port)
