import os
from typing import List, Dict, Any, Optional

import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForCausalLM


class VLMService:
    """
    Hugging Face Florence-2 vision-language service.

    Uses:
        - Pix2Pix generated RGB image
        - EuroSAT-Swin terrain classification
        - Pillow/NumPy image statistics
        - Conversation history
        - User's natural-language question
    """

    MODEL_NAME = "microsoft/Florence-2-base-ft"

    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        self.torch_dtype = (
            torch.float16
            if self.device.type == "cuda"
            else torch.float32
        )

        print(f"[VLM] Loading {self.MODEL_NAME}...")
        print(f"[VLM] Device: {self.device}")
        print(f"[VLM] Dtype: {self.torch_dtype}")

        self.processor = AutoProcessor.from_pretrained(
            self.MODEL_NAME,
            trust_remote_code=True
        )

        self.model = AutoModelForCausalLM.from_pretrained(
            self.MODEL_NAME,
            torch_dtype=self.torch_dtype,
            trust_remote_code=True
        )

        self.model.to(self.device)
        self.model.eval()

        print("[VLM] Florence-2 loaded successfully!")

    def answer(
        self,
        question: str,
        image_path: Optional[str] = None,
        terrain_analysis: Optional[Dict[str, Any]] = None,
        image_analysis: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:

        if not question or not question.strip():
            return "Please ask a question about the SAR image."

        question = question.strip()

        # ---------------------------------------------------------
        # Build verified analysis context
        # ---------------------------------------------------------

        context_parts = []

        if terrain_analysis:
            terrain = terrain_analysis.get(
                "predicted_terrain",
                "Unknown"
            )

            confidence = terrain_analysis.get(
                "confidence",
                "Unknown"
            )

            model_name = terrain_analysis.get(
                "model",
                "EuroSAT-Swin"
            )

            context_parts.append(
                f"Terrain classification: {terrain}. "
                f"Model confidence: {confidence}%. "
                f"Terrain model: {model_name}."
            )

        if image_analysis:
            width = image_analysis.get("image_width")
            height = image_analysis.get("image_height")
            channels = image_analysis.get("channels")
            brightness = image_analysis.get("brightness")
            contrast = image_analysis.get("contrast")
            dominant_channel = image_analysis.get("dominant_channel")

            context_parts.append(
                f"Image dimensions: {width}x{height}. "
                f"Channels: {channels}. "
                f"Brightness: {brightness}. "
                f"Contrast: {contrast}. "
                f"Dominant RGB channel: {dominant_channel}."
            )

        verified_context = "\n".join(context_parts)

        # ---------------------------------------------------------
        # Conversation context
        # ---------------------------------------------------------

        history_context = ""

        if conversation_history:
            recent_messages = conversation_history[-6:]

            history_lines = []

            for message in recent_messages:
                role = message.get("role", "")
                content = message.get("content", "")

                if content:
                    history_lines.append(
                        f"{role}: {content}"
                    )

            if history_lines:
                history_context = "\n".join(history_lines)

        # ---------------------------------------------------------
        # Build prompt
        # ---------------------------------------------------------

        prompt = (
            "<MORE_DETAILED_CAPTION>\n"
            "You are an AI assistant analyzing a remote-sensing image.\n\n"
            f"Verified analysis data:\n{verified_context}\n\n"
        )

        if history_context:
            prompt += (
                f"Recent conversation:\n{history_context}\n\n"
            )

        prompt += (
            f"User question: {question}\n\n"
            "Answer the user's question clearly and naturally. "
            "Use the image together with the verified analysis data. "
            "Do not invent measurements or percentages. "
            "The terrain confidence is model confidence, not classification accuracy. "
            "If the image does not provide enough evidence for an exact answer, "
            "say so."
        )

        # ---------------------------------------------------------
        # Load image
        # ---------------------------------------------------------

        if image_path is None:
            return (
                "I need the generated RGB image to answer "
                "visual questions about the scene."
            )

        if not os.path.exists(image_path):
            return (
                f"The image required for visual analysis "
                f"could not be found: {image_path}"
            )

        image = Image.open(image_path).convert("RGB")

        # ---------------------------------------------------------
        # Florence-2 processing
        # ---------------------------------------------------------

        inputs = self.processor(
            text=prompt,
            images=image,
            return_tensors="pt"
        )

        # Match floating-point tensors to model dtype.
        inputs = {
            key: value.to(self.device, self.torch_dtype)
            if hasattr(value, "to") and value.is_floating_point()
            else value.to(self.device)
            if hasattr(value, "to")
            else value
            for key, value in inputs.items()
        }

        # ---------------------------------------------------------
        # Generate answer
        # ---------------------------------------------------------

        with torch.no_grad():
            generated_ids = self.model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=128,
                num_beams=3
            )

        generated_text = self.processor.batch_decode(
            generated_ids,
            skip_special_tokens=False
        )[0]

        # ---------------------------------------------------------
        # Post-process Florence-2 output
        # ---------------------------------------------------------

        try:
            result = self.processor.post_process_generation(
                generated_text,
                task="<MORE_DETAILED_CAPTION>",
                image_size=image.size
            )
        except Exception:
            result = generated_text

        # Convert result to readable text.
        if isinstance(result, dict):
            answer_text = result.get(
                "<MORE_DETAILED_CAPTION>",
                str(result)
            )
        else:
            answer_text = str(result)

        answer_text = answer_text.strip()

        if not answer_text:
            return (
                "I couldn't generate a useful answer from "
                "the image. Please try asking the question differently."
            )

        return answer_text


# Load the model once when the backend starts.
vlm_service = VLMService()