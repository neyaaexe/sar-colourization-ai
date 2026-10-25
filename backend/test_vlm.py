
import os
from typing import List, Dict, Any, Optional

import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForCausalLM


class VLMService:
    """
    Florence-2 vision-language service.

    Uses:
        - Pix2Pix generated RGB image
        - EuroSAT-Swin terrain classification
        - Image statistics
        - Conversation history

    Factual analysis questions are answered from saved analysis
    results. Florence-2 is used for image-captioning questions.
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

    def answer_from_analysis(
        self,
        question: str,
        terrain_analysis: Optional[Dict[str, Any]] = None,
        image_analysis: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """Answer supported factual questions using saved results."""

        q = question.lower().strip()

        terrain_data = terrain_analysis or {}
        stats = image_analysis or {}

        # Terrain prediction and classification.
        terrain_keywords = (
            "terrain",
            "land cover",
            "land-cover",
            "classif",
            "predicted",
            "prediction",
        )

        if any(word in q for word in terrain_keywords):
            terrain = terrain_data.get("predicted_terrain")
            confidence = terrain_data.get("confidence")
            model_name = terrain_data.get(
                "model", "EuroSAT-Swin"
            )

            if terrain is None:
                return (
                    "The terrain prediction is not available "
                    "in the saved analysis results."
                )

            reply = f"The predicted terrain is {terrain}."

            if confidence is not None:
                try:
                    confidence_value = float(confidence)

                    reply += (
                        f" The reported model confidence is "
                        f"{confidence_value:.2f}%."
                    )

                    if confidence_value < 30:
                        reply += (
                            " This is a low-confidence prediction, "
                            "so the result should be treated cautiously."
                        )

                except (TypeError, ValueError):
                    reply += (
                        f" The reported confidence is {confidence}%."
                    )

            reply += f" Classification model: {model_name}."

            return reply

        # Brightness.
        if "brightness" in q:
            brightness = stats.get("brightness")

            if brightness is not None:
                return f"The image brightness is {brightness}."

            return "Brightness is not available in the saved analysis."

        # Contrast.
        if "contrast" in q:
            contrast = stats.get("contrast")

            if contrast is not None:
                return f"The image contrast is {contrast}."

            return "Contrast is not available in the saved analysis."

        # Image dimensions or resolution.
        if "dimension" in q or "resolution" in q:
            width = stats.get("image_width")
            height = stats.get("image_height")

            if width is not None and height is not None:
                return (
                    f"The image dimensions are "
                    f"{width} × {height} pixels."
                )

            return (
                "Image dimensions are not available "
                "in the saved analysis."
            )

        # Number of image channels.
        if "channel" in q:
            channels = stats.get("channels")
            dominant_channel = stats.get("dominant_channel")

            if "dominant" in q:
                if dominant_channel is not None:
                    return (
                        f"The dominant RGB channel is "
                        f"{dominant_channel}."
                    )

                return (
                    "The dominant RGB channel is not available "
                    "in the saved analysis."
                )

            if channels is not None:
                return f"The image has {channels} channels."

            if dominant_channel is not None:
                return (
                    f"The dominant RGB channel is "
                    f"{dominant_channel}."
                )

            return (
                "Channel information is not available "
                "in the saved analysis."
            )

        # Confidence questions.
        if "confidence" in q or "certain" in q or "reliable" in q:
            confidence = terrain_data.get("confidence")
            terrain = terrain_data.get("predicted_terrain")

            if confidence is not None:
                try:
                    value = float(confidence)

                    reply = (
                        f"The terrain model reported "
                        f"{value:.2f}% confidence"
                    )

                    if terrain is not None:
                        reply += f" for the prediction {terrain}"

                    reply += "."

                    if value < 30:
                        reply += (
                            " This is a low-confidence result and "
                            "should not be treated as a reliable "
                            "confirmation of the terrain."
                        )

                    return reply

                except (TypeError, ValueError):
                    return (
                        f"The reported terrain confidence is "
                        f"{confidence}%."
                    )

            return (
                "Terrain confidence is not available "
                "in the saved analysis."
            )

        # No supported factual question matched.
        return None

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

        # Answer factual analysis questions directly.
        # This avoids generating an unrelated caption first.
        analysis_answer = self.answer_from_analysis(
            question=question,
            terrain_analysis=terrain_analysis,
            image_analysis=image_analysis,
        )

        if analysis_answer is not None:
            return analysis_answer

        # Validate the image path for visual questions.
        if not image_path:
            return (
                "I need the generated RGB image to answer "
                "questions about the scene."
            )

        if not os.path.isfile(image_path):
            return (
                "The image required for visual analysis "
                "could not be found."
            )

        try:
            with Image.open(image_path) as source_image:
                image = source_image.convert("RGB")

            # Florence-2 detailed captioning.
            task_prompt = "<MORE_DETAILED_CAPTION>"

            inputs = self.processor(
                text=task_prompt,
                images=image,
                return_tensors="pt"
            )

            # Move inputs to the model's device.
            inputs = {
                key: (
                    value.to(
                        device=self.device,
                        dtype=self.torch_dtype
                    )
                    if value.is_floating_point()
                    else value.to(self.device)
                )
                if hasattr(value, "to")
                else value
                for key, value in inputs.items()
            }

            with torch.no_grad():
                generated_ids = self.model.generate(
                    input_ids=inputs["input_ids"],
                    pixel_values=inputs["pixel_values"],
                    max_new_tokens=128,
                    num_beams=3
                )

            # Decode and post-process the caption.
            generated_text = self.processor.batch_decode(
                generated_ids,
                skip_special_tokens=False
            )[0]

            result = self.processor.post_process_generation(
                generated_text,
                task=task_prompt,
                image_size=image.size
            )

            if isinstance(result, dict):
                answer_text = result.get(task_prompt, "")
            else:
                answer_text = str(result)

            answer_text = str(answer_text).strip()

            if not answer_text:
                return (
                    "I couldn't generate a useful image description. "
                    "Please try processing the image again."
                )

            # Be transparent: this is a caption, not a
            # question-specific visual answer.
            response = (
                f"I can describe the image, but my current "
                f"Florence-2 captioning mode cannot reliably answer "
                f"that specific visual question.\n\n"
                f"Image description: {answer_text}"
            )

            return response

        except Exception as e:
            import traceback

            print("[VLM] Failed to analyze image:")
            traceback.print_exc()

            return (
                "The image analysis failed. "
                f"Error: {type(e).__name__}: {e}"
            )


# Load the model once when the backend starts.
vlm_service = VLMService()
