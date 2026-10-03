import os

import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageClassification


MODEL_NAME = "Adilbai/EuroSAT-Swin"


class TerrainService:
    """
    AI-based terrain classification service.

    Uses the pretrained EuroSAT-Swin model to classify
    Sentinel-1 SAR imagery into land-cover categories.
    """

    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        print(f"[Terrain] Loading {MODEL_NAME}...")

        self.model = AutoModelForImageClassification.from_pretrained(
            MODEL_NAME
        )

        self.model.to(self.device)
        self.model.eval()

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
        Classify the terrain represented by the input image.
        """

        if not os.path.exists(image_path):
            raise FileNotFoundError(
                f"Terrain analysis image not found: {image_path}"
            )

        image = Image.open(image_path).convert("RGB")

        image_tensor = self.transform(image)
        image_tensor = image_tensor.unsqueeze(0)
        image_tensor = image_tensor.to(self.device)

        with torch.no_grad():
            outputs = self.model(
                pixel_values=image_tensor
            )

        probabilities = torch.softmax(
            outputs.logits,
            dim=-1
        )

        top_probability, top_index = torch.max(
            probabilities,
            dim=-1
        )

        class_id = top_index.item()

        # EuroSAT-Swin uses integer keys in id2label.
        predicted_class = self.model.config.id2label[
            class_id
        ]

        confidence = float(
            top_probability.item()
        )

        return {
            "model": "EuroSAT-Swin",
            "predicted_terrain": predicted_class,
            "confidence": round(confidence * 100, 2),
            "device": str(self.device)
        }


terrain_service = TerrainService()