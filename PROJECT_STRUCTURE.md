# DivyaDrishti - Project Structure Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Root Directory](#root-directory)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Technology Stack](#technology-stack)
- [Module Descriptions](#module-descriptions)

---

## 🎯 Overview

**DivyaDrishti** is an AI-powered assistive navigation system for visually impaired users, built with a client-server architecture. The project consists of two main components:

1. **Backend**: Python-based Flask server with Socket.IO for real-time communication, handling YOLO model inference
2. **Frontend**: React Native (Expo) cross-platform mobile application with advanced sensor integration

---

## 📁 Root Directory

```
Final_year - Copy/
├── backend/                      # Python Flask server & ML models
├── myApp1/                       # React Native mobile application
├── .git/                         # Git version control
├── package-lock.json             # Root package lock (if any)
├── VOICE_ASSISTANT_SETUP.md      # Voice assistant configuration guide
├── yolo11n.pt                    # YOLOv11 Nano model weights
└── PROJECT_STRUCTURE.md          # This file
```

---

## 🔧 Backend Architecture

### Directory Structure

```
backend/
├── server.py                     # Main Flask-SocketIO server
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables (API keys, config)
├── .gitignore                    # Git ignore patterns for backend
├── best.pt                       # Custom trained YOLO model (currency detection)
├── yolo11n.pt                    # YOLOv11 Nano model weights
├── yolov8n.pt                    # YOLOv8 Nano model weights
├── check_models.py               # Model validation script
├── test_currency.py              # Currency detection testing script
├── test_detect.py                # General object detection testing script
├── v4_with_alert.py              # Alert system implementation (legacy/test)
├── tenv/                         # Python virtual environment
│   ├── Scripts/                  # Virtual environment executables
│   ├── Lib/                      # Installed packages
│   └── pyvenv.cfg                # Virtual environment configuration
└── runs/                         # YOLO training/inference output
    └── detect/
        ├── predict/
        ├── predict2/
        ├── predict3/
        ├── predict4/
        ├── predict5/
        └── predict6/
```

### Key Backend Files

#### **server.py**
- **Purpose**: Main Flask application server with Socket.IO integration
- **Responsibilities**:
  - Real-time bidirectional communication with mobile app
  - Image frame processing via WebSockets
  - YOLO model inference orchestration
  - Detection result serialization and transmission
  - API endpoint management for voice commands and queries

#### **Model Files**
- **best.pt**: Custom-trained YOLOv8n model for Indian currency detection (₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹2000)
- **yolo11n.pt**: Pre-trained YOLOv11 Nano for general object detection (80 COCO classes)
- **yolov8n.pt**: Backup YOLOv8 Nano model

#### **Test Scripts**
- **check_models.py**: Validates model loading and basic inference
- **test_currency.py**: Unit tests for currency detection module
- **test_detect.py**: Integration tests for object detection pipeline

#### **Virtual Environment (tenv/)**
- Isolated Python environment with project-specific dependencies
- Activate: `tenv\Scripts\activate` (Windows) or `source tenv/bin/activate` (Linux/Mac)

### Backend Dependencies (requirements.txt)

| Category | Libraries | Purpose |
|----------|-----------|---------|
| **Web Framework** | Flask 3.1.2, flask-cors, Flask-SocketIO 5.5.1 | HTTP server & WebSocket communication |
| **ML/CV** | opencv-python 4.12.0, numpy 2.2.6, pillow 12.0.0 | Image processing & computer vision |
| **Deep Learning** | PyYAML (YOLO config), torch/ultralytics (implied) | YOLO model inference |
| **LLM Integration** | groq 0.37.1, httpx, httpcore | AI-powered voice assistant (Groq API) |
| **Real-time** | python-socketio 5.15.0, eventlet 0.40.4 | Async event handling |
| **Data Processing** | polars 1.35.2, pandas (implied) | Efficient data manipulation |
| **Utilities** | python-dotenv 1.2.1, requests 2.32.5 | Environment management & HTTP requests |
| **Visualization** | matplotlib 3.10.7 | Plotting & visualization (debugging) |

---

## 📱 Frontend Architecture

### Directory Structure

```
myApp1/
├── app/                          # Expo Router app directory
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── _layout.tsx           # Tab navigator layout
│   │   ├── index.tsx             # Home screen (feature selection)
│   │   └── profile.tsx           # User profile & settings
│   ├── _layout.tsx               # Root layout with font loading
│   └── modal.tsx                 # Modal screen
│
├── components/                   # Reusable React components
│   ├── Netra.tsx                 # Object detection camera view (YOLOv11)
│   ├── Mudra.tsx                 # Currency detection module (YOLOv8n)
│   ├── Marga.tsx                 # Navigation module
│   ├── Marga(merged).tsx         # Merged navigation variant
│   ├── IndoorMarga.tsx           # Indoor navigation
│   ├── OutdoorMarga.tsx          # Outdoor navigation (GPS-based)
│   ├── VoiceAssistant.tsx        # Voice command interface
│   ├── GlobalVoiceAssistantWrapper.tsx  # Global voice assistant state
│   ├── accelerometer.tsx         # Accelerometer sensor component
│   ├── gyroscope.tsx             # Gyroscope sensor component
│   ├── magnetometer.tsx          # Magnetometer sensor component
│   ├── themed-text.tsx           # Themed text component
│   ├── themed-view.tsx           # Themed view component
│   ├── parallax-scroll-view.tsx  # Animated scroll view
│   ├── haptic-tab.tsx            # Tab with haptic feedback
│   ├── hello-wave.tsx            # Animated wave component
│   ├── external-link.tsx         # External link component
│   ├── indoor-navigation/        # Indoor navigation sub-components
│   │   ├── LocationSelector.tsx  # Location selection UI
│   │   └── NavigationScreen.tsx  # Indoor navigation screen
│   ├── outdoor-navigation/       # Outdoor navigation sub-components
│   │   └── OutdoorNavigationScreen.tsx  # GPS navigation screen
│   └── ui/                       # UI primitives
│       ├── camera-view.tsx       # Custom camera view
│       ├── collapsible.tsx       # Collapsible container
│       ├── gyroscope.tsx         # Gyroscope UI component
│       ├── icon-symbol.tsx       # Icon abstraction
│       ├── icon-symbol.ios.tsx   # iOS-specific icon
│       └── mapping-tool.tsx      # Indoor mapping tool
│
├── config/                       # Configuration files (gitignored)
│   └── env.ts                    # Environment variables
│
├── constants/                    # App constants
│   ├── theme.ts                  # Color & font theme definitions
│   └── designSystem.ts           # Design system tokens
│
├── contexts/                     # React Context providers
│   └── NavigationContext.tsx     # Navigation state management
│
├── data/                         # Static data
│   └── sample-house-map.ts       # Sample indoor map data
│
├── hooks/                        # Custom React hooks
│   ├── use-color-scheme.ts       # Dark/light mode hook
│   ├── use-color-scheme.web.ts   # Web-specific color scheme
│   └── use-theme-color.ts        # Theme color hook
│
├── types/                        # TypeScript type definitions
│   └── indoor-navigation.ts      # Indoor navigation types
│
├── utils/                        # Utility functions
│   ├── navigation-session.ts     # Navigation session management
│   └── pathfinding.ts            # A* pathfinding algorithm
│
├── assets/                       # Static assets
│   └── images/                   # Image assets
│
├── scripts/                      # Build/utility scripts
│   └── reset-project.js          # Project reset script
│
├── .expo/                        # Expo build cache (gitignored)
├── .vscode/                      # VS Code workspace settings
├── node_modules/                 # NPM dependencies (gitignored)
│
├── app.json                      # Expo configuration
├── expo-env.d.ts                 # Expo environment types
├── package.json                  # NPM dependencies & scripts
├── package-lock.json             # NPM dependency lock
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.js              # ESLint configuration
├── .gitignore                    # Git ignore patterns
├── README.md                     # Frontend documentation
└── INDOOR_NAVIGATION_GUIDE.md    # Indoor navigation setup guide
```

### Core Modules Description

#### **1. Netra Module** (`components/Netra.tsx`)
**Purpose**: Real-time object detection using YOLOv11

**Features**:
- Live camera feed processing
- Detection of 80 COCO object classes (person, car, bicycle, etc.)
- Bounding box visualization
- Distance estimation
- Priority-based TTS alerts
- Socket.IO integration with backend

**Technical Flow**:
1. Capture frame from device camera (640×640 or 1280×720)
2. Send frame to backend via Socket.IO
3. Receive detection results (bounding boxes, classes, confidence)
4. Render overlays on camera feed
5. Trigger TTS for high-priority objects

---

#### **2. Mudra Module** (`components/Mudra.tsx`)
**Purpose**: Indian currency note recognition

**Features**:
- Close-range currency detection (15-40 cm)
- 7 denomination classes (₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹2000)
- Uses lightweight YOLOv8n for ultra-fast inference (<20ms)
- Audio feedback with denomination announcement
- Confidence score display

**Technical Flow**:
1. Capture VGA frame (640×480) for faster processing
2. Send to backend with "currency" detection mode flag
3. Receive denomination and confidence
4. Announce denomination via TTS
5. Visual confirmation with bounding box

---

#### **3. Marga Module** (`components/Marga.tsx`, `OutdoorMarga.tsx`, `IndoorMarga.tsx`)
**Purpose**: Turn-by-turn navigation for indoor and outdoor environments

**Outdoor Navigation Features**:
- GPS-based pathfinding
- Real-time location tracking
- Google Maps integration
- Voice-guided directions
- Distance/ETA calculation

**Indoor Navigation Features**:
- Pre-mapped indoor environments (hospitals, malls, campuses)
- Graph-based pathfinding (A* algorithm)
- Sensor fusion (accelerometer, gyroscope, magnetometer)
- Dead reckoning for GPS-denied areas
- Location selector UI

**Technical Flow**:
1. User selects destination
2. System calculates optimal path
3. Tracks user position via GPS/sensors
4. Provides turn-by-turn audio instructions
5. Recalculates route on deviation

---

#### **4. Voice Assistant** (`components/VoiceAssistant.tsx`)
**Purpose**: Multimodal voice interface powered by Groq LLM

**Features**:
- Speech-to-Text (STT) via device API
- Natural language understanding
- Context-aware responses
- LLM integration (Groq API - Llama 3 or Mixtral)
- Text-to-Speech (TTS) output
- Voice commands for app control ("start detection", "navigate to", "read currency")

**Supported Commands**:
- Object detection: "What's in front of me?", "Start Netra"
- Currency: "Read this note", "How much is this?"
- Navigation: "Navigate to Main Gate", "How far is the library?"
- General queries: "What's the weather?", "Tell me a joke"

**Technical Architecture**:
- Expo Speech Recognition API
- Groq Cloud API for LLM inference
- Context injection with app state
- Audio playback via Expo AV

---

### Frontend Dependencies (package.json)

| Category | Libraries | Purpose |
|----------|-----------|---------|
| **Framework** | React 19.1.0, React Native 0.81.5, Expo ~54.0.25 | Cross-platform mobile framework |
| **Navigation** | expo-router ~6.0.15, @react-navigation/* | File-based routing & navigation |
| **UI Components** | @expo/vector-icons, expo-symbols | Icons and UI elements |
| **Camera/Media** | expo-camera, expo-av, expo-image | Camera access & media handling |
| **Sensors** | expo-sensors, expo-location, react-native-maps | GPS, accelerometer, gyroscope, magnetometer |
| **Accessibility** | expo-speech, expo-haptics | Text-to-Speech & haptic feedback |
| **Networking** | socket.io-client 4.8.1 | WebSocket communication with backend |
| **Fonts** | @expo-google-fonts/atkinson-hyperlegible, expo-font | Accessible typography |
| **Gestures** | react-native-gesture-handler, react-native-reanimated | Touch gestures & animations |
| **Utilities** | expo-linking, expo-web-browser, expo-constants | Deep linking, browser, constants |

---

## 🛠️ Technology Stack

### Backend
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Language** | Python | 3.10+ | Backend logic |
| **Web Framework** | Flask | 3.1.2 | HTTP server |
| **Real-time** | Socket.IO | 5.15.0 | WebSocket communication |
| **ML Framework** | Ultralytics YOLO | 8.x/11.x | Object detection |
| **CV Library** | OpenCV | 4.12.0 | Image processing |
| **LLM API** | Groq | 0.37.1 | Voice assistant intelligence |
| **Server** | Eventlet | 0.40.4 | Async WSGI server |

### Frontend
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Language** | TypeScript | 5.9.2 | Type-safe JavaScript |
| **Framework** | React Native | 0.81.5 | Mobile UI framework |
| **Runtime** | Expo | 54.0.25 | Development & build tooling |
| **Routing** | Expo Router | 6.0.15 | File-based navigation |
| **State** | React Context | 19.1.0 | Global state management |
| **Networking** | Socket.IO Client | 4.8.1 | Backend communication |
| **Maps** | React Native Maps | 1.20.1 | GPS navigation |

### AI/ML Models
| Model | Version | Use Case | Size | Inference Time |
|-------|---------|----------|------|----------------|
| YOLOv11n | 11.x | General object detection | 25.3 MB | 40-50ms |
| YOLOv8n | 8.x | Currency detection | 6.2 MB | 15-20ms |

---

## 🔄 Communication Architecture

```
┌─────────────────┐                        ┌─────────────────┐
│  Mobile App     │                        │  Flask Server   │
│  (React Native) │                        │  (Python)       │
│                 │                        │                 │
│  Camera ──────► │──── Socket.IO ────────►│  YOLO Engine    │
│                 │      (WebSocket)       │                 │
│  ◄────────────  │ ◄─── Results ─────────│  ◄─────────     │
│  TTS Engine     │                        │  Inference      │
│                 │                        │                 │
│  Voice ────────►│──── HTTP/REST ────────►│  Groq LLM API   │
│  Assistant      │                        │                 │
└─────────────────┘                        └─────────────────┘
```

---

## 📊 Data Flow

### Object Detection Flow
1. **Mobile App**: Capture camera frame (640×640 px)
2. **Mobile App**: Convert to base64 and emit via Socket.IO
3. **Backend**: Receive frame, decode, preprocess
4. **Backend**: Run YOLO inference (YOLOv11 or YOLOv8n)
5. **Backend**: Apply NMS, filter by confidence
6. **Backend**: Emit detection results (JSON)
7. **Mobile App**: Parse results, render bounding boxes
8. **Mobile App**: Priority filtering, TTS announcement

### Voice Assistant Flow
1. **User**: Speaks command
2. **Mobile App**: STT conversion to text
3. **Mobile App**: Send text to Groq API (HTTP)
4. **Groq LLM**: Process with context, generate response
5. **Mobile App**: Receive response text
6. **Mobile App**: TTS conversion to speech
7. **Mobile App**: Play audio output

---

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
python -m venv tenv
tenv\Scripts\activate  # Windows
pip install -r requirements.txt
python server.py
```

### Frontend Setup
```bash
cd myApp1
npm install
npx expo start
```

---

## 📝 Configuration Files

### Backend (.env)
```env
GROQ_API_KEY=your_groq_api_key_here
FLASK_ENV=development
PORT=5000
```

### Frontend (config/env.ts)
```typescript
export const ENV = {
  BACKEND_URL: 'http://192.168.x.x:5000',
  SOCKET_URL: 'http://192.168.x.x:5000',
  GROQ_API_KEY: 'your_groq_api_key_here',
};
```

---

## 🔐 Security Considerations

- **API Keys**: Stored in `.env` (gitignored)
- **WebSocket**: No authentication (add JWT for production)
- **Camera Permissions**: Requested at runtime
- **Location Permissions**: Required for GPS navigation
- **Sensor Access**: Microphone for voice, accelerometer/gyroscope for navigation

---

## 📈 Performance Metrics

| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| Object Detection Latency | <50ms | 40-50ms | YOLOv11 on mobile GPU |
| Currency Detection Latency | <25ms | 15-20ms | YOLOv8n optimized |
| End-to-End Pipeline | <500ms | 345ms | Including TTS |
| Frame Rate | 30 FPS | 25-30 FPS | Adaptive based on device |
| App Size | <100 MB | ~85 MB | With all dependencies |

---

## 🐛 Debugging & Testing

### Backend Tests
```bash
python test_detect.py          # Test general detection
python test_currency.py        # Test currency detection
python check_models.py         # Validate model loading
```

### Frontend Testing
- Expo DevTools: Shake device → "Debug Remote JS"
- React DevTools: Chrome debugger
- Network: Monitor Socket.IO events in browser console

---

## 📚 Documentation References

- [VOICE_ASSISTANT_SETUP.md](./VOICE_ASSISTANT_SETUP.md) - Voice assistant configuration
- [INDOOR_NAVIGATION_GUIDE.md](./myApp1/INDOOR_NAVIGATION_GUIDE.md) - Indoor nav setup
- [README.md](./myApp1/README.md) - Frontend documentation

---

## 👥 Development Team

**Project**: DivyaDrishti - AI Navigation Assistant for Visually Impaired
**Institution**: Final Year Computer Engineering Project
**Year**: 2024-2025

---

## 📄 License

This project is developed for academic purposes as part of a Final Year Engineering thesis.

---

**Last Updated**: December 12, 2025
**Version**: 1.0.0
