from dotenv import load_dotenv
import os

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
print("API KEY FOUND:", OPENROUTER_API_KEY is not None)
