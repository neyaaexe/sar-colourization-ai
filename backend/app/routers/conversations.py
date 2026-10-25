
import os
import shutil
from typing import List
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Conversation, Image, Analysis, Message
from app.schemas import (
    ConversationResponse,
    ConversationSummary,
    ConversationCreate,
    ConversationRename,
    ImageResponse,
    ChatRequest,
    MessageResponse,
)
from app.auth import get_current_user
from app.config import settings

from app.services.pix2pix_service import pix2pix_service
from app.services.terrain_service import terrain_service
from app.services.image_analysis_service import image_analysis_service
from app.services.land_cover_service import land_cover_service


router = APIRouter(prefix="/conversations", tags=["Conversations"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


@router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    conv_in: ConversationCreate = ConversationCreate(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = Conversation(
        user_id=current_user.id,
        title=conv_in.title or "New Analysis",
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get("", response_model=List[ConversationSummary])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found",
        )

    return conv

@router.patch(
    "/{conversation_id}",
    response_model=ConversationResponse,
)
def rename_conversation(
    conversation_id: str,
    rename_data: ConversationRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = rename_data.title.strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Scene name cannot be empty.",
        )

    if len(title) > 120:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Scene name cannot exceed 120 characters.",
        )

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found",
        )

    conversation.title = title
    db.commit()
    db.refresh(conversation)

    return conversation

@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found",
        )

    # Delete the database record first.
    db.delete(conv)
    db.commit()

    # Remove the conversation's uploaded files.
    conv_dir = os.path.join(settings.UPLOAD_DIR, conversation_id)

    if os.path.exists(conv_dir):
        shutil.rmtree(conv_dir, ignore_errors=True)

    return None


@router.post(
    "/{conversation_id}/upload",
    response_model=ImageResponse,
)
async def upload_sar_image(
    conversation_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found",
        )

    # Validate the file extension.
    original_filename = os.path.basename(file.filename or "")
    ext = os.path.splitext(original_filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file format '{ext}'. "
                "Allowed formats: PNG, JPG, JPEG, TIFF"
            ),
        )

    # Read and validate the uploaded file.
    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 15 MB.",
        )

    conv_dir = os.path.join(settings.UPLOAD_DIR, conversation_id)
    os.makedirs(conv_dir, exist_ok=True)

    # Use a safe filename to avoid path-related problems.
    save_filename = f"original_sar_{original_filename}"
    file_path = os.path.join(conv_dir, save_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    relative_path = f"/uploads/{conversation_id}/{save_filename}"

    sar_image = Image(
        conversation_id=conversation_id,
        type="original_sar",
        file_path=relative_path,
        meta_data={
            "filename": original_filename,
            "size_bytes": len(contents),
        },
    )

    db.add(sar_image)

    # Automatically set a descriptive conversation title.
    if conv.title == "New Analysis":
        clean_name = (
            os.path.splitext(original_filename)[0]
            .replace("_", " ")
            .replace("-", " ")
            .title()
        )

        conv.title = f"{clean_name} Region Analysis"
        conv.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(sar_image)

    return sar_image


@router.post(
    "/{conversation_id}/process",
    response_model=ConversationResponse,
)
def process_sar_image(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found",
        )

    # Find the most recently uploaded SAR image.
    sar_image = (
        db.query(Image)
        .filter(
            Image.conversation_id == conversation_id,
            Image.type == "original_sar",
        )
        .order_by(Image.created_at.desc())
        .first()
    )

    if not sar_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No uploaded SAR image found in this conversation.",
        )

    # Resolve the uploaded image's physical path.
    relative_sar = sar_image.file_path.replace("/uploads/", "", 1)

    abs_sar_path = os.path.abspath(
        os.path.join(settings.UPLOAD_DIR, relative_sar)
    )

    if not os.path.isfile(abs_sar_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The uploaded SAR image file could not be found.",
        )

    conv_dir = os.path.join(settings.UPLOAD_DIR, conversation_id)
    os.makedirs(conv_dir, exist_ok=True)

    # ---------------------------------------------------------
    # Step 1: Pix2Pix SAR-to-optical image translation
    # ---------------------------------------------------------
    pix2pix_filename = f"pix2pix_rgb_{os.path.basename(abs_sar_path)}"
    abs_pix2pix_path = os.path.join(conv_dir, pix2pix_filename)

    pix2pix_service.colorize(
        abs_sar_path,
        abs_pix2pix_path,
    )

    relative_pix2pix = (
        f"/uploads/{conversation_id}/{pix2pix_filename}"
    )

    pix2pix_image = Image(
        conversation_id=conversation_id,
        type="pix2pix_rgb",
        file_path=relative_pix2pix,
        meta_data={
            "model": "Pix2Pix",
            "full_name": "Pix2Pix Conditional GAN",
            "task": "SAR-to-Optical Image Translation",
        },
    )

    db.add(pix2pix_image)

    # ---------------------------------------------------------
    # Step 2: Existing EuroSAT-Swin terrain classification
    # ---------------------------------------------------------
    terrain_data = terrain_service.analyze(abs_pix2pix_path)

    # ---------------------------------------------------------
    # Step 3: Existing RGB image analysis
    # ---------------------------------------------------------
    image_stats = image_analysis_service.analyze(abs_pix2pix_path)

    # ---------------------------------------------------------
    # Step 4: NEW land-cover analysis
    # ---------------------------------------------------------
    land_cover_filename = (
        f"land_cover_{os.path.splitext(pix2pix_filename)[0]}.png"
    )

    land_cover_map_path = os.path.join(
        conv_dir,
        land_cover_filename,
    )

    land_cover_data = land_cover_service.analyze(
        abs_pix2pix_path,
        land_cover_map_path,
    )

    # Provide a URL that the frontend can use to display the map.
    land_cover_data["segmentation_map_url"] = (
        f"/uploads/{conversation_id}/{land_cover_filename}"
    )

    # Avoid returning an absolute local filesystem path to the client.
    land_cover_data.pop("segmentation_map_path", None)

    # ---------------------------------------------------------
    # Step 5: Save model information and all analysis results
    # ---------------------------------------------------------
    model_info = {
        "pix2pix_version": "Pix2Pix Generator (pth)",
        "full_name": "Pix2Pix Conditional GAN",
        "task": "SAR-to-Optical Image Translation",
        "terrain_model": "EuroSAT-Swin Transformer",
        "image_analysis": "RGB Channel Statistics",
        "land_cover_model": (
            "SegFormer-B0 (general-purpose segmentation)"
        ),
    }

    # Preserve the existing RGB analysis and add land-cover results
    # inside the existing JSON field. No new database column needed.
    combined_image_stats = {
        **image_stats,
        "land_cover_analysis": land_cover_data,
    }

    analysis = Analysis(
        conversation_id=conversation_id,
        terrain_analysis=terrain_data,
        image_analysis=combined_image_stats,
        model_information=model_info,
    )

    db.add(analysis)
    conv.updated_at = datetime.utcnow()

    db.commit()

    # Return the updated conversation with its analysis.
    return (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )
