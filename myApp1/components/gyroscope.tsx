import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { FontAwesome5 } from '@expo/vector-icons';

// DIVYADRISHTI THEME
const COLORS = {
  bg: '#000000',
  gold: '#FFD700',
  white: '#FFFFFF',
  grey: '#333333'
};

export default function TurnDetector({ onBack }: { onBack?: () => void }) {
  const [currentAction, setCurrentAction] = useState("STRAIGHT");
  const [debugAngle, setDebugAngle] = useState(0);

  // LOGIC REFS
  const accumulatedAngle = useRef(0);
  const lastTimestamp = useRef(Date.now());

  // SETTINGS
  const TURN_THRESHOLD = 45; // Degrees to trigger a turn

  useEffect(() => {
    Gyroscope.setUpdateInterval(50); // 20Hz update rate

    const subscription = Gyroscope.addListener(({ z }) => {
      const now = Date.now();
      const dt = (now - lastTimestamp.current) / 1000; // Delta time in seconds
      lastTimestamp.current = now;

      // EXPO GYRO: +Z is Left (CCW), -Z is Right (CW)
      const degreesTurned = z * (180 / Math.PI) * dt;

      // Accumulate
      accumulatedAngle.current += degreesTurned;
      
      // Update UI
      setDebugAngle(Math.round(accumulatedAngle.current));

      // --- TURN LOGIC ---
      if (accumulatedAngle.current > TURN_THRESHOLD) {
        triggerTurn("LEFT ⬅️");
      } 
      else if (accumulatedAngle.current < -TURN_THRESHOLD) {
        triggerTurn("RIGHT ➡️");
      }
    });

    return () => subscription.remove();
  }, []);

  const triggerTurn = (direction: string) => {
    Vibration.vibrate(50);
    setCurrentAction(direction);
    accumulatedAngle.current = 0; // Reset bucket
    
    // Auto-reset message after 2s
    setTimeout(() => setCurrentAction("STRAIGHT ⬆️"), 2000);
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
             <FontAwesome5 name="chevron-left" size={24} color={COLORS.gold} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>GYRO SENSOR</Text>
      </View>

      {/* MAIN DISPLAY */}
      <View style={styles.content}>
        
        {/* ACTION CARD */}
        <View style={[styles.card, currentAction !== "STRAIGHT ⬆️" && styles.cardActive]}>
           <FontAwesome5 
              name={currentAction.includes("LEFT") ? "arrow-left" : currentAction.includes("RIGHT") ? "arrow-right" : "arrow-up"} 
              size={60} 
              color={COLORS.gold} 
              style={{marginBottom: 20}}
           />
           <Text style={styles.statusLabel}>STATUS</Text>
           <Text style={styles.actionText}>{currentAction}</Text>
        </View>

        {/* DEBUG INFO */}
        <View style={styles.debugBox}>
          <Text style={styles.smallText}>ACCUMULATED ANGLE</Text>
          <Text style={[styles.angleText, { color: Math.abs(debugAngle) > 30 ? COLORS.gold : COLORS.white }]}>
             {debugAngle}°
          </Text>
          <View style={styles.progressBar}>
             {/* Visual Bar visualizing the turn threshold */}
             <View style={{
                 height: 4, 
                 width: `${Math.min(Math.abs(debugAngle) / TURN_THRESHOLD * 100, 100)}%`, 
                 backgroundColor: COLORS.gold 
             }} />
          </View>
          <Text style={styles.hintText}>Turn {TURN_THRESHOLD}° to trigger</Text>
        </View>

        {/* RESET BUTTON */}
        <TouchableOpacity 
          style={styles.resetBtn} 
          onPress={() => { accumulatedAngle.current = 0; setCurrentAction("STRAIGHT ⬆️"); }}
        >
          <Text style={styles.btnText}>RE-CENTER SENSOR</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.grey,
  },
  backButton: { padding: 10, marginRight: 15, borderWidth: 1, borderColor: COLORS.grey, borderRadius: 8 },
  headerTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },

  card: {
    width: '100%', alignItems: 'center', padding: 30, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.grey, backgroundColor: '#111',
    marginBottom: 40
  },
  cardActive: { borderColor: COLORS.gold, borderWidth: 2 }, // Highlight when turning

  statusLabel: { color: '#888', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  actionText: { color: COLORS.white, fontSize: 32, fontWeight: 'bold' },

  debugBox: { width: '100%', alignItems: 'center', padding: 20, borderRadius: 15, backgroundColor: '#111' },
  smallText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  angleText: { fontSize: 50, fontWeight: 'bold', marginVertical: 10 },
  progressBar: { width: '100%', height: 4, backgroundColor: '#333', marginTop: 10, borderRadius: 2 },
  hintText: { color: '#666', fontSize: 12, marginTop: 10 },

  resetBtn: { marginTop: 30, paddingVertical: 15, paddingHorizontal: 40, borderWidth: 2, borderColor: COLORS.gold, borderRadius: 12 },
  btnText: { color: COLORS.gold, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});