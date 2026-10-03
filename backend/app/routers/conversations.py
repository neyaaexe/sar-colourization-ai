import os
import shutil
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Conversation, Image, Analysis
from app.schemas import (
    ConversationResponse,
    ConversationSummary,
    ConversationCreate,
    ImageResponse,
    AnalysisResponse
)
from app.auth import get_current_user
from app.config import settings
from app.services.pix2pix_service import pix2pix_service
from app.services.terrain_service import terrain_service
from app.services.image_analysis_service import image_analysis_service

router = APIRouter(prefix="/conversations", tags=["Conversations"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate = ConversationCreate(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = Conversation(
        user_id=current_user.id,
        title=conv_in.title or "New Analysis"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get("", response_model=List[ConversationSummary])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return conversations


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation_by_id(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation session not found")
    return conv


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation session not found")

    db.delete(conv)
    db.commit()

    # Clean up uploaded files if directory exists
    conv_dir = os.path.join(settings.UPLOAD_DIR, conversation_id)
    if os.path.exists(conv_dir):
        shutil.rmtree(conv_dir, ignore_errors=True)

    return None


@router.post("/{conversation_id}/upload", response_model=ImageResponse)
async def upload_sar_image(
    conversation_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation session not found")

    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PNG, JPG, JPEG, TIFF"
        )

    # Read content to validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 15 MB."
        )

    conv_dir = os.path.join(settings.UPLOAD_DIR, conversation_id)
    os.makedirs(conv_dir, exist_ok=True)

    save_filename = f"original_sar_{file.filename}"
    file_path = os.path.join(conv_dir, save_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    relative_path = f"/uploads/{conversation_id}/{save_filename}"

    sar_image = Image(
        conversation_id=conversation_id,
        type="original_sar",
        file_path=relative_path,
        meta_data={"filename": file.filename, "size_bytes": len(contents)}
    )
    db.add(sar_image)

    # Automatically set a descriptive title if title is default
    if conv.title == "New Analysis":
        clean_name = os.path.splitext(file.filename)[0].replace("_", " ").replace("-", " ").title()
        conv.title = f"{clean_name} Region Analysis"
        conv.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(sar_image)

    return sar_image


@router.post("/{conversation_id}/process", response_model=ConversationResponse)
def process_sar_image(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
        .first()
    )

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found"
        )

    sar_image = (
        db.query(Image)
        .filter(
            Image.conversation_id == conversation_id,
            Image.type == "original_sar"
        )
        .order_by(Image.created_at.desc())
        .first()
    )

    if not sar_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No uploaded SAR image found in this conversation."
        )

    # Resolve physical path
    relative_sar = sar_image.file_path.replace("/uploads/", "", 1)

    abs_sar_path = os.path.abspath(
        os.path.join(settings.UPLOAD_DIR, relative_sar)
    )

    conv_dir = os.path.join(settings.UPLOAD_DIR, conversation_id)

    pix2pix_filename = f"pix2pix_rgb_{os.path.basename(abs_sar_path)}"
    abs_pix2pix_path = os.path.join(conv_dir, pix2pix_filename)

    # Step 1: Pix2Pix SAR-to-Optical Image Translation
    pix2pix_service.colorize(
        abs_sar_path,
        abs_pix2pix_path
    )

    relative_pix2pix = f"/uploads/{conversation_id}/{pix2pix_filename}"

    pix2pix_image = Image(
        conversation_id=conversation_id,
        type="pix2pix_rgb",
        file_path=relative_pix2pix,
        meta_data={
            "model": "Pix2Pix",
            "full_name": "Pix2Pix Conditional GAN",
            "task": "SAR-to-Optical Image Translation"
        }
    )

    db.add(pix2pix_image)

    # Step 2: EuroSAT-Swin Terrain Analysis
    terrain_data = terrain_service.analyze(abs_pix2pix_path)

    # Step 3: Image Analysis
    image_stats = image_analysis_service.analyze(abs_pix2pix_path)

    # Step 4: Model Info
    model_info = {
        "pix2pix_version": "Pix2Pix Generator (pth)",
        "full_name": "Pix2Pix Conditional GAN",
        "task": "SAR-to-Optical Image Translation",
        "terrain_model": "EuroSAT-Swin Transformer"
    }

    analysis = Analysis(
        conversation_id=conversation_id,
        terrain_analysis=terrain_data,
        image_analysis=image_stats,
        model_information=model_info
    )

    db.add(analysis)

    conv.updated_at = datetime.utcnow()

    db.commit()

    return db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()