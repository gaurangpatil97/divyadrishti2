import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Vibration,
  ScrollView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/designSystem';

interface Props {
  route: {
    coordinates: { latitude: number; longitude: number }[];
    steps: {
      instruction: string;
      distance: number; // in meters
      stepCount: number; // converted to steps
      maneuver: {
        type: string;
        modifier?: string;
      };
      location: { latitude: number; longitude: number };
    }[];
    totalDistance: number;
    totalDuration: number;
  };
  startLocation: { latitude: number; longitude: number; name: string };
  endLocation: { latitude: number; longitude: number; name: string };
  onCancel: () => void;
}

// const { width, height } = Dimensions.get('window');

export default function OutdoorNavigationScreen({ route, startLocation, endLocation, onCancel }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepsTaken, setStepsTaken] = useState(0);
  const [userLocation, setUserLocation] = useState(startLocation);
  const [heading, setHeading] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [phase, setPhase] = useState<'walk' | 'turn'>('walk');
  const [showMap, setShowMap] = useState(true);

  const mapRef = useRef<MapView>(null);
  const lastPeakTime = useRef(0);
  const consecutiveSteps = useRef(0);
  const gyroZRef = useRef(0);
  const turnDetected = useRef(false);

  const currentStep = route.steps[currentStepIndex];
  const progressPercent = currentStep 
    ? Math.min((stepsTaken / currentStep.stepCount) * 100, 100)
    : 0;

  // Subscribe to GPS location
  useEffect(() => {
    let locationSub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          setUserLocation((prev) => ({
            ...prev,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }));
          setHeading(location.coords.heading || 0);
        }
      );
    })();

    return () => {
      if (locationSub) locationSub.remove();
    };
  }, []);

  // Subscribe to sensors for step counting and turn detection
  useEffect(() => {
    let accelSub: any = null;
    let gyroSub: any = null;

    // Setup gyroscope for turn detection
    Gyroscope.setUpdateInterval(50);
    gyroSub = Gyroscope.addListener(({ z }) => {
      gyroZRef.current = z;
    });

    // Setup accelerometer for step counting
    Accelerometer.setUpdateInterval(50);
    accelSub = Accelerometer.addListener(({ x, y, z }) => {
      if (phase !== 'walk') return;

      const magnitude = Math.sqrt(x * x + y * y + z * z);
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
              setStepsTaken((prev) => prev + 1);
              Vibration.vibrate(15);
            }
          } else {
            consecutiveSteps.current = 1;
          }
          lastPeakTime.current = now;
        }
      }
    });

    return () => {
      if (accelSub) accelSub.remove();
      if (gyroSub) gyroSub.remove();
    };
  }, [phase]);

  // Check if walk phase is complete
  useEffect(() => {
    if (phase === 'walk' && currentStep && stepsTaken >= currentStep.stepCount) {
      // Walk phase complete
      const nextStep = route.steps[currentStepIndex + 1];
      
      if (!nextStep) {
        // Arrived at destination
        handleArrival();
        return;
      }

      // Check if next instruction requires a turn
      if (nextStep.maneuver.type.includes('turn')) {
        setPhase('turn');
        Speech.speak(nextStep.instruction, { rate: 0.85 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Continue straight to next segment
        moveToNextStep();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepsTaken, phase, currentStepIndex]);

  // Detect turns with gyroscope
  useEffect(() => {
    if (phase !== 'turn') return;

    const checkTurn = setInterval(() => {
      const rotation = Math.abs(gyroZRef.current);

      // Detect 90-degree turn (z > 1.5 rad/s threshold)
      if (rotation > 1.5 && !turnDetected.current) {
        turnDetected.current = true;
        Speech.speak('Turn completed. Good!', { rate: 0.9 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setTimeout(() => {
          moveToNextStep();
        }, 500);
      }
    }, 100);

    return () => clearInterval(checkTurn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const moveToNextStep = () => {
    setCurrentStepIndex((prev) => prev + 1);
    setStepsTaken(0);
    setPhase('walk');
    turnDetected.current = false;
    
    const nextStep = route.steps[currentStepIndex + 1];
    if (nextStep) {
      Speech.speak(nextStep.instruction, { rate: 0.85 });
    }
  };

  const handleArrival = () => {
    Speech.speak(`You have arrived at ${endLocation.name}`, { rate: 0.85 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);
    setIsNavigating(false);
  };

  const handleStart = () => {
    setIsNavigating(true);
    Speech.speak(currentStep.instruction, { rate: 0.85 });
  };

  const handleRepeat = () => {
    Speech.speak(currentStep.instruction, { rate: 0.85 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Vibration.vibrate(10);
  };

  const handleCancel = () => {
    Speech.speak('Navigation cancelled');
    Vibration.vibrate(20);
    onCancel();
  };

  const centerMapOnUser = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <FontAwesome5 name="times" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OUTDOOR NAV</Text>
        <TouchableOpacity onPress={() => setShowMap(!showMap)} style={styles.toggleButton}>
          <FontAwesome5 name={showMap ? 'list' : 'map'} size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {showMap ? (
        /* Map View with Overlay */
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: startLocation.latitude,
              longitude: startLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            followsUserLocation
          >
            {/* Route Polyline */}
            <Polyline
              coordinates={route.coordinates}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />

            {/* Start Marker */}
            <Marker coordinate={startLocation} title="Start" pinColor="green" />

            {/* End Marker */}
            <Marker coordinate={endLocation} title="Destination" pinColor="red" />

            {/* Waypoint Markers */}
            {route.steps.map((step, idx) => (
              <Marker
                key={idx}
                coordinate={step.location}
                opacity={idx === currentStepIndex ? 1 : 0.3}
              >
                <View style={[styles.waypointMarker, idx === currentStepIndex && styles.activeWaypoint]}>
                  <Text style={styles.waypointText}>{idx + 1}</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Navigation Info Overlay on Map */}
          <View style={styles.mapOverlay}>
            {/* Current Instruction Card */}
            <View style={styles.instructionCard}>
              <View style={styles.instructionHeader}>
                <FontAwesome5 
                  name={phase === 'turn' ? 'exchange-alt' : 'walking'} 
                  size={24} 
                  color={COLORS.primary} 
                />
                <Text style={styles.stepCounter}>
                  Step {currentStepIndex + 1} of {route.steps.length}
                </Text>
              </View>
              <Text style={styles.instructionText}>{currentStep.instruction}</Text>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {stepsTaken} / {currentStep.stepCount} steps
                </Text>
              </View>
              
              <View style={styles.distanceInfo}>
                <Text style={styles.distanceText}>
                  {currentStep.distance.toFixed(0)}m remaining
                </Text>
                <Text style={styles.phaseText}>
                  {phase === 'walk' ? '🚶 Walking' : '↪️ Turning'}
                </Text>
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleRepeat}
              >
                <FontAwesome5 name="redo" size={20} color={COLORS.textPrimary} />
                <Text style={styles.actionButtonText}>Repeat</Text>
              </TouchableOpacity>
              
              {!isNavigating && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.startButton]}
                  onPress={handleStart}
                >
                  <FontAwesome5 name="play" size={20} color={COLORS.background} />
                  <Text style={[styles.actionButtonText, styles.startButtonText]}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Center on User Button */}
          <TouchableOpacity style={styles.centerButton} onPress={centerMapOnUser}>
            <FontAwesome5 name="location-arrow" size={20} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      ) : (
        /* Full Instruction View */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!isNavigating ? (
            /* Start Screen */
            <View style={styles.startContainer}>
              <View style={styles.routeInfo}>
                <FontAwesome5 name="route" size={40} color={COLORS.primary} />
                <Text style={styles.routeTitle}>Route Ready</Text>
                <Text style={styles.routeDetails}>
                  {route.steps.length} steps • {(route.totalDistance / 1000).toFixed(1)} km
                </Text>
                <Text style={styles.routeDetails}>
                  ~{Math.round(route.totalDuration / 60)} minutes
                </Text>
              </View>

              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <LinearGradient
                  colors={[COLORS.primary, '#C4FF0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startButtonGradient}
                >
                  <FontAwesome5 name="play" size={24} color={COLORS.background} />
                  <Text style={styles.startButtonText}>START NAVIGATION</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* Navigation View */
            <>
              {/* Current Instruction */}
              <View style={styles.instructionBox}>
                <FontAwesome5
                  name={
                    phase === 'turn'
                      ? currentStep.maneuver.modifier?.includes('left')
                        ? 'arrow-left'
                        : 'arrow-right'
                      : 'arrow-up'
                  }
                  size={60}
                  color={phase === 'turn' ? '#FF9500' : COLORS.primary}
                />
                <Text style={[styles.instructionText, phase === 'turn' && styles.turnInstructionText]}>
                  {currentStep.instruction}
                </Text>

                {/* Phase indicator */}
                <Text style={styles.phaseText}>
                  {phase === 'turn' ? '🔄 TURNING' : '🚶 WALKING'}
                </Text>
              </View>

              {/* Progress Bar - Only show during walk phase */}
              {phase === 'walk' && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>
                      {stepsTaken} / {currentStep.stepCount} steps
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                  </View>
                  <Text style={styles.remainingText}>
                    {currentStep.stepCount - stepsTaken} steps remaining
                  </Text>
                </View>
              )}

              {/* Sensor Data */}
              <View style={styles.sensorBox}>
                <View style={styles.sensorRow}>
                  <FontAwesome5 name="walking" size={20} color="#888" />
                  <Text style={styles.sensorLabel}>Total Steps:</Text>
                  <Text style={styles.sensorValue}>{stepsTaken}</Text>
                </View>
                <View style={styles.sensorRow}>
                  <FontAwesome5 name="compass" size={20} color="#888" />
                  <Text style={styles.sensorLabel}>Heading:</Text>
                  <Text style={styles.sensorValue}>{Math.round(heading)}°</Text>
                </View>
                <View style={styles.sensorRow}>
                  <FontAwesome5 name="map-marker-alt" size={20} color="#888" />
                  <Text style={styles.sensorLabel}>Step:</Text>
                  <Text style={styles.sensorValue}>
                    {currentStepIndex + 1} / {route.steps.length}
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity style={styles.actionButton} onPress={handleRepeat}>
                <FontAwesome5 name="redo" size={28} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>REPEAT</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  toggleButton: {
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.h3,
    fontFamily: TYPOGRAPHY.fontBold,
    letterSpacing: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    gap: SPACING.md,
  },
  instructionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  stepCounter: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontBold,
    flex: 1,
  },
  progressContainer: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontRegular,
    textAlign: 'center',
  },
  distanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  distanceText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  startButtonText: {
    color: COLORS.background,
  },
  waypointMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeWaypoint: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  waypointText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl * 2,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
  },
  routeInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xxl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: SPACING.xl,
    width: '100%',
    ...SHADOWS.glow,
  },
  routeTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.h2,
    fontFamily: TYPOGRAPHY.fontBold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  routeDetails: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontRegular,
    marginTop: SPACING.xs,
  },
  startButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  startButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.lg,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  instructionBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: SPACING.lg,
    ...SHADOWS.glow,
  },
  instructionText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.h4,
    fontFamily: TYPOGRAPHY.fontBold,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 30,
  },
  turnInstructionText: {
    fontSize: TYPOGRAPHY.h2,
    color: '#FF9500',
  },
  phaseText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontBold,
    marginTop: SPACING.md,
    letterSpacing: 2,
  },
  progressSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  progressValue: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  remainingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.caption,
    fontFamily: TYPOGRAPHY.fontRegular,
    textAlign: 'center',
  },
  sensorBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sensorLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontRegular,
    flex: 1,
  },
  sensorValue: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  actionButton: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontBold,
  },
});
