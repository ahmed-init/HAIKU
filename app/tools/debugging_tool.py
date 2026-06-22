from app.llm.llm_client import client

def debugging_tool(user_message: str):

    response = client.chat.send(
        model="anthropic/claude-haiku-4.5",
        messages=[
            {
                "role": "system",
                "content": """
                You are an Expert Debugger.

                Find the root cause.
                Explain the bug.
                Provide a fix.
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