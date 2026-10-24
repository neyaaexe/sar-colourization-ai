
import os

import numpy as np
import torch
from PIL import Image
from transformers import (
    AutoImageProcessor,
    AutoModelForSemanticSegmentation,
)


MODEL_NAME = "nvidia/segformer-b0-finetuned-ade-512-512"

# Approximate grouping of segmentation labels into land-cover classes.
CLASS_GROUPS = {
    "water": {"water", "sea", "river", "lake", "swimming pool"},
    "vegetation": {
        "tree", "grass", "plant", "flower", "field",
        "palm", "bush", "forest", "flowerpot"
    },
    "bare_land": {
        "earth", "sand", "soil", "dirt", "rock", "hill",
        "mountain", "desert", "land"
    },
    "built_up": {
        "building", "house", "skyscraper", "road", "street",
        "sidewalk", "bridge", "wall", "roof", "runway"
    },
}

# Colors used only to visualize the predicted classes.
CLASS_COLORS = {
    "water": (40, 110, 240),
    "vegetation": (40, 180, 80),
    "bare_land": (220, 165, 75),
    "built_up": (220, 70, 70),
    "other": (150, 150, 150),
}


class LandCoverService:
    """Estimate land-cover percentages using semantic segmentation."""

    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        print(f"[LandCover] Loading {MODEL_NAME}...")

        self.processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
        self.model = (
            AutoModelForSemanticSegmentation.from_pretrained(MODEL_NAME)
        )

        self.model.to(self.device)
        self.model.eval()

        # Normalize the model's label names for reliable matching.
        self.id_to_label = {
            int(class_id): str(label).lower().replace("_", " ").strip()
            for class_id, label in self.model.config.id2label.items()
        }

        print(f"[LandCover] Model loaded on {self.device}")

    def analyze(self, image_path: str, output_map_path: str) -> dict:
        if not os.path.isfile(image_path):
            raise FileNotFoundError(
                f"Land-cover input image not found: {image_path}"
            )

        with Image.open(image_path) as source:
            image = source.convert("RGB")

        width, height = image.size

        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {
            key: value.to(self.device)
            for key, value in inputs.items()
        }

        with torch.inference_mode():
            outputs = self.model(**inputs)

            # Resize predictions back to the original image dimensions.
            logits = torch.nn.functional.interpolate(
                outputs.logits,
                size=(height, width),
                mode="bilinear",
                align_corners=False,
            )
            predicted = logits.argmax(dim=1)[0].cpu().numpy()

        class_map = np.full(
            (height, width), "other", dtype=object
        )

        # Assign each predicted model label to a broad category.
        for class_id, label in self.id_to_label.items():
            category = "other"

            for group, labels in CLASS_GROUPS.items():
                if label in labels:
                    category = group
                    break

            class_map[predicted == class_id] = category

        total_pixels = int(class_map.size)
        counts = {
            category: int(np.count_nonzero(class_map == category))
            for category in CLASS_COLORS
        }

        percentages = {
            category: round(count / total_pixels * 100, 2)
            for category, count in counts.items()
        }

        # Create a color-coded predicted segmentation map.
        visual = np.zeros((height, width, 3), dtype=np.uint8)

        for category, color in CLASS_COLORS.items():
            visual[class_map == category] = color

        os.makedirs(os.path.dirname(output_map_path) or ".", exist_ok=True)
        Image.fromarray(visual).save(output_map_path)

        return {
            "model": MODEL_NAME,
            "method": "semantic_segmentation",
            "percentages": percentages,
            "pixel_counts": counts,
            "total_pixels": total_pixels,
            "segmentation_map_path": output_map_path,
            "warning": (
                "Approximate land-cover estimates. This model was trained "
                "on general scene images, not specifically satellite imagery. "
                "Validate its predictions before relying on the percentages."
            ),
        }


land_cover_service = LandCoverService()
