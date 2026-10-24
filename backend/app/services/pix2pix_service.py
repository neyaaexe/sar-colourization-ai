
import os
import sys

import torch
import numpy as np
from PIL import Image, ImageFilter
from huggingface_hub import hf_hub_download


# ============================================================
# PATH TO SAR2OPTICAL PROJECT
# ============================================================

SAR2OPTICAL_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../../../SAR2Optical"
    )
)

if SAR2OPTICAL_DIR not in sys.path:
    sys.path.insert(0, SAR2OPTICAL_DIR)

from src.pix2pix import Pix2Pix


# ============================================================
# PIX2PIX SERVICE
# ============================================================

class Pix2PixService:

    def __init__(self):

        # Select GPU if available
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        # Local checkpoint path
        self.checkpoint_path = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "../../../pix2pix/pix2pix_gen_180.pth"
            )
        )

        # Download checkpoint if it is not available locally
        if not os.path.exists(self.checkpoint_path):

            print(
                "[Pix2Pix] Local checkpoint not found. "
                "Downloading from Hugging Face..."
            )

            self.checkpoint_path = hf_hub_download(
                repo_id="Neyaathegreat/sar-pix2pix",
                filename="pix2pix_gen_180.pth",
                repo_type="model"
            )

        # Create model
        self.model = Pix2Pix(
            c_in=3,
            c_out=3,
            is_train=False
        )

        self.model.to(self.device)

        # Load trained generator
        self.model.load_model(
            self.checkpoint_path,
            device=self.device
        )

        self.model.eval()

        print(
            f"[Pix2Pix] Model loaded successfully on {self.device}"
        )

    # ========================================================
    # COLORIZE SAR IMAGE
    # ========================================================

    def colorize(
        self,
        sar_image_path: str,
        output_image_path: str
    ) -> str:

        if not os.path.exists(sar_image_path):
            raise FileNotFoundError(
                f"SAR image not found: {sar_image_path}"
            )

        # Create output directory if necessary
        output_directory = os.path.dirname(output_image_path)

        if output_directory:
            os.makedirs(output_directory, exist_ok=True)

        # Load input image
        image = Image.open(sar_image_path).convert("RGB")

        # Resize to the model's required input size
        image = image.resize(
            (256, 256),
            Image.Resampling.LANCZOS
        )

        # Convert PIL image to NumPy
        # Values remain in the [0, 255] range
        image_array = np.asarray(
            image,
            dtype=np.float32
        )

        # HWC -> CHW -> BCHW
        image_tensor = torch.from_numpy(
            image_array
        ).permute(2, 0, 1).unsqueeze(0)

        # Move tensor to CPU or GPU
        image_tensor = image_tensor.to(self.device)

        # Generate the colorized image
        # The model normalizes raw [0, 255] input internally
        with torch.no_grad():
            generated = self.model.generate(
                image_tensor,
                is_scaled=False,
                to_uint8=True
            )

        # BCHW -> HWC
        generated = generated.squeeze(0)
        generated = generated.permute(1, 2, 0)
        generated = generated.cpu().numpy()

        # Ensure valid RGB pixel values
        generated = np.clip(
            generated,
            0,
            255
        ).astype(np.uint8)

        # Convert generated pixels to a PIL image
        output = Image.fromarray(generated, mode="RGB")

        # ----------------------------------------------------
        # SHARPEN OUTPUT
        # ----------------------------------------------------
        # Enhances edges and makes existing details more visible.
        # This does not recover details that the model never generated.
        output = output.filter(
            ImageFilter.UnsharpMask(
                radius=1.2,
                percent=130,
                threshold=3
            )
        )

        # Save as high-quality JPEG
        output.save(
            output_image_path,
            format="JPEG",
            quality=95,
            subsampling=0
        )

        print(
            f"[Pix2Pix] Colorized image saved to: {output_image_path}"
        )

        return output_image_path


# ============================================================
# SINGLE SERVICE INSTANCE
# ============================================================

pix2pix_service = Pix2PixService()
