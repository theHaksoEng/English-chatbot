import os
import requests
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from pydub import AudioSegment

# Load API keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")  # Set this in your environment variables

# Initialize Flask app
app = Flask(__name__)
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Utility: Check allowed file type
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Root API check
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Chatbot API is running!"})

# Upload audio file
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

# Voice chat processing
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
        output_path = os.path.join(app.config["UPLOAD_FOLDER"], "converted.wav")
        if filename.endswith(".mp3") or filename.endswith(".ogg"):
            audio = AudioSegment.from_file(input_path)
            audio.export(output_path, format="wav")
        else:
            output_path = input_path

        # Send to OpenAI Whisper for transcription
        try:
            with open(output_path, "rb") as audio_file:
                headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
                files = {"file": (output_path, audio_file, "audio/wav")}
                data = {"model": "whisper-1"}
                response = requests.post("https://api.openai.com/v1/audio/transcriptions", headers=headers, files=files, data=data)
            if response.status_code == 200:
                transcribed_text = response.json().get("text", "")

                # Convert text to speech using Eleven Labs
                eleven_labs_headers = {
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                }
                eleven_labs_data = {
                    "text": transcribed_text,
                    "voice_id": ELEVENLABS_VOICE_ID,
                    "model_id": "eleven_turbo_v2"
                }
                eleven_labs_response = requests.post(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
                    headers=eleven_labs_headers,
                    json=eleven_labs_data
                )
                if eleven_labs_response.status_code == 200:
                    audio_output_path = os.path.join(app.config["UPLOAD_FOLDER"], "response.mp3")
                    with open(audio_output_path, "wb") as audio_output_file:
                        audio_output_file.write(eleven_labs_response.content)
                    return jsonify({
                        "response": "Processed successfully",
                        "transcription": transcribed_text,
                        "saved_audio": audio_output_path
                    })
                else:
                    return jsonify({"error": "Eleven Labs API request failed", "status_code": eleven_labs_response.status_code, "response_body": eleven_labs_response.text}), 500
            else:
                return jsonify({"error": "OpenAI Whisper API request failed", "status_code": response.status_code, "response_body": response.text}), 500
        except Exception as e:
            return jsonify({"error": f"Exception occurred: {str(e)}"}), 500
    return jsonify({"error": "Invalid file type. Only WAV, MP3, and OGG are allowed."}), 400

# Route to list files in the server's /tmp directory
@app.route("/list_files", methods=["GET"])
def list_files():
    files = os.listdir("/tmp")
    return jsonify({"files": files})

# Route to allow downloading audio file
@app.route("/download_audio", methods=["GET"])
def download_audio():
    file_path = "/tmp/response.mp3"
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({"error": "File not found"}), 404

# Ensure the app runs
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 4000)))
