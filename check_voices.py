import os
from elevenlabs import voices, set_api_key

# Load API Key from environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Check if API key is set
if not ELEVENLABS_API_KEY:
    print("❌ ELEVENLABS_API_KEY is not set! Check your .env file or environment variables.")
else:
    set_api_key(ELEVENLABS_API_KEY)

try:
    available_voices = voices()

    # Check if voices exist
    if not available_voices:
        print("⚠️ No voices found. Check if the API key is correct!")
    else:
        for v in available_voices:
            # Access object properties correctly
            print(f"Voice: {v.name} (ID: {v.voice_id})")
except Exception as e:
    print(f"❌ Error fetching voices: {e}")
