from typing import Optional
from pydantic import BaseModel, ConfigDict


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_id: int
    company_name: str
    company_group: Optional[str] = None
    company_group2: Optional[str] = None