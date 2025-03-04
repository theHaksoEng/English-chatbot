print("Starting chatbot script...")
import os
import requests
import openai
from dotenv import load_dotenv

# Load API keys
load_dotenv()
CHATBASE_API_KEY = os.getenv("CHATBASE_API_KEY")
CHATBASE_BOT_ID = "WwbCX3dW4fAFsG3MKCUXR"  # Your Chatbase bot ID
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

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
        return chatbase_response
    else:  # Otherwise, fall back to OpenAI
        return get_openai_response(user_message)

# Debugging print to confirm script execution
print("Starting chatbot script...")

# Test the chatbot
user_input = "How do I improve my English?"
print("Chatbot reply:", chatbot_reply(user_input))
