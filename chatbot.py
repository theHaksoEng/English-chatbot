import os
import requests
import openai
import elevenlabs
from dotenv import load_dotenv
from pydub import AudioSegment
from pydub.playback import play
import tempfile

# Load environment variables
load_dotenv()

# API Keys
CHATBASE_API_KEY = os.getenv("CHATBASE_API_KEY")
CHATBASE_BOT_ID = "WwbCX3dW4fAFsG3MKCUXR"  # Replace with your Chatbase bot ID
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Initialize OpenAI client
client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Function to get a response from Chatbase
def get_chatbase_response(user_message):
    url = "https://www.chatbase.co/api/v1/chat"
    headers = {
        "Authorization": f"Bearer {CHATBASE_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "chatbotId": CHATBASE_BOT_ID,
        "messages": [{"role": "user", "content": user_message}]
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json().get("text")  # Extract chatbot's reply
    else:
        return None  # Return None if Chatbase fails

# Function to get a response from OpenAI (fallback)
def get_openai_response(user_message):
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "You are a helpful assistant for English learners."},
                      {"role": "user", "content": user_message}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"OpenAI error: {e}"

# Main function to get a chatbot response
def chatbot_reply(user_message):
    chatbase_response = get_chatbase_response(user_message)
    
    if chatbase_response:  # If Chatbase replies, use it
        print("✅ Chatbase responded!")
        return chatbase_response
    else:  # Otherwise, fall back to OpenAI
        print("❌ Chatbase did NOT respond. Falling back to OpenAI...")
        return get_openai_response(user_message)

# Function to convert text to speech using ElevenLabs
def text_to_speech(text):
    if not ELEVENLABS_API_KEY:
        print("⚠️ ElevenLabs API key is missing. Cannot generate speech.")
        return
    
    try:
        audio = elevenlabs.generate(
            text=text,
            voice="Rachel",  # Change this to another available voice if needed
            api_key=ELEVENLABS_API_KEY
        )

        # Save audio to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(audio)
            temp_audio_path = temp_audio.name

        # Load and play the audio using pydub
        sound = AudioSegment.from_file(temp_audio_path, format="mp3")
        play(sound)
    
    except Exception as e:
        print(f"⚠️ ElevenLabs error: {e}")

# Start chatbot
print("Chatbot script is running...")

# Test the chatbot
user_input = "How do I improve my English?"
reply = chatbot_reply(user_input)
print("Chatbot reply:", reply)

# Convert text reply to speech
text_to_speech(reply)
