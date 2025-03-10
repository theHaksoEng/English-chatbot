from flask import Flask, request, jsonify, send_file
import requests
import elevenlabs
import os
import openai
from pydub import AudioSegment

app = Flask(__name__)

# Load API Keys
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CHATBASE_API_URL = "https://english-chatbot-r9bt.onrender.com/chat"

@app.route("/voice_chat", methods=["POST"])
def voice_chat():
    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files["file"]
    file_path = "/tmp/user_audio.wav"
    audio_file.save(file_path)

    # Convert WAV to MP3 (if needed)
    audio = AudioSegment.from_wav(file_path)
    mp3_path = "/tmp/user_audio.mp3"
    audio.export(mp3_path, format="mp3")

    # Transcribe Audio to Text using OpenAI Whisper
    with open(mp3_path, "rb") as f:
        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers=headers,
            files={"file": f},
            data={"model": "whisper-1"},
        )
        transcription = response.json().get("text", "Sorry, I didn't understand.")

    # Send text to Chatbase chatbot
    chat_response = requests.post(CHATBASE_API_URL, json={"message": transcription}).json()
    bot_response = chat_response.get("response", "I didn't get that, please try again.")

    # Convert bot response to speech using ElevenLabs
    audio_output = elevenlabs.generate(
        text=bot_response,
        voice="YourClonedVoice",
        api_key=ELEVENLABS_API_KEY
    )

    output_path = "/tmp/response.mp3"
    with open(output_path, "wb") as f:
        f.write(audio_output)

    return send_file(output_path, mimetype="audio/mpeg")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)
