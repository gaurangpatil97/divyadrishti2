import io
import time
import logging
from collections import defaultdict
from datetime import datetime
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
import torch
import numpy as np
from groq import Groq
from dotenv import load_dotenv
# Initialize Flask app
app = Flask(__name__)
CORS(app)
load_dotenv()
# Initialize Groq client (make sure to set GROQ_API_KEY environment variable)
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Configure logging (reduced for performance)
logging.basicConfig(
    level=logging.WARNING,  # Only warnings and errors
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== CONFIGURATION ====================
class Config:
    MODEL_FILE = 'yolo11n.pt'  # YOLOv11 Nano model
    COOLDOWN_TIME = 3.0  # Seconds between same alerts
    CONFIDENCE_THRESHOLD = 0.5

    # Priority objects for safety alerts
    PRIORITY_OBJECTS = {
        'person', 'car', 'bicycle', 'motorcycle', 'bus', 'truck', 
        'dog', 'cat', 'traffic light', 'stop sign', 'stairs', 'fire hydrant'
    }

    # Position threshold (percentage of frame width)
    CENTER_THRESHOLD = 0.2

    # --- SMART DISTANCE CALIBRATION ---
    # The value represents the "Area Ratio" (0.0 to 1.0) required 
    # for an object to be considered "CLOSE/UNSAFE".
    CLASS_THRESHOLDS = {
        # Small items (Need to be tiny to be close)
        'bottle': 0.05, 'cup': 0.04, 'cell phone': 0.04, 'book': 0.05,
        'cat': 0.05, 'dog': 0.10, 'backpack': 0.10,

        # Humans
        'person': 0.15,

        # Vehicles (Must be HUGE to be considered close)
        'bicycle': 0.15, 'car': 0.30, 'motorcycle': 0.20, 
        'bus': 0.50, 'truck': 0.45, 'train': 0.50,

        # Street Furniture
        'traffic light': 0.05, 'stop sign': 0.05, 'bench': 0.20, 
        'fire hydrant': 0.08, 'chair': 0.15, 'couch': 0.30, 
        'stairs': 0.25
    }
    
    # Fallback if class not in list above
    DEFAULT_THRESHOLD = 0.15

    # --- PERFORMANCE TUNING (KEPT INTACT) ---
    IMAGE_SIZE = 320          # YOLO input size (reduced for speed)
    MAX_IMAGE_EDGE = 480      # downscale very large images (reduced)
    USE_HALF = True           # fp16 on GPU for speed
    MAX_DETECTIONS = 8        # limit detections returned
    SKIP_RESIZE = False       # Skip expensive resize operations


config = Config()

# ==================== GLOBAL STATE ====================
last_announcement_time = defaultdict(float)
frame_count = 0
model = None
device = 'cuda' if torch.cuda.is_available() else 'cpu'

# ==================== MODEL INITIALIZATION ====================
def initialize_model():
    """Initialize YOLO model with GPU support if available."""
    global model
    
    logger.info(f"🔄 Loading YOLO model: {config.MODEL_FILE}...")
    
    try:
        model = YOLO(config.MODEL_FILE)
        
        # Use GPU if available
        if torch.cuda.is_available():
            device = 'cuda'
            logger.info(f"✅ GPU detected: {torch.cuda.get_device_name(0)}")
        else:
            device = 'cpu'
            logger.info("ℹ️  Running on CPU")
        
        model.to(device)
        logger.info(f"✅ Model loaded successfully on {device}!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        return False

# ==================== HELPER FUNCTIONS ====================
def should_announce(class_name: str) -> bool:
    """Check if enough time has passed to announce this object again."""
    current_time = time.time()
    if current_time - last_announcement_time[class_name] >= config.COOLDOWN_TIME:
        last_announcement_time[class_name] = current_time
        return True
    return False

def calculate_position(x1: float, x2: float, frame_width: int) -> str:
    """Determine object position relative to frame center."""
    object_center_x = (x1 + x2) / 2
    frame_center_x = frame_width / 2
    center_threshold = frame_width * config.CENTER_THRESHOLD

    if object_center_x < frame_center_x - center_threshold:
        return "to the left"
    elif object_center_x > frame_center_x + center_threshold:
        return "to the right"
    else:
        return "in front"

def calculate_distance(class_name: str, box_area: float, frame_area: float) -> str:
    """
    Estimate distance based on object TYPE and size.
    Uses specific thresholds for Cars vs Cups vs People.
    """
    area_ratio = box_area / frame_area

    # 1. Get the "Close Limit" for this specific class
    # If not found, default to 0.15
    close_limit = config.CLASS_THRESHOLDS.get(class_name, config.DEFAULT_THRESHOLD)

    # 2. Define "Medium" as 33% of the Close limit
    medium_limit = close_limit * 0.33 

    if area_ratio > close_limit:
        return "close"
    elif area_ratio > medium_limit:
        return "at medium distance"
    else:
        return "far away"

def process_image(image_file) -> Image.Image:
    """Process uploaded image with rotation and downscaling."""
    try:
        img = Image.open(io.BytesIO(image_file.read())).convert('RGB')

        # Rotate 90 degrees clockwise for portrait mode
        img = img.rotate(-90, expand=True)
        
        logger.info(f"📐 Image processed: {img.size}")
        return img

    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise

def run_detection(img: Image.Image) -> dict:
    """Run YOLO detection on image and return structured results."""
    global frame_count
    frame_count += 1

    img_width, img_height = img.size
    frame_area = img_width * img_height
    
    # --- START TIMER ---
    start_time = time.time()
    
    # Run YOLO inference
    results = model.predict(
        source=img, 
        save=False, 
        verbose=False, 
        conf=config.CONFIDENCE_THRESHOLD
    )
    
    # --- END TIMER (Fixes NameError) ---
    inference_time = (time.time() - start_time) * 1000

    result = results[0]

    detections = []
    alerts = []
    detected_items = []

    # Process detections
    if result.boxes is not None and len(result.boxes) > 0:
        boxes = result.boxes.xyxy.cpu().numpy()
        confidences = result.boxes.conf.cpu().numpy()
        class_ids = result.boxes.cls.cpu().numpy()

        # Filter by confidence once
        keep = confidences >= config.CONFIDENCE_THRESHOLD
        boxes = boxes[keep]
        confidences = confidences[keep]
        class_ids = class_ids[keep]

        # Limit to top detections by confidence
        if len(boxes) > config.MAX_DETECTIONS:
            top_indices = np.argsort(confidences)[-config.MAX_DETECTIONS:]
            boxes = boxes[top_indices]
            confidences = confidences[top_indices]
            class_ids = class_ids[top_indices]
        
        for box, conf, class_id in zip(boxes, confidences, class_ids):
            x1, y1, x2, y2 = map(int, box)
            class_name = model.names[int(class_id)]
            detected_items.append(class_name)

            is_priority = class_name in config.PRIORITY_OBJECTS

            # Calculate position
            position_str = calculate_position(x1, x2, img_width)

            # Calculate distance (Passed class_name for smart logic)
            box_area = (x2 - x1) * (y2 - y1)
            distance_str = calculate_distance(class_name, box_area, frame_area)

            # Generate alert for priority objects
            if is_priority and should_announce(class_name):
                alert_msg = f"Warning! {class_name} {distance_str} {position_str}"
                alerts.append(alert_msg)

            # Add to detections
            detections.append({
                "class": class_name,
                "confidence": float(conf),
                "position": position_str,
                "distance": distance_str,
                "isPriority": is_priority,
                "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
            })

    # Prepare response
    alert_message = alerts[0] if alerts else ""
    
    logger.info(f"✅ Frame {frame_count}: {len(detections)} objects detected")
    
    return {
        "alert": alert_message,
        "alerts": alerts,
        "objects": detected_items,
        "detections": detections,
        "frameWidth": img_width,
        "frameHeight": img_height,
        "frameCount": frame_count,
        "inferenceTime": round(inference_time, 2), 
        "timestamp": datetime.now().isoformat()
    }

# ==================== API ENDPOINTS ====================
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "frames_processed": frame_count
    })

