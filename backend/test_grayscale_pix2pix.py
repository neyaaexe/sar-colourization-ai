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


device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

checkpoint_path = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../pix2pix/pix2pix_gen_180.pth"
    )
)

input_path = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "uploads",
        "568baf0c-639a-4b65-858c-fce6d0fe2e6b",
        "original_sar_sarimagesample.png"
    )
)

output_path = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "grayscale_pix2pix_test.png"
    )
)


# Load model
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

model.gen.load_state_dict(
    state_dict,
    strict=True
)

model.eval()


# Load SAR as GRAYSCALE
image = Image.open(
    input_path
).convert("L")

print("Grayscale input:")
gray_array = np.asarray(
    image,
    dtype=np.float32
)

print(
    "min =", gray_array.min(),
    "max =", gray_array.max(),
    "mean =", gray_array.mean(),
    "std =", gray_array.std()
)


# Convert grayscale back to 3 channels
image = image.convert("RGB")

image = image.resize(
    (256, 256)
)

image_array = np.asarray(
    image,
    dtype=np.float32
)

print("\nRGB after grayscale conversion:")
print(
    "R mean =", image_array[:, :, 0].mean()
)

print(
    "G mean =", image_array[:, :, 1].mean()
)

print(
    "B mean =", image_array[:, :, 2].mean()
)


# Normalize exactly like training
image_tensor = torch.from_numpy(
    image_array
).permute(2, 0, 1)

image_tensor = image_tensor.unsqueeze(0)

image_tensor = image_tensor / 255.0

image_tensor = (
    image_tensor - 0.5
) / 0.5

image_tensor = image_tensor.to(device)


# Generate
with torch.no_grad():

    generated = model.generate(
        image_tensor,
        is_scaled=True,
        to_uint8=False
    )


print("\nRaw output:")
print(
    "min =", generated.min().item(),
    "max =", generated.max().item(),
    "mean =", generated.mean().item()
)


# Convert to RGB
generated = (
    generated
    .squeeze(0)
    .permute(1, 2, 0)
    .cpu()
    .numpy()
)

generated = (
    np.clip(
        generated,
        0,
        1
    ) * 255
).astype(np.uint8)


print("\nFinal output:")
print(
    "min =", generated.min(),
    "max =", generated.max(),
    "mean =", generated.mean()
)

print(
    "Red mean =",
    generated[:, :, 0].mean()
)

print(
    "Green mean =",
    generated[:, :, 1].mean()
)

print(
    "Blue mean =",
    generated[:, :, 2].mean()
)


Image.fromarray(
    generated,
    mode="RGB"
).save(
    output_path,
    format="PNG"
)

print("\nSaved:")
print(output_path)