from flask import Flask, request, jsonify

app = Flask(__name__)

# Root Route (Fix for 404 Error)
@app.route("/")
def home():
    return "Chatbot API is running!"

# Chatbot Endpoint
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")

    # Dummy response (You can integrate Chatbase here)
    bot_response = f"You said: {user_message}"
    
    return jsonify({"response": bot_response})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
