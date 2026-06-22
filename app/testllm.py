from openrouter import OpenRouter
from app.config.settings import OPENROUTER_API_KEY

client = OpenRouter(
    api_key=OPENROUTER_API_KEY
)

response = client.chat.send(
    model="anthropic/claude-haiku-4.5",
    messages=[
        {
            "role": "user",
            "content": "Say hello"
        }
    ],
    max_tokens=100
)
print(response.choices[0].message.content)