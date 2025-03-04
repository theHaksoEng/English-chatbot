import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client (new format)
client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Test OpenAI API
def test_openai():
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "Say hello in English."}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"OpenAI error: {e}"

# Run the test
print("Testing OpenAI:", test_openai())
