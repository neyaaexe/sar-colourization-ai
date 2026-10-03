import os
import sys
import torch
import numpy as np
from PIL import Image

SAR2OPTICAL_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../SAR2Optical"
    )
)

if SAR2OPTICAL_DIR not in sys.path:
    sys.path.insert(0, SAR2OPTICAL_DIR)

from src.pix2pix import Pix2Pix


# -----------------------------
# SETTINGS
# -----------------------------

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

checkpoint_path = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../pix2pix/pix2pix_gen_180.pth"
    )
)

examples_dir = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../SAR2Optical/data/examples"
    )
)

output_dir = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../SAR2Optical/output"
    )
)

os.makedirs(output_dir, exist_ok=True)


# -----------------------------
# LOAD MODEL
# -----------------------------

print("Device:", device)
print("Checkpoint:", checkpoint_path)

model = Pix2Pix(
    c_in=3,
    c_out=3,
    is_train=False
)

model.to(device)

state_dict = torch.load(
    checkpoint_path,
    map_location=device,
    weights_only=True
)

result = model.gen.load_state_dict(
    state_dict,
    strict=False
)

print("\nCHECKPOINT CHECK")
print("Missing keys:", result.missing_keys)
print("Unexpected keys:", result.unexpected_keys)

model.eval()

print("\nModel loaded.")


# -----------------------------
# FIND EXAMPLES
# -----------------------------

files = [
    f for f in os.listdir(examples_dir)
    if f.lower().endswith((".png", ".jpg", ".jpeg"))
]

print("\nExample images found:")

for file in files:
    print(" -", file)


# -----------------------------
# RUN INFERENCE
# -----------------------------

for filename in files:

    input_path = os.path.join(
        examples_dir,
        filename
    )

    output_filename = (
        os.path.splitext(filename)[0]
        + "_pix2pix_output.png"
    )

    output_path = os.path.join(
        output_dir,
        output_filename
    )

    print("\n" + "=" * 60)
    print("IMAGE:", filename)

    image = Image.open(
        input_path
    ).convert("RGB")

    image = image.resize(
        (256, 256)
    )

    image_array = np.asarray(
        image,
        dtype=np.float32
    )

    print(
        "Input:",
        "min =", image_array.min(),
        "max =", image_array.max(),
        "mean =", image_array.mean()
    )

    image_tensor = torch.from_numpy(
        image_array
    ).permute(2, 0, 1)

    image_tensor = image_tensor.unsqueeze(0)

    # Same normalization used during training
    image_tensor = image_tensor / 255.0
    image_tensor = (
        image_tensor - 0.5
    ) / 0.5

    image_tensor = image_tensor.to(device)

    # -------------------------
    # GENERATE
    # -------------------------

    with torch.no_grad():

        raw_output = model.generate(
            image_tensor,
            is_scaled=True,
            to_uint8=False
        )

    print(
        "Raw output:",
        "min =", raw_output.min().item(),
        "max =", raw_output.max().item(),
        "mean =", raw_output.mean().item()
    )

    # -------------------------
    # DENORMALIZE
    # -------------------------

    generated = (
        raw_output + 1
    ) / 2

    print(
        "After denormalization:",
        "min =", generated.min().item(),
        "max =", generated.max().item(),
        "mean =", generated.mean().item()
    )

    # -------------------------
    # RGB
    # -------------------------

    generated = (
        generated
        .squeeze(0)
        .permute(1, 2, 0)
        .cpu()
        .numpy()
    )

    generated = np.clip(
        generated * 255,
        0,
        255
    ).astype(np.uint8)

    print(
        "Final RGB:",
        "min =", generated.min(),
        "max =", generated.max(),
        "mean =", generated.mean()
    )

    print(
        "Red mean:",
        generated[:, :, 0].mean()
    )

    print(
        "Green mean:",
        generated[:, :, 1].mean()
    )

    print(
        "Blue mean:",
        generated[:, :, 2].mean()
    )

    # -------------------------
    # SAVE
    # -------------------------

    Image.fromarray(
        generated,
        mode="RGB"
    ).save(
        output_path,
        format="PNG"
    )

    print(
        "Saved:",
        output_path
    )


print("\n" + "=" * 60)
print("DONE")
print("Outputs are in:")
print(output_dir)