import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Vibration } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { BACKEND_IP } from '../config/env';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/designSystem';
import OutdoorNavigationScreen from './outdoor-navigation/OutdoorNavigationScreen';

interface Props {
  onBack: () => void;
}

type AppMode = 'voice-input' | 'navigating';

interface RouteData {
  coordinates: { latitude: number; longitude: number }[];
  steps: {
    instruction: string;
    distance: number;
    stepCount: number;
    maneuver: {
      type: string;
      modifier?: string;
    };
    location: { latitude: number; longitude: number };
  }[];
  totalDistance: number;
  totalDuration: number;
}

export default function OutdoorMarga({ onBack }: Props): React.JSX.Element {
  const [mode, setMode] = useState<AppMode>('voice-input');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [startLocation, setStartLocation] = useState<any>(null);
  const [endLocation, setEndLocation] = useState<any>(null);
  
  // Voice input states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPromptedRef = useRef(false);

  // Auto-start voice prompt for starting location
  useEffect(() => {
    const initVoiceInput = async () => {
      await Audio.requestPermissionsAsync();
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (!hasPromptedRef.current) {
        hasPromptedRef.current = true;
        
        if (status === 'granted') {
          setIsGettingLocation(true);
          Speech.speak('Getting your current location...', { rate: 0.9 });
          
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            setStartLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              name: 'Current Location',
            });
            
            setIsGettingLocation(false);
            
            setTimeout(() => {
              Speech.speak('Current location detected. Where do you want to go?', {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
                onDone: () => {
                  setTimeout(() => {
                    startRecording();
                  }, 1000);
                },
              });
            }, 500);
          } catch (error) {
            console.error('Error getting location:', error);
            setIsGettingLocation(false);
            Speech.speak('Could not get your location. Please say your starting location.', {
              onDone: () => {
                setTimeout(() => {
                  startRecording();
                }, 1000);
              }
            });
          }
        } else {
          setTimeout(() => {
            Speech.speak('Where are you starting from?', {
              language: 'en',
              pitch: 1.0,
              rate: 0.9,
              onDone: () => {
                setTimeout(() => {
                  startRecording();
                }, 1000);
              },
            });
          }, 500);
        }
      }
    };
    
    initVoiceInput();
    
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      await Speech.stop();
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
        
        // Search for location suggestions using Photon API
        await searchLocation(text);
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

  const searchLocation = async (query: string) => {
    try {
      setIsProcessing(true);
      
      // Use Nominatim (OpenStreetMap) Autocomplete
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'DivyaDrishti/1.0',
          },
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const results = data.map((item: any) => ({
          name: item.display_name.split(',')[0],
          address: item.display_name,
          placeId: item.place_id,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
        
        setSearchResults(results);
        setShowSearchResults(true);
        
        Speech.speak(`Found ${results.length} locations. Please select one from the screen.`, {
          rate: 0.9,
        });
      } else {
        Speech.speak('No locations found. Please try again.', {
          onDone: () => {
            setTimeout(() => {
              startRecording();
            }, 800);
          }
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      Speech.speak('There was an error searching. Please try again.', {
        onDone: () => {
          setTimeout(() => {
            startRecording();
          }, 1000);
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectLocation = async (location: any) => {
    setShowSearchResults(false);
    
    if (!startLocation) {
      // This is the starting location
      setStartLocation(location);
      setTranscribedText('');
      setSearchResults([]);
      
      Speech.speak(`Starting from ${location.name}. Where do you want to go?`, {
        rate: 0.9,
        onDone: () => {
          setTimeout(() => {
            startRecording();
          }, 1000);
        }
      });
    } else {
      // This is the destination
      setEndLocation(location);
      setTranscribedText('');
      setSearchResults([]);
      
      Speech.speak(`Destination set to ${location.name}. Calculating route...`, { rate: 0.9 });
      
      // Get route from OSM
      await getRoute(startLocation, location);
    }
  };

  const getRoute = async (start: any, end: any) => {
    try {
      console.log('🗺️ Requesting route from MapBox...');
      console.log(`Start: ${start.latitude}, ${start.longitude}`);
      console.log(`End: ${end.latitude}, ${end.longitude}`);
      
      // MapBox API key - free tier: 100,000 requests/month
      const MAPBOX_TOKEN = 'pk.eyJ1IjoidGFudmlwYXRpbDIyIiwiYSI6ImNtajF5eGljbzBudWkzZXNmdnlhOGt2NzAifQ.H-ZymAcnGHM1d4DetPK5Wg';
      
      // Use MapBox Directions API
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=polyline&steps=true&access_token=${MAPBOX_TOKEN}`;
      console.log('🗺️ MapBox URL:', url);
      
      const response = await fetch(url);
      
      console.log('🗺️ Response status:', response.status);
      const responseText = await response.text();
      console.log('🗺️ Response text (first 200 chars):', responseText.substring(0, 200));
      
      const data = JSON.parse(responseText);
      console.log('🗺️ MapBox Response:', JSON.stringify(data, null, 2).substring(0, 500));
      
      if (!data.routes || data.routes.length === 0) {
        console.error('❌ MapBox error:', data.message || 'No routes found');
        Speech.speak('Could not find a walking route. Please try different locations.');
        return;
      }
      
      const route = data.routes[0];
      
      // Decode polyline to coordinates
      const coordinates = route.geometry 
        ? decodePolyline(route.geometry)
        : [];
      
      console.log(`🗺️ Decoded ${coordinates.length} coordinates`);

      // Convert MapBox steps to our format
      const steps = route.legs[0].steps.map((step: any) => {
        const stepCount = Math.round(step.distance / 0.75); // 0.75m per step
        
        return {
          instruction: step.maneuver.instruction || 'Continue',
          distance: step.distance,
          stepCount,
          maneuver: {
            type: step.maneuver.type || 'continue',
            modifier: step.maneuver.modifier || '',
          },
          location: {
            latitude: step.maneuver.location[1],
            longitude: step.maneuver.location[0],
          },
        };
      });

      setRouteData({
        coordinates,
        steps,
        totalDistance: route.distance,
        totalDuration: route.duration,
      });

      Speech.speak(
        `Route ready. ${steps.length} instructions. Total distance ${(route.distance / 1000).toFixed(1)} kilometers. Ready to start?`,
        {
          rate: 0.9,
          onDone: () => {
            setMode('navigating');
          }
        }
      );
    } catch (error) {
      console.error('❌ Routing error:', error);
      Speech.speak('There was an error calculating the route. Please try again.');
    }
  };

  const decodePolyline = (encoded: string) => {
    const coordinates: { latitude: number; longitude: number }[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  };

  const handleCancelNavigation = () => {
    setMode('voice-input');
    setRouteData(null);
    setStartLocation(null);
    setEndLocation(null);
    setTranscribedText('');
    setSearchResults([]);
    setShowSearchResults(false);
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
              <Text style={styles.appName}>OUTDOOR NAVIGATION</Text>
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
              {isGettingLocation ? 'GETTING LOCATION...' :
               isRecording ? 'LISTENING...' : 
               isProcessing ? 'PROCESSING...' :
               showSearchResults ? 'SELECT LOCATION' :
               !startLocation ? 'START LOCATION' : 'DESTINATION'}
            </Text>

            {/* Transcribed Text */}
            {transcribedText && !showSearchResults && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>YOU SAID:</Text>
                <Text style={styles.transcriptText}>{transcribedText}</Text>
              </View>
            )}

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => selectLocation(result)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.resultIconContainer}>
                      <FontAwesome5 name="map-marker-alt" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultName}>{result.name}</Text>
                      <Text style={styles.resultAddress}>{result.address}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Processing Indicator */}
            {(isProcessing || isGettingLocation) && (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
            )}

            {/* Instructions */}
            {!isRecording && !isProcessing && !isGettingLocation && !showSearchResults && (
              <View style={styles.instructionsBox}>
                <View style={styles.instructionHeader}>
                  <FontAwesome5 name="info-circle" size={20} color={COLORS.primary} />
                  <Text style={styles.instructionsTitle}>How to use</Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.instructionsText}>
                    {!startLocation
                      ? 'Say your starting location or we will detect it automatically'
                      : 'Say your destination and select from the list'}
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.instructionsText}>
                    Use landmarks or street addresses for best results
                  </Text>
                </View>
              </View>
            )}

            {/* Manual Record Button (backup) */}
            {!isRecording && !isProcessing && !isGettingLocation && !showSearchResults && (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
                activeOpacity={0.85}
              > <LinearGradient
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

  if (mode === 'navigating' && routeData && startLocation && endLocation) {
    return (
      <OutdoorNavigationScreen
        route={routeData}
        startLocation={startLocation}
        endLocation={endLocation}
        onCancel={handleCancelNavigation}
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
  searchResultsContainer: {
    width: '100%',
    maxHeight: 400,
    marginTop: SPACING.lg,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.medium,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontBold,
    marginBottom: SPACING.xs,
  },
  resultAddress: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontRegular,
  },
});