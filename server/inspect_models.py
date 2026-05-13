import os
from google import genai
from dotenv import load_dotenv

# Load config
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '.env')
load_dotenv(dotenv_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"Checking models for key ending in: ...{GEMINI_API_KEY[-4:] if GEMINI_API_KEY else 'NONE'}")

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("\nFetching valid models via client.models.list()...")
    
    # Let's iterate over models available
    for m in client.models.list():
         print(f" - ID: {m.name} | DisplayName: {m.display_name}")
         
    print("\nTesting a tiny generation on 'gemini-flash-latest' to verify access...")
    resp = client.models.generate_content(
        model='gemini-flash-latest',
        contents="Say 'ACCESS GRANTED' if you can hear me."
    )
    print(f"RESPONSE RECEIVED: {resp.text.strip()}")
    print("\nSUCCESS: gemini-flash-latest IS ACCESSIBLE!")
    
except Exception as e:
    import traceback
    traceback.print_exc()
