# Voice Assistant Setup Guide

## Overview
The voice assistant feature allows users to navigate the app using voice commands after triple-tapping anywhere on the home screen.

## Features Implemented
1. **Triple-tap Detection**: Tap 3 times quickly anywhere on the home screen to activate voice assistant
2. **Voice Recording**: Records audio using device microphone
3. **Speech-to-Text**: Converts audio to text using Groq's Whisper API
4. **Smart Navigation**: Automatically navigates to screens based on voice commands
5. **Visual Feedback**: Shows transcribed text and provides audio feedback

## Setup Instructions

### Backend Setup

1. **Install Groq Python Package**
   ```bash
   cd backend
   pip install groq==0.14.0
   ```
   Or install all dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. **Get Groq API Key**
   - Sign up at https://console.groq.com
   - Create an API key
   - Copy the API key

3. **Set Environment Variable**
   
   **Windows (Command Prompt):**
   ```cmd
   set GROQ_API_KEY=your_api_key_here
   ```
   
   **Windows (PowerShell):**
   ```powershell
   $env:GROQ_API_KEY="your_api_key_here"
   ```
   
   **Linux/Mac:**
   ```bash
   export GROQ_API_KEY=your_api_key_here
   ```
   
   Or create a `.env` file in the backend directory:
   ```
   GROQ_API_KEY=your_api_key_here
   ```

4. **Start Backend Server**
   ```bash
   python server.py
   ```
   The server will run on `http://0.0.0.0:5000`

### Frontend Setup

1. **Update Backend URL**
   Open `myApp1/components/VoiceAssistant.tsx` and update line 136:
   ```typescript
   const response = await fetch('http://YOUR_BACKEND_IP:5000/transcribe', {
   ```
   Replace `YOUR_BACKEND_IP` with:
   - Your computer's local IP (e.g., `192.168.1.100`) if testing on physical device
   - `localhost` or `127.0.0.1` if testing on emulator/simulator

2. **Install Dependencies** (if not already installed)
   ```bash
   cd myApp1
   npm install
   ```

3. **Start the App**
   ```bash
   npm start
   ```

## Usage

1. **Activate Voice Assistant**
   - Tap 3 times quickly anywhere on the home screen
   - The voice assistant drawer will slide up from the bottom
   - You'll hear "What do you want to do today?"

2. **Give Voice Command**
   - Tap the microphone button to start recording
   - Speak your command clearly
   - Tap again to stop recording
   - The text will be transcribed and displayed

3. **Voice Commands Supported**
   - "Go to Netra screen" / "Open Netra" / "Vision detection"
   - "Go to Mudra screen" / "Open Mudra" / "Currency assistant"
   - "Go to Marga screen" / "Open Marga" / "Navigation"

## Voice Command Keywords

The assistant recognizes these keywords:
- **Netra**: netra, vision, detection
- **Mudra**: mudra, currency, money, finance
- **Marga**: marga, navigation, navigate, route

## Troubleshooting

### Microphone Permission Error
- Go to device Settings → App Permissions → Microphone
- Enable microphone permission for your app

### Backend Connection Error
- Ensure backend server is running
- Check the IP address in VoiceAssistant.tsx
- Ensure phone/emulator can reach the backend (same network)

### Transcription Error
- Verify GROQ_API_KEY is set correctly
- Check internet connection (Groq API requires internet)
- View backend logs for detailed error messages

### Triple-tap Not Working
- Try tapping faster (within 500ms)
- Ensure you're tapping on the home screen (not inside a mode)

## API Endpoint

**POST** `/transcribe`
- **Content-Type**: `multipart/form-data`
- **Body**: Audio file with key `audio`
- **Response**:
  ```json
  {
    "success": true,
    "text": "go to netra screen"
  }
  ```

## Files Modified/Created

### Created:
- `myApp1/components/VoiceAssistant.tsx` - Voice assistant component

### Modified:
- `myApp1/app/(tabs)/index.tsx` - Added triple-tap detection and voice assistant integration
- `backend/server.py` - Added `/transcribe` endpoint
- `backend/requirements.txt` - Added `groq==0.14.0`

## Next Steps

You can enhance the feature by:
1. Adding more voice commands (e.g., "close app", "go back")
2. Supporting multiple languages
3. Adding offline transcription capability
4. Improving command recognition with AI intent detection
5. Adding voice feedback for all actions

## Support

If you encounter issues:
1. Check the backend console logs
2. Check the mobile app console (Metro bundler)
3. Verify all environment variables are set
4. Test the `/transcribe` endpoint directly with a tool like Postman
