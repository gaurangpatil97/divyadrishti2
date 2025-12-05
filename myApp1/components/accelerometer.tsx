import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// DIVYADRISHTI THEME
const COLORS = {
  bg: '#000000',
  gold: '#FFD700',
  white: '#FFFFFF',
  grey: '#333333',
  activeGreen: '#00FF00'
};

interface Props {
  onBack?: () => void;
}

export default function StepCounterTest({ onBack }: Props) {
  const [steps, setSteps] = useState(0);
  const [mode, setMode] = useState<'HAND' | 'CHEST'>('HAND'); // 'HAND' or 'CHEST'
  
  const lastPeakTime = useRef(0);
  const consecutiveSteps = useRef(0);

  // --- SENSITIVITY SETTINGS ---
  // HAND: Needs to be strict (Phone shakes while filming) -> 1.3G
  // CHEST: Body absorbs shock, so needs to be sensitive -> 1.1G
  const threshold = mode === 'CHEST' ? 1.1 : 1.3;

  useEffect(() => {
    // 50ms = 20Hz (Good balance for battery vs accuracy)
    Accelerometer.setUpdateInterval(50);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // Calculate Total G-Force
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      // Peak Detection
      if (magnitude > threshold) {
        const timeSinceLast = now - lastPeakTime.current;

        // FILTER 1: Speed Limit
        // Humans can't run faster than ~3 steps/sec (350ms gap)
        if (timeSinceLast > 350) {
            
            // FILTER 2: Rhythm Check
            // If you stopped for >1.5s, we reset the "consecutive" counter.
            // You must take 2 consistent steps to start counting (prevents random bumps).
            if (timeSinceLast < 1500) {
                 consecutiveSteps.current += 1;
                 
                 // Once verified, count the step
                 if (consecutiveSteps.current >= 2) {
                     setSteps(prev => prev + 1);
                     // Optional: Subtle haptic feedback for every 10 steps
                     // if (steps % 10 === 0) Vibration.vibrate(10); 
                 }
            } else {
                 consecutiveSteps.current = 1; // Reset rhythm logic
            }
            lastPeakTime.current = now;
        }
      }
    });

    return () => subscription.remove();
  }, [mode]); // Re-run effect when mode changes

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
             <FontAwesome5 name="chevron-left" size={24} color={COLORS.gold} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>PEDOMETER</Text>
      </View>

      {/* MODE SWITCHER */}
      <View style={styles.toggleWrapper}>
         <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, mode === 'HAND' && styles.activeBtn]} 
              onPress={() => { Vibration.vibrate(20); setMode('HAND'); }}
            >
              <FontAwesome5 name="mobile-alt" size={16} color={mode === 'HAND' ? '#000' : '#888'} />
              <Text style={[styles.toggleText, mode === 'HAND' && styles.activeText]}> HANDHELD</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleBtn, mode === 'CHEST' && styles.activeBtn]} 
              onPress={() => { Vibration.vibrate(20); setMode('CHEST'); }}
            >
              <FontAwesome5 name="user-shield" size={16} color={mode === 'CHEST' ? '#000' : '#888'} />
              <Text style={[styles.toggleText, mode === 'CHEST' && styles.activeText]}> CHEST MOUNT</Text>
            </TouchableOpacity>
         </View>
         <Text style={styles.infoText}>Sensitivity Threshold: {threshold} G</Text>
      </View>

      {/* MAIN COUNTER */}
      <View style={styles.circleContainer}>
        <View style={styles.circle}>
           <MaterialCommunityIcons name="shoe-print" size={50} color={COLORS.gold} style={{opacity: 0.8}} />
           <Text style={styles.stepCount}>{steps}</Text>
           <Text style={styles.label}>STEPS TAKEN</Text>
        </View>
      </View>

      {/* RESET BUTTON */}
      <TouchableOpacity 
        style={styles.resetBtn} 
        onPress={() => { Vibration.vibrate(50); setSteps(0); }}
      >
        <Text style={styles.btnText}>RESET COUNTER</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center' },
  
  // Header
  header: {
    width: '100%', flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: 30
  },
  backButton: { padding: 10, marginRight: 15, borderWidth: 1, borderColor: '#333', borderRadius: 8, backgroundColor: '#1C1C1E' },
  headerTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },

  // Toggle
  toggleWrapper: { alignItems: 'center', marginBottom: 40 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#333' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
  activeBtn: { backgroundColor: COLORS.gold },
  toggleText: { color: '#888', fontWeight: 'bold', fontSize: 14 },
  activeText: { color: '#000' },
  infoText: { color: '#666', marginTop: 10, fontSize: 12 },

  // Counter
  circleContainer: { flex: 1, justifyContent: 'center' },
  circle: {
    width: 250, height: 250, borderRadius: 125,
    borderWidth: 6, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#111',
    shadowColor: COLORS.gold, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
  },
  stepCount: { color: COLORS.white, fontSize: 80, fontWeight: 'bold', lineHeight: 85 },
  label: { color: '#888', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginTop: 5 },

  // Reset
  resetBtn: { 
      marginBottom: 50, paddingVertical: 18, paddingHorizontal: 50, 
      borderWidth: 2, borderColor: '#333', borderRadius: 30, backgroundColor: '#111' 
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});