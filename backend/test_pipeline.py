import os
import time
import requests
from PIL import Image
import numpy as np

BASE_URL = "http://localhost:8000"

def test_full_pipeline():
    print("=== Testing SAR Colourization using AI API (Upload & Processing) ===")

    # Use unique email for clean test registration
    unique_email = f"test_user_{int(time.time())}@satellite.ai"
    password = "TestPassword123!"

    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={"email": unique_email, "password": password})
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
    token = reg_resp.json()["access_token"]
    print(f"[SUCCESS] User Registration successful for {unique_email}")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Me
    me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_resp.status_code == 200, f"Get me failed: {me_resp.text}"
    user_id = me_resp.json()["id"]
    print(f"[SUCCESS] User Authenticated: {me_resp.json()['email']} (ID: {user_id})")

    # 3. Create Conversation Session
    conv_resp = requests.post(f"{BASE_URL}/conversations", json={"title": "Coastal Region Analysis"}, headers=headers)
    assert conv_resp.status_code == 201, f"Create conversation failed: {conv_resp.text}"
    conv_id = conv_resp.json()["id"]
    print(f"[SUCCESS] Analysis session created: {conv_id}")

    # 4. Generate Synthetic SAR Test Image
    test_img_path = "sample_sar_radar.png"
    arr = np.random.randint(20, 240, (512, 512), dtype=np.uint8)
    Image.fromarray(arr).save(test_img_path)

    # 5. Upload SAR Image
    with open(test_img_path, "rb") as f:
        upload_resp = requests.post(
            f"{BASE_URL}/conversations/{conv_id}/upload",
            files={"file": (test_img_path, f, "image/png")},
            headers=headers
        )
    assert upload_resp.status_code == 200, f"Upload image failed: {upload_resp.text}"
    print(f"[SUCCESS] Image Uploaded: {upload_resp.json()['file_path']}")

    # 6. Trigger Colorization, Terrain & Image Analysis Pipeline
    proc_resp = requests.post(f"{BASE_URL}/conversations/{conv_id}/process", headers=headers)
    assert proc_resp.status_code == 200, f"Process image failed: {proc_resp.text}"
    proc_data = proc_resp.json()
    print(f"[SUCCESS] Image Colorization & Analysis complete")
    print(f"  - Generated Optical Image: {proc_data['images'][-1]['file_path']}")
    print(f"  - Terrain Breakdown: {proc_data['analyses'][0]['terrain_analysis']}")
    print(f"  - Image Stats: {proc_data['analyses'][0]['image_analysis']}")

    # 7. List Conversations (History)
    hist_resp = requests.get(f"{BASE_URL}/conversations", headers=headers)
    assert hist_resp.status_code == 200, f"List conversations failed: {hist_resp.text}"
    print(f"[SUCCESS] History Sessions retrieved ({len(hist_resp.json())} session(s))")

    # Clean up test image
    if os.path.exists(test_img_path):
        os.remove(test_img_path)

    print("\nALL PIPELINE VERIFICATIONS PASSED CLEANLY!")

if __name__ == "__main__":
    test_full_pipeline()
