from app.llm.llm_client import client

def technical_tool(user_message: str):

    response = client.chat.send(
        model="anthropic/claude-haiku-4.5",
        messages=[
            {
                "role": "system",
                "content": """
                You are a Software Architect.

                Give architecture guidance.
                Explain tradeoffs.
                Recommend best practices.
                """
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        max_tokens=500
    )

    return {
        "response": response.choices[0].message.content
    }