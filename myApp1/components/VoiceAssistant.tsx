import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { BACKEND_IP } from '../config/env';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/designSystem';

interface VoiceAssistantProps {
  onNavigate: (destination: string) => void;
  onClose: () => void;
}

export default function VoiceAssistant({ onNavigate, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Cleanup function
  const cleanup = async () => {
    try {
      // Clear timeout
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }

      // Stop recording if active
      if (recordingRef.current) {
        try {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording) {
            await recordingRef.current.stopAndUnloadAsync();
          }
        } catch {
          console.log('Recording already stopped');
        }
        recordingRef.current = null;
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Animate modal on mount and auto-start listening
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // Fade in and scale up animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();

      // Speak welcome message
      Speech.speak('What do you want to do today?', {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          // Auto-start recording after speech finishes
          if (mounted) {
            setTimeout(() => {
              if (mounted) {
                startRecording();
              }
            }, 500);
          }
        },
      });
    };

    initialize();

    return () => {
      mounted = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulse animation for listening state
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const startRecording = async () => {
    try {
      // Check permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Speech.speak('Microphone permission is required. Please enable it in settings.');
        return;
      }

      // Stop any ongoing speech first
      await Speech.stop();

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Wait for audio system to stabilize and ensure no speech is playing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create and start recording with better settings
      const { recording: newRecording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      recordingRef.current = newRecording;
      setIsListening(true);
      
      // Distinct vibration pattern to signal recording started
      // Short-long-short pattern
      Vibration.vibrate([0, 100, 50, 200, 50, 100]);
      
      // DO NOT speak during recording - only vibration feedback
      console.log('🎤 Recording started - listening for user speech');
      
      // Auto-stop after 7 seconds (gives user time to speak)
      autoStopTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 7000) as any;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Speech.speak('Failed to start recording. Please try again.');
      setIsListening(false);
    }
  };

  const stopRecording = async () => {
    // Clear auto-stop timeout
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    const currentRecording = recordingRef.current;
    if (!currentRecording) {
      console.log('No recording to stop');
      return;
    }

    try {
      setIsListening(false);
      setIsProcessing(true);

      // Check if recording is still active
      const status = await currentRecording.getStatusAsync();
      if (!status.isRecording) {
        console.log('Recording already stopped');
        setIsProcessing(false);
        return;
      }

      // Stop and get URI
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      
      // Clear refs
      recordingRef.current = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
      if (uri) {
        await transcribeAudio(uri);
      } else {
        Speech.speak('No audio recorded. Please try again.');
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Speech.speak('Failed to process recording.');
      recordingRef.current = null;
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    try {
      console.log('==========================================');
      console.log('🎤 STARTING TRANSCRIPTION');
      console.log('Audio URI:', audioUri);
      
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      console.log('📤 Sending audio to backend...');
      console.log('Backend URL:', `http://${BACKEND_IP}:5000/transcribe`);

      const response = await fetch(`http://${BACKEND_IP}:5000/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      
      console.log('📦 RESPONSE DATA FROM BACKEND:');
      console.log(JSON.stringify(data, null, 2));
      console.log('==========================================');
      
      if (data.success && data.text && data.text.length > 0) {
        console.log(`✅ Transcription successful: "${data.text}"`);
        setTranscribedText(data.text);
        processCommand(data.text);
      } else if (data.error) {
        // Specific error message from server
        console.log(`❌ Error from server: ${data.error}`);
        Speech.speak(data.error);
        setIsProcessing(false);
      } else {
        console.log('⚠️ No speech detected');
        Speech.speak('No speech detected. Please speak clearly and try again.');
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error('❌ TRANSCRIPTION ERROR:', error);
      Speech.speak('Sorry, there was an error connecting to the server. Please check your connection.');
      setIsProcessing(false);
    }
  };

  const processCommand = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Navigation commands
    if (lowerText.includes('netra') || lowerText.includes('vision') || lowerText.includes('detection') || lowerText.includes('eye')) {
      Speech.speak('Opening Netra vision mode', {
        onDone: () => {
          setTimeout(() => onNavigate('NETRA'), 300);
        }
      });
    } else if (lowerText.includes('mudra') || lowerText.includes('currency') || lowerText.includes('money') || lowerText.includes('finance') || lowerText.includes('rupee')) {
      Speech.speak('Opening Mudra currency assistant', {
        onDone: () => {
          setTimeout(() => onNavigate('MUDRA'), 300);
        }
      });
    } else if (lowerText.includes('marga') || lowerText.includes('navigation') || lowerText.includes('navigate') || lowerText.includes('route') || lowerText.includes('direction')) {
      Speech.speak('Opening Marga navigation mode', {
        onDone: () => {
          setTimeout(() => onNavigate('MARGA'), 300);
        }
      });
    } else {
      Speech.speak('I can help you navigate to Netra, Mudra, or Marga. Please say one of these.');
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (isListening) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  const handleClose = async () => {
    await cleanup();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={handleClose}
      />
      
      <Animated.View style={[styles.modalContainer, { 
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }]}>
        <LinearGradient
          colors={['rgba(28, 28, 30, 0.98)', 'rgba(10, 10, 10, 0.98)']}
          style={styles.modalContent}
        >
          {/* Close Button */}
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <View style={styles.closeIconContainer}>
              <FontAwesome5 name="times" size={20} color={COLORS.textPrimary} />
            </View>
          </TouchableOpacity>

          {/* Microphone Button */}
          <View style={styles.micContainer}>
            {isListening && (
              <>
                <Animated.View style={[styles.pulseRing, styles.pulseRing1, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.pulseRing, styles.pulseRing2, { opacity: pulseAnim }]} />
              </>
            )}
            <TouchableOpacity
              onPress={handleMicPress}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <LinearGradient
                  colors={isListening ? ['#FF3B30', '#FF6B6B'] : [COLORS.primary, '#C4FF0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.micButton}
                >
                  {isProcessing ? (
                    <ActivityIndicator size={32} color={COLORS.background} />
                  ) : (
                    <FontAwesome5
                      name={isListening ? 'stop' : 'microphone'}
                      size={32}
                      color={COLORS.background}
                    />
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>

          <Text style={styles.statusText}>
            {isProcessing
              ? 'Processing...'
              : isListening
              ? 'Listening'
              : 'Tap to speak'}
          </Text>

          {/* Transcribed Text or Suggestions */}
          {transcribedText ? (
            <View style={styles.textContainer}>
              <Text style={styles.transcribedText}>{transcribedText}</Text>
            </View>
          ) : (
            <View style={styles.suggestionsGrid}>
              <View style={styles.suggestionRow}>
                <TouchableOpacity style={styles.suggestionCard} activeOpacity={0.8}>
                  <View style={styles.suggestionIconBox}>
                    <FontAwesome5 name="eye" size={20} color={COLORS.textPrimary} />
                  </View>
                  <Text style={styles.suggestionCardText}>Open Netra</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.suggestionCard} activeOpacity={0.8}>
                  <View style={styles.suggestionIconBox}>
                    <FontAwesome5 name="rupee-sign" size={20} color={COLORS.textPrimary} />
                  </View>
                  <Text style={styles.suggestionCardText}>Open Mudra</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.suggestionCardFull} activeOpacity={0.8}>
                <View style={styles.suggestionIconBox}>
                  <FontAwesome5 name="route" size={20} color={COLORS.textPrimary} />
                </View>
                <Text style={styles.suggestionCardText}>Open Marga</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 340,
    maxHeight: '45%',
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  modalContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  closeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    position: 'relative',
    marginTop: SPACING.md,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pulseRing1: {
    width: 80,
    height: 80,
  },
  pulseRing2: {
    width: 110,
    height: 110,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  statusText: {
    fontSize: TYPOGRAPHY.small,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontBold,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  textContainer: {
    backgroundColor: 'rgba(28, 28, 30, 0.6)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  transcribedText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeightRelaxed * TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontRegular,
    textAlign: 'center',
  },
  suggestionsGrid: {
    gap: SPACING.sm,
  },
  suggestionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  suggestionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.3)',
    ...SHADOWS.small,
  },
  suggestionCardFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.3)',
    ...SHADOWS.small,
  },
  suggestionIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionCardText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontRegular,
    flex: 1,
  },
});
