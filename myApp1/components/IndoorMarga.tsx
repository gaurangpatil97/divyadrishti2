import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Vibration, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';
import LocationSelector from './indoor-navigation/LocationSelector';
import NavigationScreen from './indoor-navigation/NavigationScreen';
import { NavigationSession } from '../utils/navigation-session';
import { SAMPLE_HOUSE_MAP } from '../data/sample-house-map';
import { MargaUpdate } from '../types/indoor-navigation';
import { BACKEND_IP } from '../config/env';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/designSystem';

// Import your existing Marga module that provides step count, heading, distance
import MargaMerged from './Marga(merged)';

interface Props {
  onBack: () => void;
}

type AppMode = 'voice-input' | 'navigating';

export default function IndoorMarga({ onBack }: Props) {
  const [mode, setMode] = useState<AppMode>('voice-input');
  const [navigationSession, setNavigationSession] = useState<NavigationSession | null>(null);
  const [margaUpdate, setMargaUpdate] = useState<MargaUpdate>({
    stepCount: 0,
    heading: 0,
    distance: 0,
    gyroZ: 0, // Add gyroscope for turn detection
  });
  
  // Voice input states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [parsedRoute, setParsedRoute] = useState<{ start: string; end: string } | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPromptedRef = useRef(false);

  // Auto-start voice prompt when component mounts
  useEffect(() => {
    const initVoiceInput = async () => {
      await Audio.requestPermissionsAsync();
      
      if (!hasPromptedRef.current) {
        hasPromptedRef.current = true;
        setTimeout(() => {
          Speech.speak('Where do you want to go?', {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
            onDone: () => {
              // Wait a bit after speech ends, then start recording
              setTimeout(() => {
                startRecording();
              }, 1000);
            },
          });
        }, 500);
      }
    };
    
    initVoiceInput();
    
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      stopRecording();
    };
  }, []);

  // Subscribe to Marga module updates - use real sensors
  useEffect(() => {
    let headingSub: Location.LocationSubscription | null = null;
    let accelSub: any = null;
    let gyroSub: any = null;
    
    const lastPeakTime = { current: 0 };
    const consecutiveSteps = { current: 0 };
    const currentHeadingRef = { current: 0 };
    const currentGyroZ = { current: 0 };
    let localStepCount = 0;

    // Setup compass
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      headingSub = await Location.watchHeadingAsync((obj) => {
        const angle = Math.round(obj.magHeading);
        currentHeadingRef.current = angle;
        setMargaUpdate(prev => ({
          ...prev,
          heading: angle,
        }));
      });
    })();

    // Setup gyroscope for turn detection
    Gyroscope.setUpdateInterval(50);
    gyroSub = Gyroscope.addListener(({ z }) => {
      currentGyroZ.current = z;
      setMargaUpdate(prev => ({
        ...prev,
        gyroZ: z,
      }));
    });

    // Setup pedometer
    Accelerometer.setUpdateInterval(50);
    accelSub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x*x + y*y + z*z);
      const now = Date.now();

      // Threshold: 1.25G (Handheld Mode)
      if (magnitude > 1.25) {
        const timeSinceLast = now - lastPeakTime.current;
        
        // Filter: Speed Limit (350ms)
        if (timeSinceLast > 350) {
          // Filter: Consistency Check (1.5s)
          if (timeSinceLast < 1500) {
            consecutiveSteps.current += 1;
            if (consecutiveSteps.current >= 2) {
              localStepCount++;
              Vibration.vibrate(15);
              setMargaUpdate(prev => ({
                stepCount: localStepCount,
                heading: currentHeadingRef.current,
                distance: localStepCount * 0.75,
                gyroZ: currentGyroZ.current,
              }));
            }
          } else {
            consecutiveSteps.current = 1;
          }
          lastPeakTime.current = now;
        }
      }
    });

    return () => {
      if (headingSub) headingSub.remove();
      if (accelSub) accelSub.remove();
      if (gyroSub) gyroSub.remove();
    };
  }, []);

  const startRecording = async () => {
    try {
      // Stop any ongoing speech before recording
      await Speech.stop();
      
      // Small delay to ensure speech is fully stopped
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      Vibration.vibrate(50);

      // Auto-stop after 10 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 10000);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    
    try {
      setIsRecording(false);
      Vibration.vibrate(50);
      
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const transcribeAudio = async (uri: string) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);

      const response = await fetch(`http://${BACKEND_IP}:5000/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (data.text && data.text.trim()) {
        const text = data.text.trim();
        setTranscribedText(text);
        
        // Parse the route from text
        const route = parseRouteFromText(text);
        if (route) {
          setParsedRoute(route);
          
          // Start navigation immediately
          const startNode = SAMPLE_HOUSE_MAP.nodes.find(n => n.id === route.start);
          const endNode = SAMPLE_HOUSE_MAP.nodes.find(n => n.id === route.end);
          
          Speech.speak(
            `Navigating from ${startNode?.displayName} to ${endNode?.displayName}`,
            { rate: 0.9 }
          );
          
          handleStartNavigation(route.start, route.end);
        } else {
          Speech.speak('Sorry, I could not understand. Where do you want to go?', {
            onDone: () => {
              setTimeout(() => {
                startRecording();
              }, 800);
            }
          });
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      Speech.speak('There was an error. Please try again.');
      setTimeout(() => {
        startRecording();
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseRouteFromText = (text: string): { start: string; end: string } | null => {
    const lowerText = text.toLowerCase();
    
    // Extract location names from the map
    const locations = SAMPLE_HOUSE_MAP.nodes.map(node => ({
      id: node.id,
      name: node.name.toLowerCase(),
      displayName: node.displayName.toLowerCase(),
      // Add alternative names for better matching
      keywords: [
        node.name.toLowerCase(),
        node.displayName.toLowerCase(),
        node.id.toLowerCase().replace('_', ' '),
      ],
    }));
    
    console.log('Parsing text:', lowerText);
    
    // Helper function to find location by keywords
    const findLocation = (searchText: string) => {
      return locations.find(loc => 
        loc.keywords.some(keyword => {
          // Check if keyword is in the search text
          const words = searchText.split(/\s+/);
          return words.some(word => 
            keyword.includes(word) || word.includes(keyword)
          );
        })
      );
    };
    
    // Try to find "from X to Y" pattern
    const fromToMatch = lowerText.match(/from\s+(.+?)\s+to\s+(.+?)(?:\.|$)/i);
    if (fromToMatch) {
      const startText = fromToMatch[1].trim();
      const endText = fromToMatch[2].trim();
      
      console.log('From-To match - Start:', startText, 'End:', endText);
      
      const startLocation = findLocation(startText);
      const endLocation = findLocation(endText);
      
      if (startLocation && endLocation) {
        console.log('Found route:', startLocation.id, 'to', endLocation.id);
        return { start: startLocation.id, end: endLocation.id };
      }
    }
    
    // Try alternative patterns like "go to X from Y"
    const toFromMatch = lowerText.match(/to\s+(.+?)\s+from\s+(.+?)(?:\.|$)/i);
    if (toFromMatch) {
      const endText = toFromMatch[1].trim();
      const startText = toFromMatch[2].trim();
      
      console.log('To-From match - Start:', startText, 'End:', endText);
      
      const startLocation = findLocation(startText);
      const endLocation = findLocation(endText);
      
      if (startLocation && endLocation) {
        console.log('Found route:', startLocation.id, 'to', endLocation.id);
        return { start: startLocation.id, end: endLocation.id };
      }
    }
    
    // Try simple "X to Y" pattern
    const simpleMatch = lowerText.match(/(?:^|\s)(.+?)\s+to\s+(.+?)(?:\.|$)/i);
    if (simpleMatch) {
      const startText = simpleMatch[1].trim();
      const endText = simpleMatch[2].trim();
      
      console.log('Simple match - Start:', startText, 'End:', endText);
      
      const startLocation = findLocation(startText);
      const endLocation = findLocation(endText);
      
      if (startLocation && endLocation) {
        console.log('Found route:', startLocation.id, 'to', endLocation.id);
        return { start: startLocation.id, end: endLocation.id };
      }
    }
    
    console.log('No route found in text');
    return null;
  };

  const handleStartNavigation = (startId: string, endId: string) => {
    try {
      const session = new NavigationSession(SAMPLE_HOUSE_MAP, startId, endId);
      setNavigationSession(session);
      setMode('navigating');
      
      Speech.speak('Navigation started');
      
      // Reset marga counters
      setMargaUpdate({
        stepCount: 0,
        heading: margaUpdate.heading,
        distance: 0,
      });
    } catch (error) {
      console.error('Failed to create navigation session:', error);
      Speech.speak('Sorry, navigation could not be started. Please try again.');
    }
  };

  const handleCancelNavigation = () => {
    setNavigationSession(null);
    setMode('voice-input');
    setParsedRoute(null);
    setTranscribedText('');
    hasPromptedRef.current = false;
  };

  // Voice Input Screen
  if (mode === 'voice-input') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <FontAwesome5 name="chevron-left" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.appName}>INDOOR NAVIGATION</Text>
              <View style={styles.placeholder} />
            </View>
          </View>

          <View style={styles.content}>
            {/* Microphone Animation */}
            <View style={styles.micContainer}>
              <LinearGradient
                colors={isRecording ? ['#FF0000', '#CC0000'] : [COLORS.primary, '#C4FF0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.micCircle, isRecording && styles.micCircleActive]}
              >
                <FontAwesome5 
                  name="microphone" 
                  size={60} 
                  color={COLORS.background} 
                />
              </LinearGradient>
              {isRecording && (
                <View style={styles.pulseContainer}>
                  <View style={[styles.pulse, styles.pulse1]} />
                  <View style={[styles.pulse, styles.pulse2]} />
                  <View style={[styles.pulse, styles.pulse3]} />
                </View>
              )}
            </View>

            {/* Status Text */}
            <Text style={styles.statusText}>
              {isRecording ? 'LISTENING...' : 
               isProcessing ? 'PROCESSING...' : 'READY'}
            </Text>

            {/* Transcribed Text */}
            {transcribedText && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>YOU SAID:</Text>
                <Text style={styles.transcriptText}>{transcribedText}</Text>
              </View>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
            )}

            {/* Instructions */}
            {!isRecording && !isProcessing && (
              <View style={styles.instructionsBox}>
                <View style={styles.instructionHeader}>
                  <FontAwesome5 name="info-circle" size={20} color={COLORS.primary} />
                  <Text style={styles.instructionsTitle}>How to use</Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.instructionsText}>
                    Say: From [start] to [destination]
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.instructionsText}>
                    Example: From bedroom to kitchen
                  </Text>
                </View>
              </View>
            )}

            {/* Manual Record Button (backup) */}
            {!isRecording && !isProcessing && (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#C4FF0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recordButtonGradient}
                >
                  <FontAwesome5 name="microphone" size={24} color={COLORS.background} />
                  <Text style={styles.recordButtonText}>TAP TO SPEAK</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (mode === 'navigating' && navigationSession) {
    return (
      <NavigationScreen
        navigationSession={navigationSession}
        onCancel={handleCancelNavigation}
        margaUpdate={margaUpdate}
      />
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl * 2,
    flexGrow: 1,
  },
  header: {
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  appName: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.h3,
    fontFamily: TYPOGRAPHY.fontBold,
    letterSpacing: 1,
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  micContainer: {
    position: 'relative',
    marginBottom: SPACING.xxxl,
  },
  micCircle: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  micCircleActive: {
    // Animation handled by gradient colors
  },
  pulseContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: '#FF0000',
    opacity: 0.6,
  },
  pulse1: {
    transform: [{ scale: 1.2 }],
  },
  pulse2: {
    transform: [{ scale: 1.4 }],
    opacity: 0.4,
  },
  pulse3: {
    transform: [{ scale: 1.6 }],
    opacity: 0.2,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.h3,
    fontFamily: TYPOGRAPHY.fontBold,
    letterSpacing: 2,
    marginBottom: SPACING.xl,
  },
  transcriptBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  transcriptLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.caption,
    fontFamily: TYPOGRAPHY.fontBold,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  transcriptText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.body,
    fontFamily: TYPOGRAPHY.fontRegular,
    lineHeight: 26,
  },
  instructionsBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    marginTop: SPACING.lg,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  instructionsTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
  },
  instructionsText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontRegular,
    lineHeight: 20,
    flex: 1,
  },
  recordButton: {
    marginTop: SPACING.xl,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  recordButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  recordButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontBold,
  },
});