@app.route('/detect', methods=['POST'])
def detect_object():
    """Main detection endpoint."""
    start_time = time.time()
    
    if not model:
        logger.error("Model not loaded")
        return jsonify({"error": "Model not loaded"}), 500

    if 'image' not in request.files:
        logger.warning("No image in request")
        return jsonify({"error": "No image sent"}), 400

    try:
        file = request.files['image']
        
        # Process image
        img = process_image(file)

        # Run detection
        result = run_detection(img)
        
        # Add processing time
        result['processingTime'] = round((time.time() - start_time) * 1000, 2)  # ms
        
        # Create response with keepalive headers
        response = jsonify(result)
        response.headers['Connection'] = 'keep-alive'
        response.headers['Keep-Alive'] = 'timeout=30, max=1000'
        
        return response

    except Exception as e:
        logger.error(f"❌ Detection error: {e}", exc_info=True)
        # Return empty result instead of error to keep connection alive
        return jsonify({
            "alert": "",
            "alerts": [],
            "objects": [],
            "detections": [],
            "frameWidth": 640,
            "frameHeight": 480,
            "frameCount": frame_count,
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }), 200 

@app.route('/reset', methods=['POST'])
def reset_cooldowns():
    """Reset announcement cooldowns."""
    global last_announcement_time
    last_announcement_time.clear()
    logger.info("🔄 Cooldowns reset")
    return jsonify({
        "message": "Cooldowns reset successfully",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get server statistics."""
    gpu_info = {}
    if torch.cuda.is_available():
        gpu_info = {
            "gpu_name": torch.cuda.get_device_name(0),
            "gpu_memory_allocated": f"{torch.cuda.memory_allocated(0) / 1024**2:.2f} MB",
            "gpu_memory_total": f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB"
        }
    
    return jsonify({
        "frames_processed": frame_count,
        "model": config.MODEL_FILE,
        "device": device,
        "confidence_threshold": config.CONFIDENCE_THRESHOLD,
        "priority_objects": sorted(list(config.PRIORITY_OBJECTS)),
        "cooldown_time": config.COOLDOWN_TIME,
        "gpu_info": gpu_info,
        "server_uptime": datetime.now().isoformat()
    })

@app.route('/config', methods=['GET'])
def get_config():
    """Get current configuration."""
    return jsonify({
        "model_file": config.MODEL_FILE,
        "confidence_threshold": config.CONFIDENCE_THRESHOLD,
        "cooldown_time": config.COOLDOWN_TIME,
        "distance_close": config.DISTANCE_CLOSE if hasattr(config, 'DISTANCE_CLOSE') else 'Dynamic',
        "distance_medium": config.DISTANCE_MEDIUM if hasattr(config, 'DISTANCE_MEDIUM') else 'Dynamic',
        "center_threshold": config.CENTER_THRESHOLD,
        "priority_objects_count": len(config.PRIORITY_OBJECTS)
    })

@app.route('/classes', methods=['GET'])
def get_classes():
    """Get all detectable classes."""
    if not model:
        return jsonify({"error": "Model not loaded"}), 500
    
    return jsonify({
        "classes": model.names,
        "total_classes": len(model.names),
        "priority_classes": sorted(list(config.PRIORITY_OBJECTS))
    })

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "available_endpoints": [
            "POST /detect",
            "GET /health",
            "GET /stats",
            "GET /config",
            "GET /classes",
            "POST /reset"
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "File too large"}), 413

# ==================== VOICE TRANSCRIPTION ENDPOINT ====================
@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio to text using Groq's Whisper API.
    Expects audio file in request.
    """
    print("\n" + "="*60)
    print("🎤 TRANSCRIPTION REQUEST RECEIVED")
    print("="*60)
    
    try:
        if 'audio' not in request.files:
            print("❌ ERROR: No audio file in request")
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        print(f"📁 Audio file received: {audio_file.filename}")
        
        if not audio_file:
            print("❌ ERROR: Empty audio file")
            return jsonify({'error': 'Empty audio file'}), 400
        
        # Check if Groq API key is configured
        if not groq_client.api_key:
            print("❌ ERROR: Groq API key not configured")
            return jsonify({'error': 'Groq API key not configured'}), 500
        
        print("✅ Groq API key found")
        
        # Read audio file
        audio_data = audio_file.read()
        file_size = len(audio_data)
        
        print(f"📊 Audio file size: {file_size} bytes ({file_size/1024:.2f} KB)")
        
        # Check audio file size (minimum 1KB to avoid empty/silent recordings)
        if file_size < 1000:
            print(f"⚠️  WARNING: Audio file too small: {file_size} bytes")
            return jsonify({
                'success': False,
                'text': '',
                'error': 'Audio file too small or silent'
            }), 400
        
        # Create a temporary file-like object
        audio_file_obj = io.BytesIO(audio_data)
        audio_file_obj.name = 'audio.m4a'
        
        print("� Sending to Groq Whisper API...")
        print(f"   Model: whisper-large-v3-turbo")
        print(f"   Language: en")
        print(f"   Temperature: 0.0")
        
        # Transcribe using Groq Whisper with optimized parameters
        transcription = groq_client.audio.transcriptions.create(
            file=(audio_file_obj.name, audio_data),  # Pass as tuple (filename, bytes)
            model="whisper-large-v3-turbo",
            language="en",  # Improves accuracy and latency
            response_format="verbose_json",
            temperature=0.0,  # Most deterministic output
            prompt="Voice commands for navigation: Netra for vision, Mudra for currency, Marga for navigation."  # Context helps accuracy
        )
        
        transcribed_text = transcription.text.strip()
        
        print("="*60)
        print(f"📝 RAW TRANSCRIPTION FROM GROQ:")
        print(f"   Text: '{transcribed_text}'")
        print(f"   Length: {len(transcribed_text)} characters")
        print(f"   Language: {getattr(transcription, 'language', 'N/A')}")
        print(f"   Duration: {getattr(transcription, 'duration', 'N/A')} seconds")
        
        # Debug verbose_json metadata
        if hasattr(transcription, 'segments') and transcription.segments:
            print(f"   Segments: {len(transcription.segments)}")
            for i, seg in enumerate(transcription.segments[:5]):  # Show first 5 segments
                avg_logprob = seg.get('avg_logprob', 'N/A')
                no_speech_prob = seg.get('no_speech_prob', 'N/A')
                compression_ratio = seg.get('compression_ratio', 'N/A')
                seg_text = seg.get('text', '')
                
                print(f"      Segment {i+1}:")
                print(f"         Text: '{seg_text}'")
                print(f"         Avg LogProb: {avg_logprob} (closer to 0 = better)")
                print(f"         No Speech Prob: {no_speech_prob} (lower = actual speech)")
                print(f"         Compression Ratio: {compression_ratio}")
                
                # Flag potential issues
                if isinstance(avg_logprob, (int, float)) and avg_logprob < -0.5:
                    print(f"         ⚠️  LOW CONFIDENCE!")
                if isinstance(no_speech_prob, (int, float)) and no_speech_prob > 0.5:
                    print(f"         ⚠️  MIGHT BE SILENCE/NOISE!")
        
        print("="*60)
        
        # Improved noise detection using metadata
        is_likely_noise = False
        
        # Check if text matches common noise patterns
        noise_words = ['thank you', 'thanks', 'you', 'bye', 'thank', 'you.']
        if transcribed_text.lower().strip() in noise_words:
            is_likely_noise = True
            print(f"🚫 DETECTED COMMON NOISE PHRASE: '{transcribed_text}'")
        
        # Check metadata for quality issues
        if hasattr(transcription, 'segments') and transcription.segments:
            avg_no_speech = sum(seg.get('no_speech_prob', 0) for seg in transcription.segments) / len(transcription.segments)
            avg_confidence = sum(seg.get('avg_logprob', 0) for seg in transcription.segments) / len(transcription.segments)
            
            print(f"📊 QUALITY METRICS:")
            print(f"   Average No Speech Prob: {avg_no_speech:.4f}")
            print(f"   Average Confidence: {avg_confidence:.4f}")
            
            if avg_no_speech > 0.5:
                is_likely_noise = True
                print(f"🚫 HIGH NO-SPEECH PROBABILITY: {avg_no_speech:.2f}")
            
            if avg_confidence < -1.0:
                print(f"⚠️  LOW CONFIDENCE: {avg_confidence:.2f}")
        
        if is_likely_noise:
            print("🚫 FILTERED AS NOISE")
            return jsonify({
                'success': False,
                'text': '',
                'error': 'No clear speech detected. Please speak louder and try again.'
            })
        
        print(f"✅ TRANSCRIPTION ACCEPTED: '{transcribed_text}'")
        print("="*60 + "\n")
        
        response_data = {
            'success': True,
            'text': transcribed_text
        }
        
        print(f"📤 SENDING RESPONSE TO CLIENT:")
        print(f"   {response_data}")
        print("="*60 + "\n")
        
        return jsonify(response_data)
        
    except Exception as e:
        print("="*60)
        print(f"❌ TRANSCRIPTION ERROR:")
        print(f"   {type(e).__name__}: {str(e)}")
        import traceback
        print(f"   Traceback:")
        traceback.print_exc()
        print("="*60 + "\n")
        
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== STARTUP ====================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 VISUAL ASSISTANCE DETECTION SERVER")
    print("="*50 + "\n")
    
    # Initialize model
    if not initialize_model():
        print("\n❌ Failed to initialize model. Exiting.")
        print("💡 Troubleshooting:")
        print("   1. Ensure 'ultralytics' is installed: pip install ultralytics")
        print("   2. Update to latest version: pip install --upgrade ultralytics")
        print("   3. Check internet connection (model will download on first run)")
        print("   4. Check PyTorch installation: pip install torch torchvision")
        exit(1)
    
    print("\n" + "="*50)
    print("📡 Server Configuration:")
    print(f"   • Host: 0.0.0.0")
    print(f"   • Port: 5000")
    print(f"   • Model: {config.MODEL_FILE}")
    print(f"   • Device: {'GPU' if torch.cuda.is_available() else 'CPU'}")
    print(f"   • Confidence: {config.CONFIDENCE_THRESHOLD}")
    print("="*50 + "\n")
    
    print("🎯 Available endpoints:")
    print("   • POST /detect     - Object detection")
    print("   • POST /transcribe - Voice to text transcription")
    print("   • GET  /health     - Health check")
    print("   • GET  /stats      - Statistics")
    print("   • POST /reset      - Reset cooldowns")
    print("\n" + "="*50 + "\n")
    
    # Run server
    app.run(
        host='0.0.0.0', 
        port=5000, 
        debug=False,
        threaded=True
    )