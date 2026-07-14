import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Modern Expo Camera
import * as Speech from 'expo-speech';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/designSystem';
import { BACKEND_IP } from '../config/env';

// --- CONFIGURATION ---
// ⚠️ IMPORTANT: Replace 'X' with your laptop's actual IP address (e.g., 192.168.1.5)
const API_URL = `http://${BACKEND_IP}:5000/count`; 

interface Props {
  onBack: () => void;
}

export default function Mudra({ onBack }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("Ready to scan...");

  // Request permissions on mount
  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const handleScan = async () => {
    if (!cameraRef.current) return;
    
    try {
      setLoading(true);
      Speech.stop(); // Stop any previous speech
      setResultText("Analyzing...");

      // 1. Take Picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Lower quality for faster upload
        base64: false,
      });

      if (!photo?.uri) throw new Error("Failed to capture image");

      // 2. Prepare Form Data
      const formData = new FormData();
      // @ts-ignore: React Native specific FormData
      formData.append('image', {
        uri: photo.uri,
        name: 'currency.jpg',
        type: 'image/jpeg',
      });

      // 3. Send to Server
      console.log(`Sending image to ${API_URL}...`);
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        // DO NOT set Content-Type manually - fetch will auto-set with boundary
      });

      const data = await response.json();

      if (data.success) {
        setResultText(`₹${data.total_value}`);
        Speech.speak(data.speech); // Speak the result
      } else {
        setResultText("Error detecting");
        Speech.speak("Sorry, I couldn't identify the notes.");
      }

    } catch (error) {
      console.error("Scan Error:", error);
      setResultText("Connection Error");
      Speech.speak("Could not connect to the server. Check your internet or IP address.");
    } finally {
      setLoading(false);
    }
  };

  // Permission handling
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{textAlign: 'center', marginTop: 50, color: COLORS.textPrimary}}>
          We need camera permission to detect currency.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={{alignSelf: 'center', marginTop: 20}}>
          <Text style={{color: COLORS.primary, fontSize: 18}}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* 1. HEADER ROW */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MUDRA MODE</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>Currency Assistant Active</Text>
        
        {/* CAMERA SECTION */}
        <View style={styles.cameraBox}>
          <CameraView 
            style={styles.camera} 
            ref={cameraRef} 
            facing="back"
            animateShutter={false}
          />
          
          {/* Overlay for Scanning State */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
        </View>

        {/* CONTROLS & RESULT */}
        <View style={styles.controlsSection}>
          <Text style={styles.resultText}>{resultText}</Text>
          
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleScan}
            disabled={loading}
          >
            <FontAwesome5 name="camera" size={24} color="#FFF" style={{marginRight: 10}} />
            <Text style={styles.scanButtonText}>
              {loading ? "Scanning..." : "Scan Currency"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            <FontAwesome5 name="info-circle" size={14} /> Tip: Hold the camera steady above the notes.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xxxl, 
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.h2,
    fontFamily: TYPOGRAPHY.fontBold,
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  subtitle: { 
    fontSize: TYPOGRAPHY.lg, 
    fontFamily: TYPOGRAPHY.fontMedium,
    color: COLORS.textPrimary, 
    marginBottom: SPACING.lg,
  },
  cameraBox: {
    width: '100%', 
    height: 400, // Taller for better view
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    backgroundColor: '#000',
    ...SHADOWS.medium,
  },
  camera: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  controlsSection: {
    width: '100%',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontBold,
    color: COLORS.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...SHADOWS.medium,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.h4,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  infoSection: {
    marginTop: SPACING.xl,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14, // <--- FIXED: Hardcoded to 14 to avoid crash if .sm is missing
  },
});