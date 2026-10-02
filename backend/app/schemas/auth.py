from pydantic import BaseModel, ConfigDict, field_validator
from app.models.enums import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    username: str
    full_name: str
    profile_picture: str | None = None
    role: UserRole
    is_active: bool

    @field_validator("is_active", mode="before")
    @classmethod
    def normalize_active_flag(cls, value):
        return value in (True, "Y", "y", "true", "1")


class UserCreate(BaseModel):
    username: str
    full_name: str
    password: str
    role: UserRole = UserRole.handling_personnel


class UserProfileUpdate(BaseModel):
    username: str
    full_name: str
    current_password: str | None = None
    password: str | None = None
    profile_picture: str | None = None


class UserPasswordReset(BaseModel):
    password: str


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserStatusUpdate(BaseModel):
    is_active: bool