from openrouter import OpenRouter
from app.config.settings import OPENROUTER_API_KEY


client = OpenRouter(
    api_key=OPENROUTER_API_KEY
)


