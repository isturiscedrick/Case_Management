from pydantic import BaseModel, ConfigDict
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