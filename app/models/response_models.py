from pydantic import BaseModel

class ProcessResponse(BaseModel):
    agent_selected: str
    reasoning: str
    response: str