from openrouter import OpenRouter
from app.config.settings import OPENROUTER_API_KEY


client = OpenRouter(
    api_key=OPENROUTER_API_KEY
)


print("OPENROUTER_API_KEY:", OPENROUTER_API_KEY)
print("KEY LENGTH:", len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 0)