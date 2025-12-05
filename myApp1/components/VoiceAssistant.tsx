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
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

interface VoiceAssistantProps {
  onNavigate: (destination: string) => void;
  onClose: () => void;
}

export default function VoiceAssistant({ onNavigate, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
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

  // Animate slide up on mount and auto-start listening
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

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
      console.log('Backend URL: http://192.168.29.172:5000/transcribe');

      // Replace with your actual backend URL
      const response = await fetch('http://192.168.29.172:5000/transcribe', {
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
    if (lowerText.includes('home') || lowerText.includes('main') || lowerText.includes('back to home')) {
      Speech.speak('Going to home screen', {
        onDone: () => {
          setTimeout(() => onNavigate('HOME'), 300);
        }
      });
    } else if (lowerText.includes('netra') || lowerText.includes('vision') || lowerText.includes('detection') || lowerText.includes('eye')) {
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
      Speech.speak('I can help you navigate to Home, Netra, Mudra, or Marga. Please say one of these.');
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
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Voice Assistant</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <FontAwesome5 name="times" size={20} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Microphone Button */}
        <View style={styles.micContainer}>
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Animated.View style={[
              styles.micButton,
              isListening && styles.micButtonActive,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              {isProcessing ? (
                <ActivityIndicator size="large" color="#000" />
              ) : (
                <FontAwesome5
                  name={isListening ? 'stop' : 'microphone'}
                  size={40}
                  color={isListening ? '#FF0000' : '#000'}
                />
              )}
            </Animated.View>
          </TouchableOpacity>
          
          <Text style={styles.statusText}>
            {isProcessing
              ? 'Processing your request...'
              : isListening
              ? '🔴 Recording... Speak now!'
              : 'Ready to listen'}
          </Text>
        </View>

        {/* Transcribed Text */}
        {transcribedText ? (
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>You said:</Text>
            <Text style={styles.transcribedText}>{transcribedText}</Text>
          </View>
        ) : (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Voice commands you can use:</Text>
            <Text style={styles.suggestionText}>Go to home or Main screen</Text>
            <Text style={styles.suggestionText}>Go to Netra or Open vision</Text>
            <Text style={styles.suggestionText}>Go to Mudra or Open currency</Text>
            <Text style={styles.suggestionText}>Go to Marga or Open navigation</Text>
            <Text style={styles.instructionText}>
              💡 Speak clearly after the vibration
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  closeButton: {
    padding: 8,
  },
  micContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micButtonActive: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  statusText: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: '600',
    textAlign: 'center',
  },
  textContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  textLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '600',
  },
  transcribedText: {
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  suggestionsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginVertical: 4,
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
