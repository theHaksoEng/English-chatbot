from flask import Flask, request, jsonify
from flask_cors import CORS  # ✅ Import CORS to handle cross-origin requests
import os
import requests

# ✅ Initialize Flask App
app = Flask(__name__)
CORS(app)  # ✅ Enable CORS for all routes

# ✅ Check if API is running
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Chatbot API is running!"})

# ✅ Chat Route
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Simulate a chatbot response
    response_text = f"Chatbot received: {user_message}"
    
    return jsonify({"response": response_text})

# ✅ Text-to-Speech using Eleven Labs API
@app.route("/speak", methods=["POST"])
def speak():
    data = request.json
    text = data.get("text", "Hello, this is a test response.")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "YOUR_CLONED_VOICE_ID")

    try:
        headers = {
            "xi-api-key": os.getenv("ELEVENLABS_API_KEY"),
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
        }
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            return response.content, 200, {"Content-Type": "audio/mpeg"}
        else:
            return jsonify({"error": "Eleven Labs API request failed", "status_code": response.status_code}), response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Upload Audio
@app.route("/upload_audio", methods=["POST"])
def upload_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    file_path = f"/tmp/{file.filename}"
    file.save(file_path)

    return jsonify({"file_path": file_path, "response": f"Audio uploaded and saved at {file_path}!"})

# ✅ Process Voice Chat
@app.route("/voice_chat", methods=["POST"])
def voice_chat():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    file_path = f"/tmp/{file.filename}"
    file.save(file_path)

    try:
        # Transcribe with OpenAI Whisper
        openai_api_key = os.getenv("OPENAI_API_KEY")
        headers = {"Authorization": f"Bearer {openai_api_key}"}
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers=headers,
            files={"file": open(file_path, "rb")},
            data={"model": "whisper-1"}
        )

        if response.status_code == 200:
            transcribed_text = response.json()["text"]

            # Generate Speech
            elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
            voice_id = os.getenv("ELEVENLABS_VOICE_ID", "YOUR_CLONED_VOICE_ID")
            headers = {
                "xi-api-key": elevenlabs_api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "text": transcribed_text,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
            }
            speech_response = requests.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers=headers,
                json=payload
            )

            if speech_response.status_code == 200:
                output_path = "/tmp/response.mp3"
                with open(output_path, "wb") as f:
                    f.write(speech_response.content)

                return jsonify({"response": "Processed successfully", "transcription": transcribed_text, "saved_audio": output_path})

        return jsonify({"error": "OpenAI Whisper API request failed", "status_code": response.status_code}), response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ API Documentation Route
@app.route("/docs", methods=["GET"])
def api_docs():
    return jsonify({
        "routes": {
            "/": "Check if the API is running",
            "/chat": "Chat with the AI (POST, JSON)",
            "/speak": "Generate speech using Eleven Labs API (POST, JSON)",
            "/upload_audio": "Upload an audio file (POST, multipart/form-data)",
            "/voice_chat": "Process audio with OpenAI Whisper & generate speech (POST, multipart/form-data)"
        }
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)
