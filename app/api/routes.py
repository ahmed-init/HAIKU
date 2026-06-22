import json

from fastapi import APIRouter

from app.models.request_models import ProcessRequest
from app.models.response_models import ProcessResponse

from app.llm.llm_client import client

from app.tools.coding_tool import coding_tool
from app.tools.debugging_tool import debugging_tool
from app.tools.technical_tool import technical_tool

router = APIRouter(
    prefix="/api",
    tags=["Agents"]
)

#eg in case of authentication routes 
#router1=APIRouter(prefix="auth",tags=["Entry"])
#@router1.post("/enter")-->/auth/enter
#@router1.post("/exit")-->/auth/exit

#here the response_model is 
#to validate the result of this post endpoint
@router.post("/process",response_model=ProcessResponse)
async def process_request(request: ProcessRequest):

    tools = [
        {
            "type": "function",
            "function": {
                "name": "coding_tool",
                "description": "Generate code and implement features",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "debugging_tool",
                "description": "Fix bugs, exceptions and runtime errors",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "technical_tool",
                "description": "Provide architecture and technical guidance",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        }
    ]

    response = client.chat.send(
        model="anthropic/claude-haiku-4.5",
        messages=[
            {
                "role": "user",
                "content": request.user_message
            }
        ],
        tools=tools,
        max_tokens=500
    )

    message = response.choices[0].message

    if not message.tool_calls:
        return ProcessResponse(
            agent_selected="none",
            reasoning="No tool selected",
            response="The model did not select a tool."
        )

    tool_call = message.tool_calls[0]

    function_name = tool_call.function.name

    tool_map = {
        "coding_tool": coding_tool,
        "debugging_tool": debugging_tool,
        "technical_tool": technical_tool
    }

    result = tool_map[function_name](
        request.user_message
    )

    return ProcessResponse(
        agent_selected=function_name,
        reasoning="Selected by Claude Tool Calling",
        response=result["response"]
    )