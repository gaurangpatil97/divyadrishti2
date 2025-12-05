from ultralytics import YOLO
import cv2
from collections import Counter
import os

# --- CONFIGURATION ---
MODEL_PATH = 'best.pt'
CONFIDENCE_THRESHOLD = 0.6  # 60% sure or don't speak
# ---------------------

def detect_and_count(image_path):
    print(f"\n🔍 Analyzing: {image_path}...")
    
    # 1. Load the Brain
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Error: Model not found at {MODEL_PATH}")
        return
    
    model = YOLO(MODEL_PATH)

    # 2. Run Inference
    # conf=0.6 forces it to ignore weak guesses
    # save=True saves the result to runs/detect/predict...
    results = model.predict(source=image_path, conf=CONFIDENCE_THRESHOLD, save=True)
    
    # 3. Get the results
    result = results[0]
    box_classes = result.boxes.cls.cpu().numpy() # Class IDs (0, 1, 2...)
    class_names = result.names                   # Map {0: '10', 1: '20'...}

    # 4. Count the Notes
    detected_notes = [class_names[int(cls_id)] for cls_id in box_classes]
    counts = Counter(detected_notes)

    # 5. Print the Report
    print("-" * 30)
    print("💰 CURRENCY REPORT 💰")
    print("-" * 30)
    
    if len(detected_notes) == 0:
        print("❌ No currency detected.")
    else:
        total_value = 0
        for note, count in counts.items():
            print(f"✅ {note} Rupee Note: {count} pcs")
            # Calculate total value
            # Remove any non-digit text (like 'Rupee') if your classes have it
            clean_note_value = ''.join(filter(str.isdigit, str(note)))
            if clean_note_value.isdigit():
                total_value += int(clean_note_value) * count
        
        print("-" * 30)
        print(f"💵 Total Value Detected: ₹{total_value}")
    print("-" * 30)

    # 6. Show the Image
    annotated_img = result.plot()
    
    # Resize if image is huge (so it fits on screen)
    h, w = annotated_img.shape[:2]
    if w > 1200 or h > 800:
        scale = min(1200/w, 800/h)
        annotated_img = cv2.resize(annotated_img, (0,0), fx=scale, fy=scale)
        
    cv2.imshow("Smart Detection", annotated_img)
    print("Press any key to close the image...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # --- UPDATED IMAGE NAME HERE ---
    MY_TEST_IMAGE = "image5.jpg" 
    
    # Check if file exists
    if not os.path.exists(MY_TEST_IMAGE):
        print(f"⚠️ Warning: I can't find '{MY_TEST_IMAGE}'")
        print(f"Please make sure '{MY_TEST_IMAGE}' is inside: {os.getcwd()}")
        # Ask for input manually if file missing
        user_input = input("Or type the full path to an image here: ").strip('"')
        if user_input:
            MY_TEST_IMAGE = user_input

    detect_and_count(MY_TEST_IMAGE)