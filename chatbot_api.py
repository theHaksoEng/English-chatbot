import os
import requests
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from pydub import AudioSegment

# Load API keys from environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
CHATBASE_API_KEY = os.getenv("CHATBASE_API_KEY")
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/transcriptions"

# Initialize Flask app
app = Flask(__name__)
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Utility function to check allowed file types
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ✅ API Status Route
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Chatbot API is running!"})

# ✅ Upload Audio Route
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

# ✅ Voice Chat Route
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
        try:
            with open(output_path, "rb") as audio_file:
                headers = {
                    "Authorization": f"Bearer {ELEVENLABS_API_KEY}",
                    "Content-Type": "audio/wav"
                }
                response = requests.post(
                    ELEVENLABS_API_URL, headers=headers, files={"file": audio_file}
                )
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

# ✅ List Uploaded Files
@app.route("/list_files", methods=["GET"])
def list_files():
    files = os.listdir(UPLOAD_FOLDER)
    return jsonify({"files": files})

# ✅ Download Audio
@app.route("/download_audio", methods=["GET"])
def download_audio():
    file_path = os.path.join(UPLOAD_FOLDER, "output.wav")
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({"error": "File not found"}), 404

# ✅ Run Flask app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 4000)))
