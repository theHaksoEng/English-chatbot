import os
import requests
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from pydub import AudioSegment

# ✅ Load API keys from environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "YOUR_API_KEY_HERE")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "YOUR_CLONED_VOICE_ID")
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg"}

# ✅ Initialize Flask app
app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ✅ Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ✅ Utility function to check allowed file types
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ✅ Root API check
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Chatbot API is running!"})

# ✅ API Documentation Route
@app.route("/docs", methods=["GET"])
def api_docs():
    return jsonify({
        "routes": {
            "/": "Check if the API is running",
            "/upload_audio": "Upload an audio file (POST, multipart/form-data)",
            "/voice_chat": "Process audio with OpenAI Whisper & generate speech (POST, multipart/form-data)",
            "/speak": "Generate speech using Eleven Labs API (POST, JSON)"
        }
    })

# ✅ Upload audio file
@app.route("/upload_audio", methods=["POST"])
def upload_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)
        return jsonify({"file_path": file_path, "response": f"Audio uploaded and saved at {file_path}!"})

    return jsonify({"error": "Invalid file type. Only WAV, MP3, and OGG are allowed."}), 400

# ✅ Process voice chat (Speech-to-Text & TTS)
@app.route("/voice_chat", methods=["POST"])
def voice_chat():
    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        input_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(input_path)

        # Convert audio to WAV (if needed)
        output_path = os.path.join(app.config["UPLOAD_FOLDER"], "converted.wav")
        if filename.endswith(".mp3") or filename.endswith(".ogg"):
            audio = AudioSegment.from_file(input_path)
            audio.export(output_path, format="wav")
        else:
            output_path = input_path

        # ✅ Call OpenAI Whisper API for transcription
        try:
            headers = {"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"}
            files = {"file": open(output_path, "rb")}
            data = {"model": "whisper-1"}

            response = requests.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                files=files,
                data=data
            )

            if response.status_code == 200:
                transcribed_text = response.json().get("text", "No transcription available")

                # ✅ Call Eleven Labs API for speech generation
                tts_response = generate_speech(transcribed_text)

                return jsonify({
                    "response": "Processed successfully",
                    "transcription": transcribed_text,
                    "saved_audio": tts_response.get("saved_audio", "N/A")
                })

            return jsonify({
                "error": "OpenAI Whisper API request failed",
                "status_code": response.status_code,
                "response_body": response.text
            }), 500

        except Exception as e:
            return jsonify({"error": f"Exception occurred: {str(e)}"}), 500

    return jsonify({"error": "Invalid file type. Only WAV, MP3, and OGG are allowed."}), 400

# ✅ Text-to-Speech using Eleven Labs API
@app.route("/speak", methods=["POST"])
def speak():
    data = request.json
    text = data.get("text", "Hello, this is a test response.")

    try:
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            audio_data = response.content
            audio_path = os.path.join(UPLOAD_FOLDER, "generated_audio.mp3")
            with open(audio_path, "wb") as audio_file:
                audio_file.write(audio_data)

            return jsonify({"response": "Audio generated", "saved_audio": audio_path})

        return jsonify({
            "error": "Eleven Labs API request failed",
            "status_code": response.status_code,
            "response_body": response.text
        }), 500

    except Exception as e:
        return jsonify({"error": f"Exception occurred: {str(e)}"}), 500

# ✅ Helper function for generating speech
def generate_speech(text):
    try:
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            audio_data = response.content
            audio_path = os.path.join(UPLOAD_FOLDER, "response_audio.mp3")
            with open(audio_path, "wb") as audio_file:
                audio_file.write(audio_data)
            return {"response": "Audio generated", "saved_audio": audio_path}

        return {"error": "Eleven Labs API request failed", "status_code": response.status_code}

    except Exception as e:
        return {"error": f"Exception occurred: {str(e)}"}
# ✅ Chat Route for Text-Based Messages
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Basic AI response (You can replace this with OpenAI API call)
    response_message = f"You said: {user_message}"

    return jsonify({"response": response_message})


# ✅ Ensure the app runs
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)
