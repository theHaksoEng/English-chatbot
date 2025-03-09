from flask import Flask, request, jsonify
import os
import requests
from pydub import AudioSegment

app = Flask(__name__)

# Set up an upload folder (Render allows writing to /tmp)
UPLOAD_FOLDER = "/tmp"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/")
def home():
    return "Chatbot API is running!"

# Simple text-based chatbot response
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    return jsonify({"response": f"You said: {message}"})

# Upload audio file
@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(file_path)

    return jsonify({"response": f"Audio uploaded and saved at {file_path}!"})

# Process voice chat (convert & simulate response)
@app.route("/voice_chat", methods=["POST"])
def voice_chat():
    if "file" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files["file"]
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(file_path)

    try:
        # Convert audio to WAV if needed
        audio = AudioSegment.from_file(file_path)
        wav_path = file_path.replace(file.filename, "converted.wav")
        audio.export(wav_path, format="wav")

        # Simulating chatbot response (replace with real processing logic)
        chatbot_response = "Hello, I received your voice message!"

        return jsonify({"response": chatbot_response, "saved_audio": wav_path})
    
    except Exception as e:
        return jsonify({"error": f"Failed to process audio: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 4000)), debug=True)
