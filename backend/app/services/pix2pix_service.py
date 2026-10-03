import os
import sys

import torch
from PIL import Image
import numpy as np


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


# Import the Pix2Pix implementation
from src.pix2pix import Pix2Pix


# ============================================================
# PIX2PIX SERVICE
# ============================================================

class Pix2PixService:
    """
    Pix2Pix SAR-to-optical image translation service.

    Uses the pretrained Pix2Pix generator from
    the SAR2Optical project.
    """

    def __init__(self):

        # ----------------------------------------------------
        # Select GPU if available
        # ----------------------------------------------------

        self.device = torch.device(
            "cuda"
            if torch.cuda.is_available()
            else "cpu"
        )

        # ----------------------------------------------------
        # Path to pretrained checkpoint
        # ----------------------------------------------------

        self.checkpoint_path = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "../../../pix2pix/pix2pix_gen_180.pth"
            )
        )

        if not os.path.exists(self.checkpoint_path):
            raise FileNotFoundError(
                "Pix2Pix checkpoint not found: "
                f"{self.checkpoint_path}"
            )

        # ----------------------------------------------------
        # Create Pix2Pix model
        # ----------------------------------------------------

        self.model = Pix2Pix(
            c_in=3,
            c_out=3,
            is_train=False
        )

        self.model.to(self.device)

        # ----------------------------------------------------
        # Load pretrained generator
        # ----------------------------------------------------

        self.model.load_model(
            self.checkpoint_path,
            device=self.device
        )

        self.model.eval()

        print(
            f"[Pix2Pix] Model loaded successfully "
            f"on {self.device}"
        )

    # ========================================================
    # COLORIZE SAR IMAGE
    # ========================================================

    def colorize(
        self,
        sar_image_path: str,
        output_image_path: str
    ) -> str:

        # ----------------------------------------------------
        # Validate input image
        # ----------------------------------------------------

        if not os.path.exists(sar_image_path):
            raise FileNotFoundError(
                f"SAR image not found: {sar_image_path}"
            )

        # ----------------------------------------------------
        # Create output directory
        # ----------------------------------------------------

        output_directory = os.path.dirname(
            output_image_path
        )

        if output_directory:
            os.makedirs(
                output_directory,
                exist_ok=True
            )

        # ----------------------------------------------------
        # Load SAR image
        # ----------------------------------------------------

        image = Image.open(
            sar_image_path
        ).convert("RGB")

        # ----------------------------------------------------
        # Resize to Pix2Pix input size
        # ----------------------------------------------------

        image = image.resize(
            (256, 256)
        )

        # ----------------------------------------------------
        # Convert PIL → NumPy
        # ----------------------------------------------------

        image_array = np.asarray(
            image,
            dtype=np.float32
        )

        # ----------------------------------------------------
        # HWC → CHW
        # ----------------------------------------------------

        image_tensor = torch.from_numpy(
            image_array
        ).permute(
            2,
            0,
            1
        )

        # ----------------------------------------------------
        # Add batch dimension
        # ----------------------------------------------------

        image_tensor = image_tensor.unsqueeze(0)

        # ----------------------------------------------------
        # Normalize [0,255] → [-1,1]
        # ----------------------------------------------------

        image_tensor = image_tensor / 255.0

        image_tensor = (
            image_tensor - 0.5
        ) / 0.5

        # ----------------------------------------------------
        # Move tensor to GPU/CPU
        # ----------------------------------------------------

        image_tensor = image_tensor.to(
            self.device
        )

        # ----------------------------------------------------
        # Generate optical-like RGB image
        # ----------------------------------------------------

        with torch.no_grad():

            generated = self.model.generate(
                image_tensor,
                is_scaled=True,
                to_uint8=True
            )

        # ----------------------------------------------------
        # Tensor → NumPy
        # ----------------------------------------------------

        generated = generated.squeeze(0)

        generated = generated.permute(
            1,
            2,
            0
        )

        generated = generated.cpu().numpy()

        # ----------------------------------------------------
        # Ensure valid RGB range
        # ----------------------------------------------------

        generated = np.clip(
            generated,
            0,
            255
        ).astype(
            np.uint8
        )

        # ----------------------------------------------------
        # Save output
        # ----------------------------------------------------

        output = Image.fromarray(
            generated,
            mode="RGB"
        )

        output.save(
            output_image_path,
            format="JPEG",
            quality=95
        )

        return output_image_path


# ============================================================
# SINGLE SERVICE INSTANCE
# ============================================================

pix2pix_service = Pix2PixService()