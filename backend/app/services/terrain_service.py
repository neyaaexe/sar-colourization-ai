
import os

import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageClassification


MODEL_NAME = "Adilbai/EuroSAT-Swin"


class TerrainService:
    """
    AI-based terrain classification service.

    Uses a pretrained EuroSAT-Swin model to classify
    satellite images into land-cover categories.
    """

    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        print(f"[Terrain] Loading {MODEL_NAME}...")

        # Load the pretrained classification model.
        self.model = AutoModelForImageClassification.from_pretrained(
            MODEL_NAME
        )

        self.model.to(self.device)
        self.model.eval()

        # Preprocessing configuration.
        # This avoids requiring a missing preprocessor_config.json.
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        print(
            f"[Terrain] Model loaded successfully "
            f"on {self.device}"
        )

    def analyze(self, image_path: str) -> dict:
        """
        Classify a satellite image and return the top
        three predicted terrain classes and their scores.
        """

        if not os.path.exists(image_path):
            raise FileNotFoundError(
                f"Terrain analysis image not found: {image_path}"
            )

        # Open the image and convert it to RGB.
        with Image.open(image_path) as source_image:
            image = source_image.convert("RGB")

        # Resize, normalize, and convert the image to a tensor.
        image_tensor = self.transform(image)
        image_tensor = image_tensor.unsqueeze(0)
        image_tensor = image_tensor.to(self.device)

        # Run classification.
        with torch.inference_mode():
            outputs = self.model(
                pixel_values=image_tensor
            )

        # Convert logits to probabilities.
        probabilities = torch.softmax(
            outputs.logits,
            dim=-1
        )

        # Get up to three highest-scoring predictions.
        top_k = min(3, probabilities.shape[-1])

        top_probs, top_indices = torch.topk(
            probabilities,
            k=top_k,
            dim=-1
        )

        # Get the highest-scoring class.
        class_id = top_indices[0, 0].item()

        predicted_class = self.model.config.id2label[
            class_id
        ]

        confidence = top_probs[0, 0].item() * 100

        # Format the top predictions.
        top_predictions = []

        for probability, index in zip(
            top_probs[0],
            top_indices[0]
        ):
            label = self.model.config.id2label[
                index.item()
            ]

            top_predictions.append({
                "terrain": label,
                "confidence": round(
                    probability.item() * 100, 2
                )
            })

        return {
            "model": MODEL_NAME,
            "predicted_terrain": predicted_class,
            "confidence": round(confidence, 2),
            "top_predictions": top_predictions,
            "device": str(self.device)
        }


# Initialize the terrain classification service.
terrain_service = TerrainService()
