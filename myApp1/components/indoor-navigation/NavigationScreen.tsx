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
import { FontAwesome5 } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { NavigationSession } from '../../utils/navigation-session';
import { NavigationInstruction, MargaUpdate } from '../../types/indoor-navigation';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/designSystem';

interface Props {
  navigationSession: NavigationSession;
  onCancel: () => void;
  margaUpdate: MargaUpdate; // Real-time updates from your marga module
}

export default function NavigationScreen({ navigationSession, onCancel, margaUpdate }: Props) {
  const [currentInstruction, setCurrentInstruction] = useState<NavigationInstruction | null>(null);
  const [stepsTaken, setStepsTaken] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const hasAnnouncedRef = useRef(false);

  useEffect(() => {
    // Listen to navigation events
    const handleInstruction = (event: any) => {
      const instruction = event.data.instruction;
      setCurrentInstruction(instruction);
      
      // Announce instruction
      Speech.speak(instruction.text, {
        rate: 0.85,
        pitch: 1.0,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      hasAnnouncedRef.current = true;
    };

    const handleProgress = (event: any) => {
      const progress = event.data;
      setStepsTaken(progress.stepsTaken);
      setDistanceRemaining(progress.distanceRemaining);
    };

    const handleTurnCompleted = (event: any) => {
      Speech.speak('Turn completed. Good!', { rate: 0.9 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleArrived = (event: any) => {
      Speech.speak(event.data.instruction.text, { rate: 0.85 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate([0, 100, 50, 100, 50, 100]);
    };

    navigationSession.on('instruction', handleInstruction);
    navigationSession.on('progress', handleProgress);
    navigationSession.on('turnCompleted', handleTurnCompleted);
    navigationSession.on('arrived', handleArrived);

    // Start navigation
    navigationSession.start();

    return () => {
      navigationSession.off('instruction', handleInstruction);
      navigationSession.off('progress', handleProgress);
      navigationSession.off('turnCompleted', handleTurnCompleted);
      navigationSession.off('arrived', handleArrived);
    };
  }, [navigationSession]);

  // Update navigation with marga data
  useEffect(() => {
    if (navigationSession.isNavigating()) {
      navigationSession.update(margaUpdate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [margaUpdate]);

  const handleRepeat = () => {
    navigationSession.repeatInstruction();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Vibration.vibrate(10);
  };

  const handleCancel = () => {
    Speech.speak('Navigation cancelled');
    navigationSession.cancel();
    Vibration.vibrate(20);
    onCancel();
  };

  const expectedSteps = currentInstruction?.expectedSteps || 0;
  const progressPercent = expectedSteps > 0 
    ? Math.min((stepsTaken / expectedSteps) * 100, 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.cancelButton}
        >
          <FontAwesome5 name="times" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NAVIGATING</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Instruction */}
        {currentInstruction && (
          <>
            {/* Instruction Display - Different for Turn vs Walk */}
            <View style={styles.instructionBox}>
              <FontAwesome5 
                name={
                  currentInstruction.phase === 'turn' ? 'reply' :
                  currentInstruction.type === 'start' ? 'play-circle' :
                  currentInstruction.type === 'arrive' ? 'flag-checkered' :
                  'walking'
                } 
                size={60} 
                color={currentInstruction.phase === 'turn' ? '#FF9500' : '#FFD700'} 
              />
              <Text 
                style={[
                  styles.instructionText,
                  currentInstruction.phase === 'turn' && styles.turnInstructionText
                ]}
                accessibilityLabel={currentInstruction.text}
                accessibilityRole="text"
              >
                {currentInstruction.text}
              </Text>
              
              {/* Phase indicator */}
              <Text style={styles.phaseText}>
                {currentInstruction.phase === 'turn' ? '🔄 TURNING' : '🚶 WALKING'}
              </Text>
            </View>

            {/* Progress Bar - Only show during walk phase */}
            {currentInstruction.phase === 'walk' && currentInstruction.type !== 'arrive' && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>
                    {stepsTaken} / {expectedSteps} steps
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[styles.progressBar, { width: `${progressPercent}%` }]}
                    accessibilityLabel={`${Math.round(progressPercent)} percent complete`}
                  />
                </View>
                <Text style={styles.remainingText}>
                  {distanceRemaining} steps remaining
                </Text>
              </View>
            )}

            {/* Sensor Data */}
            <View style={styles.sensorBox}>
              <View style={styles.sensorRow}>
                <FontAwesome5 name="walking" size={20} color="#888" />
                <Text style={styles.sensorLabel}>Steps:</Text>
                <Text style={styles.sensorValue}>{margaUpdate.stepCount}</Text>
              </View>
              <View style={styles.sensorRow}>
                <FontAwesome5 name="compass" size={20} color="#888" />
                <Text style={styles.sensorLabel}>Heading:</Text>
                <Text style={styles.sensorValue}>{Math.round(margaUpdate.heading)}°</Text>
              </View>
              <View style={styles.sensorRow}>
                <FontAwesome5 name="ruler" size={20} color="#888" />
                <Text style={styles.sensorLabel}>Distance:</Text>
                <Text style={styles.sensorValue}>{margaUpdate.distance.toFixed(1)}m</Text>
              </View>
            </View>

            {/* Action Button - Repeat Only */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRepeat}
                accessibilityLabel="Repeat instruction"
                accessibilityRole="button"
              >
                <FontAwesome5 name="redo" size={28} color="#FFD700" />
                <Text style={styles.actionButtonText}>REPEAT</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
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
  headerTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.h3,
    fontFamily: TYPOGRAPHY.fontBold,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl * 2,
  },
  calibrationBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xxl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  calibrationTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.h3,
    fontFamily: TYPOGRAPHY.fontBold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  calibrationText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontRegular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  calibrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  calibrateButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.base,
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
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
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
