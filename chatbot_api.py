import os
import requests
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from pydub import AudioSegment

# Initialize Flask app
app = Flask(__name__)

# Set upload folder and allowed extensions
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg", "m4a"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Chatbase API and Eleven Labs API keys (Make sure to set these in Render environment variables)
CHATBASE_API_URL = "https://api.chatbase.co/api/v1"
CHATBASE_API_KEY = os.getenv("CHATBASE_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# ----------------------- #
# Root Route (For Testing)
# ----------------------- #
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Chatbot API is running!"})

# ---------------------------- #
# Text Chat Route (Chatbase API)
# ---------------------------- #
@app.route("/chat", methods=["POST"])
def text_chat():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    user_message = data["message"]

    # Call Chatbase API
    chatbase_payload = {
        "api_key": CHATBASE_API_KEY,
        "message": user_message,
        "platform": "website"
    }
    chatbase_response = requests.post(f"{CHATBASE_API_URL}/message", json=chatbase_payload)

    if chatbase_response.status_code == 200:
        return jsonify({"response": chatbase_response.json().get("reply", "No response")})
    else:
        return jsonify({"error": "Chatbase API request failed"}), 500

# ---------------------------------------- #
# Voice Upload Route (Uploads & Converts)
# ---------------------------------------- #
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/upload_audio", methods=["POST"])
def upload_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    return jsonify({"response": f"Audio uploaded and saved at {file_path}!", "file_path": file_path})

# ---------------------------- #
# Voice Chat Processing Route
# ---------------------------- #
@app.route("/voice_chat", methods=["POST"])
def voice_chat():
    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    file = request.files["file"]
    
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format"}), 400

    # Save the file
    filename = secure_filename(file.filename)
    input_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(input_path)

    # Convert to WAV (if needed)
    output_path = os.path.join(app.config["UPLOAD_FOLDER"], "converted.wav")
    if filename.endswith(".mp3") or filename.endswith(".ogg") or filename.endswith(".m4a"):
        audio = AudioSegment.from_file(input_path)
        audio.export(output_path, format="wav")
    else:
        output_path = input_path  # Already a WAV file

    # Call Eleven Labs API for transcription
    with open(output_path, "rb") as audio_file:
        headers = {"Authorization": f"Bearer {ELEVENLABS_API_KEY}"}
        elevenlabs_response = requests.post(
            "https://api.elevenlabs.io/v1/transcribe",
            headers=headers,
            files={"file": audio_file},
        )

    if elevenlabs_response.status_code == 200:
        transcribed_text = elevenlabs_response.json().get("text", "")
        return jsonify({"response": f"Hello, I received your voice message!", "transcription": transcribed_text, "saved_audio": output_path})
    else:
        return jsonify({"error": "Eleven Labs API request failed"}), 500

# ---------------------------- #
# Run Flask App
# ---------------------------- #
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 4000))
    app.run(host="0.0.0.0", port=port)
