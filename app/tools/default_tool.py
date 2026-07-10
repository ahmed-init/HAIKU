from app.llm.llm_client import client

def default_tool(user_message: str):

    response = client.chat.send(
        model="anthropic/claude-haiku-4.5",
        messages=[
            {
                "role": "system",
                "content": """
                You are a well experienced computer science professional.

                Generate clean overview or explanation on this question
                and make the explanation clear and make it simpler for beginners.
                Explain when needed .
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