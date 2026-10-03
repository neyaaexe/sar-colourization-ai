from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

# Image Schemas
class ImageResponse(BaseModel):
    id: str
    conversation_id: str
    type: str
    file_path: str
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Analysis Schemas
class TerrainAnalysisData(BaseModel):
    vegetation: float
    water: float
    urban: float
    agriculture: float

class ImageAnalysisData(BaseModel):
    dimensions: str
    channels: str
    file_format: str
    mean_brightness: float
    contrast: float
    dominant_colors: List[str]

class ModelInfoData(BaseModel):
    wflmgan_version: Optional[str] = None
    mcgan_version: Optional[str] = None
    full_name: Optional[str] = None
    task: Optional[str] = None
    terrain_model: str
    vlm_model: Optional[str] = None

class AnalysisResponse(BaseModel):
    id: str
    conversation_id: str
    terrain_analysis: Dict[str, Any]
    image_analysis: Dict[str, Any]
    model_information: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# Conversation Schemas
class ConversationCreate(BaseModel):
    title: Optional[str] = "New Analysis"

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    images: List[ImageResponse] = []
    analyses: List[AnalysisResponse] = []

    class Config:
        from_attributes = True

class ConversationSummary(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
