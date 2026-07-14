<h1 align="center">👁️ DivyaDrishti</h1>

<p align="center">
  <em>AI-powered assistive navigation for the visually impaired — built entirely on edge.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv11-FF7F00?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-00FFFF?style=for-the-badge&logoColor=black" />
  <a href="https://drive.google.com/drive/folders/10guY9kA3PY8oUWHxymmFogaXssuQiRtX?usp=drive_link">
    <img src="https://img.shields.io/badge/Demo_%26_Docs-4285F4?style=for-the-badge&logo=google-drive&logoColor=white" />
  </a>
</p>

---

## 🎬 Live Demo & Project Assets

See DivyaDrishti in action — demo videos, model weights, and full documentation are available in the drive below.

> 👉 **[Open Project Drive →](https://drive.google.com/drive/folders/10guY9kA3PY8oUWHxymmFogaXssuQiRtX?usp=drive_link)**

---

## 🌍 The Problem

Over 285 million people worldwide live with visual impairment. Existing assistive tools are either too dependent on stable internet connectivity, too expensive, or too generic to handle the complexity of real-world navigation — currency handling, obstacle avoidance, and emergency response all at once.

**DivyaDrishti** is an end-to-end assistive ecosystem that runs entirely on-device, delivering real-time spatial awareness, financial independence, and emergency safety — without needing a single network request.

---

## 🏗️ Why Edge, Not Cloud

In assistive navigation, latency is safety. A 200ms round-trip to a cloud server evaluating a video frame could mean the difference between avoiding an obstacle and a dangerous collision.

DivyaDrishti shifts the entire compute payload to the user's device:

| Benefit | Impact |
|---|---|
| **Zero network dependency** | Fully operational in subways, rural areas, and dead zones |
| **Sub-50ms inference** | Eliminates round-trip latency for real-time hazard detection |
| **Data privacy** | Raw video and GPS telemetry never leave the device |

---

## ⚙️ Core Modules

### 🚨 Netra — Obstacle Detection
The primary spatial awareness engine for dynamic environments.

- **Model:** YOLOv11 Nano
- **Approach:** Priority-based filtering ranks immediate vs. distant hazards in real time — oncoming vehicles always take precedence over static obstacles
- **Output:** Low-latency auditory and haptic feedback based on detected trajectory

### 💸 Mudra — Currency Recognition
Financial independence through specialized vision.

- **Model:** Custom-trained YOLOv8 Nano
- **Trained for:** Indian currency across varied lighting conditions and partial occlusions
- **Coverage:** All active denominations — ₹10 through ₹2000

### 🧭 Marga — Location & Emergency Safety
Localization and distress response suite.

- **Navigation:** Reverse geocoding fused with a magnetometer-based compass for turn-by-turn auditory routing
- **Emergency:** Calibrated shake-to-alert engine monitors raw accelerometer data to detect falls or distress gestures, instantly dispatching GPS coordinates to emergency contacts

---

## ⚡ Technical Optimizations

Deploying vision models to limited-compute mobile hardware required aggressive optimization:

- **Post-Training Quantization (Float16)** reduced YOLO model payload to **~6MB** with no meaningful loss in mAP
- Sustained battery life and minimal thermal throttling during continuous inference
- Optimal memory footprint for uninterrupted background execution

---

## ♿ Accessibility by Design

Every interaction was designed ground-up for visually impaired and low-vision users:

- **Atkinson Hyperlegible** typography — designed by the Braille Institute to maximize character distinction
- **Two-step intent verification** across all critical UI flows to eliminate accidental inputs

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native |
| Computer Vision | OpenCV |
| Inference Models | YOLOv11 Nano, YOLOv8 Nano |
| Model Training | Python |
| Architecture | On-device Edge Inference |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/gaurangpatil97/divyadrishti

# Navigate into the project
cd divyadrishti

# Install Python dependencies
pip install -r requirements.txt

# Install mobile dependencies
npm install

# Run on Android
npx react-native run-android

# Run on iOS
npx react-native run-ios
```
