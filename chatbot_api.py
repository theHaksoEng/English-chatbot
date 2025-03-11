import os
import requests
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from pydub import AudioSegment

# ✅ Load API key from environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/transcriptions"

# ✅ Flask App Setup
app = Flask(__name__)
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
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

# ✅ Process Voice Chat (Send to Eleven Labs)
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

        # ✅ Convert audio to WAV (if needed)
        output_path = os.path.join(app.config["UPLOAD_FOLDER"], "converted.wav")
        if filename.endswith(".mp3") or filename.endswith(".ogg"):
            audio = AudioSegment.from_file(input_path)
            audio.export(output_path, format="wav")
        else:
            output_path = input_path

        # ✅ Send to Eleven Labs API
        try:
            with open(output_path, "rb") as audio_file:
                headers = {
                    "xi-api-key": ELEVENLABS_API_KEY,  # 🔹 Ensure API Key is correct
                }
                files = {
                    "file": audio_file,
                    "model_id": (None, "whisper-1"),  # 🔹 Whisper model for transcription
                }
                response = requests.post(ELEVENLABS_API_URL, headers=headers, files=files)

            # ✅ Handle API response
            if response.status_code == 200:
                transcribed_text = response.json().get("text", "")
                return jsonify({
                    "response": "Hello, I received your voice message!",
                    "transcription": transcribed_text,
                    "saved_audio": output_path
                })
            else:
                return jsonify({
                    "error": "Eleven Labs API request failed",
                    "status_code": response.status_code,
                    "response_body": response.text
                }), 500

        except Exception as e:
            return jsonify({"error": f"Exception occurred: {str(e)}"}), 500

    return jsonify({"error": "Invalid file type. Only WAV, MP3, and OGG are allowed."}), 400

# ✅ List files in the /tmp directory
@app.route("/list_files", methods=["GET"])
def list_files():
    files = os.listdir("/tmp")  
    return jsonify({"files": files})

# ✅ Allow downloading audio file
@app.route("/download_audio", methods=["GET"])
def download_audio():
    file_path = "/tmp/output.wav"
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({"error": "File not found"}), 404

# ✅ Run Flask app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 4000)))
