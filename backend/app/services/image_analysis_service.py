import os

from PIL import Image
import numpy as np


class ImageAnalysisService:
    """
    Image analysis service.

    Extracts measurable properties from the generated
    Pix2Pix RGB image.
    """

    @staticmethod
    def analyze(image_path: str) -> dict:

        if not os.path.exists(image_path):
            raise FileNotFoundError(
                f"Image analysis file not found: {image_path}"
            )

        image = Image.open(image_path).convert("RGB")

        image_array = np.asarray(
            image,
            dtype=np.float32
        )

        height, width = image_array.shape[:2]

        # RGB channel statistics
        red = image_array[:, :, 0]
        green = image_array[:, :, 1]
        blue = image_array[:, :, 2]

        # Overall brightness
        brightness = float(
            np.mean(image_array)
        )

        # Contrast = standard deviation
        contrast = float(
            np.std(image_array)
        )

        # Channel averages
        mean_red = float(np.mean(red))
        mean_green = float(np.mean(green))
        mean_blue = float(np.mean(blue))

        # Dominant channel
        channel_means = {
            "red": mean_red,
            "green": mean_green,
            "blue": mean_blue
        }

        dominant_channel = max(
            channel_means,
            key=channel_means.get
        )

        # File information
        file_size = os.path.getsize(image_path)

        return {
            "image_width": width,
            "image_height": height,
            "channels": 3,
            "format": image.format or "Unknown",

            "brightness": round(
                brightness, 2
            ),

            "contrast": round(
                contrast, 2
            ),

            "mean_red": round(
                mean_red, 2
            ),

            "mean_green": round(
                mean_green, 2
            ),

            "mean_blue": round(
                mean_blue, 2
            ),

            "dominant_channel": dominant_channel,

            "file_size_bytes": file_size
        }


image_analysis_service = ImageAnalysisService()