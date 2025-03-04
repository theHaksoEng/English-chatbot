import os
import openai
import requests
from dotenv import load_dotenv

# Load API keys
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CHATBASE_API_KEY = os.getenv("CHATBASE_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Test OpenAI
def test_openai():
    try:
        openai.api_key = OPENAI_API_KEY
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "Say hello in English."}]
        )
        return response["choices"][0]["message"]["content"]
    except Exception as e:
        return f"OpenAI error: {e}"

# Run test
print("Testing OpenAI:", test_openai())
