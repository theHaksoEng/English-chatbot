import os
import requests
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from pydub import AudioSegment

# Load API keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # OpenAI Whisper for transcription
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")  # Eleven Labs for voice

# Initialize Flask app
app = Flask(__name__)
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ✅ Utility: Check allowed file type
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ✅ Root API check
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Chatbot API is running!"})


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


# ✅ Voice chat processing (Transcribe + Respond + Synthesize)
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

        # Convert audio to WAV (if not already WAV)
        output_path = os.path.join(app.config["UPLOAD_FOLDER"], "converted.wav")
        if filename.endswith(".mp3") or filename.endswith(".ogg"):
            audio = AudioSegment.from_file(input_path)
            audio.export(output_path, format="wav")
        else:
            output_path = input_path

        # ✅ Step 1: Transcribe Audio using OpenAI Whisper API
        try:
            with open(output_path, "rb") as audio_file:
                headers = {
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "multipart/form-data"
                }
                response = requests.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers=headers,
                    files={"file": audio_file},
                    data={"model": "whisper-1"}
                )

            if response.status_code == 200:
                transcribed_text = response.json().get("text", "")

                # ✅ Step 2: Send transcribed text to chatbot
                chatbot_response = f"You said: {transcribed_text}. I am your chatbot!"

                # ✅ Step 3: Convert chatbot response to speech with Eleven Labs
                try:
                    eleven_headers = {
                        "xi-api-key": ELEVENLABS_API_KEY,
                        "Content-Type": "application/json"
                    }
                    eleven_data = {
                        "text": chatbot_response,
                        "voice_id": "fEVT2ExfHe1MyjuiIiU9",
                        "model_id": "eleven_monolingual_v1"
                    }
                    eleven_response = requests.post(
                        "https://api.elevenlabs.io/v1/text-to-speech",
                        headers=eleven_headers,
                        json=eleven_data
                    )

                    if eleven_response.status_code == 200:
                        audio_output_path = os.path.join(UPLOAD_FOLDER, "response.mp3")
                        with open(audio_output_path, "wb") as f:
                            f.write(eleven_response.content)

                        return jsonify({
                            "transcription": transcribed_text,
                            "chatbot_response": chatbot_response,
                            "audio_response": "/download_audio"
                        })
                    else:
                        return jsonify({
                            "error": "Eleven Labs speech synthesis failed",
                            "response_body": eleven_response.text,
                            "status_code": eleven_response.status_code
                        }), 500

                except Exception as e:
                    return jsonify({"error": f"Eleven Labs API Exception: {str(e)}"}), 500

            else:
                return jsonify({
                    "error": "OpenAI Whisper API request failed",
                    "status_code": response.status_code,
                    "response_body": response.text
                }), 500

        except Exception as e:
            return jsonify({"error": f"Exception occurred: {str(e)}"}), 500

    return jsonify({"error": "Invalid file type. Only WAV, MP3, and OGG are allowed."}), 400


# ✅ Route to allow downloading the chatbot's audio response
@app.route("/download_audio", methods=["GET"])
def download_audio():
    file_path = os.path.join(UPLOAD_FOLDER, "response.mp3")
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({"error": "File not found"}), 404


# ✅ Run Flask app (if running locally)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 4000)))
