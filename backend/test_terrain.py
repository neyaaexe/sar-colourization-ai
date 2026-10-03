from transformers import AutoModelForImageClassification
from PIL import Image
import torch
from torchvision import transforms

MODEL_NAME = "Adilbai/EuroSAT-Swin"
IMAGE_PATH = r"..\SAR2Optical\data\imgs\sample.jpg"

print("Loading terrain model...")

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

# Load model
model = AutoModelForImageClassification.from_pretrained(
    MODEL_NAME
)

model.to(device)
model.eval()

print(f"Model loaded on: {device}")

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# Load image
image = Image.open(IMAGE_PATH).convert("RGB")

# Preprocess
image_tensor = transform(image)
image_tensor = image_tensor.unsqueeze(0)
image_tensor = image_tensor.to(device)

# Inference
with torch.no_grad():
    outputs = model(pixel_values=image_tensor)

probabilities = torch.softmax(
    outputs.logits,
    dim=-1
)

top_probability, top_index = torch.max(
    probabilities,
    dim=-1
)

# IMPORTANT:
# Get labels directly from the model configuration
predicted_class = model.config.id2label[
    top_index.item()
]

confidence = top_probability.item()

print()
print("========== TERRAIN RESULT ==========")
print(f"Predicted terrain : {predicted_class}")
print(f"Confidence        : {confidence:.2%}")
print("=====================================")