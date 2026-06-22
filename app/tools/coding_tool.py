from app.llm.llm_client import client

def coding_tool(user_message: str):

    response = client.chat.send(
        model="anthropic/claude-haiku-4.5",
        messages=[
            {
                "role": "system",
                "content": """
                You are a Senior Software Engineer.

                Generate clean production-ready code.
                Explain when necessary.
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