import os
import requests
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from pydub import AudioSegment
from flask_swagger_ui import get_swaggerui_blueprint

# Load API keys from environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg"}

# Initialize Flask app
app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ✅ Swagger UI Setup
SWAGGER_URL = "/docs"
API_URL = "/static/swagger.json"
swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)


# ✅ Utility: Check allowed file type
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ✅ Root API check
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Chatbot API is running!"})


# ✅ Serve Swagger JSON
@app.route("/static/swagger.json")
def swagger_json():
    return jsonify({
        "swagger": "2.0",
        "info": {
            "title": "Chatbot API",
            "description": "API documentation for Chatbot service",
            "version": "1.0.0"
        },
        "paths": {
            "/chat": {
                "post": {
                    "summary": "Chat with the bot",
                    "parameters": [
                        {"in": "body", "name": "message", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {"200": {"description": "Chatbot response", "schema": {"type": "string"}}}
                }
            },
            "/upload_audio": {
                "post": {
                    "summary": "Upload an audio file",
                    "parameters": [{"in": "formData", "name": "file", "type": "file", "required": True}],
                    "responses": {"200": {"description": "File uploaded"}}
                }
            }
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


# ✅ Voice Chat Processing (Speech-to-Text with OpenAI Whisper)
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

        # Convert to WAV if needed
        output_path = os.path.join(app.config["UPLOAD_FOLDER"], "converted.wav")
        if filename.endswith(".mp3") or filename.endswith(".ogg"):
            audio = AudioSegment.from_file(input_path)
            audio.export(output_path, format="wav")
        else:
            output_path = input_path

        # ✅ Call OpenAI Whisper for transcription
        try:
            with open(output_path, "rb") as audio_file:
                headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
                files = {"file": audio_file}
                data = {"model": "whisper-1"}
                response = requests.post("https://api.openai.com/v1/audio/transcriptions", headers=headers, files=files, data=data)

            if response.status_code == 200:
                transcribed_text = response.json().get("text", "")
                return jsonify({"response": "Processed successfully", "transcription": transcribed_text, "saved_audio": output_path})
            else:
                return jsonify({"error": "OpenAI Whisper API request failed", "status_code": response.status_code, "response_body": response.text}), 500

        except Exception as e:
            return jsonify({"error": f"Exception occurred: {str(e)}"}), 500

    return jsonify({"error": "Invalid file type. Only WAV, MP3, and OGG are allowed."}), 400


# ✅ Text-to-Speech using Eleven Labs API
@app.route("/speak", methods=["POST"])
def speak():
    data = request.json
    text = data.get("text", "
