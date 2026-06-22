from pydantic import BaseModel
from typing import Optional

class ProcessRequest(BaseModel):
    user_message: str
    code_context: Optional[str] = None