@router.get(
    "/{conversation_id}/messages",
    response_model=List[MessageResponse],
)
def get_chat_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found",
        )

    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )


@router.post(
    "/{conversation_id}/chat",
    response_model=MessageResponse,
)
def send_chat_message(
    conversation_id: str,
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = chat_request.message.strip()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a question.",
        )

    if len(question) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The message must be 2000 characters or fewer.",
        )

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found",
        )

    # Find the latest generated RGB image.
    rgb_image = (
        db.query(Image)
        .filter(
            Image.conversation_id == conversation_id,
            Image.type.in_([
                "pix2pix_rgb",
                "wflmgan_rgb",
                "mcgan_rgb",
            ]),
        )
        .order_by(Image.created_at.desc())
        .first()
    )

    if not rgb_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload and process a SAR image before chatting.",
        )

    # Find the latest saved analysis.
    analysis = (
        db.query(Analysis)
        .filter(Analysis.conversation_id == conversation_id)
        .order_by(Analysis.created_at.desc())
        .first()
    )

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No analysis results found. Process the image first.",
        )

    # Build the absolute path to the generated image.
    relative_path = rgb_image.file_path.replace(
        "/uploads/", "", 1
    )

    image_path = os.path.abspath(
        os.path.join(settings.UPLOAD_DIR, relative_path)
    )

    if not os.path.isfile(image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The generated RGB image file could not be found.",
        )

    # Load recent conversation history before saving this question.
    previous_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    history = [
        {"role": item.role, "content": item.content}
        for item in previous_messages[-6:]
    ]

    # Save the user's question.
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=question,
    )

    db.add(user_message)
    db.commit()

    # Ask the existing Florence-2 vision service.
    try:
        # Lazy import: don't load the vision model when the API starts.
        from test_vlm import vlm_service

        answer = vlm_service.answer(
            question=question,
            image_path=image_path,
            terrain_analysis=analysis.terrain_analysis,
            image_analysis=analysis.image_analysis,
            conversation_history=history,
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        answer = f"AI error: {type(e).__name__}: {e}"

    # Save and return the assistant's answer.
    assistant_message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=answer,
    )

    conversation.updated_at = datetime.utcnow()

    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return assistant_message