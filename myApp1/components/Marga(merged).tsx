import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration, ScrollView } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location'; 
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// --- CONFIGURATION ---
const STEP_LENGTH = 0.75; // Average step in meters
const TURN_THRESHOLD = 45; // Degrees/sec to trigger visual turn alert

const COLORS = {
  bg: '#000000',
  gold: '#FFD700',
  white: '#FFFFFF',
  grey: '#333333',
  red: '#FF4500',
  green: '#00FF00'
};

interface Props {
  onBack: () => void;
}

export default function Marga({ onBack }: Props) {
  // --- STATE ---
  const [heading, setHeading] = useState(0); // From Location
  const [steps, setSteps] = useState(0);     // From Accelerometer
  const [coords, setCoords] = useState({ x: 0, y: 0 }); // Calculated Position
  const [turnAction, setTurnAction] = useState("STRAIGHT"); // From Gyro

  // --- REFS (For High-Speed Logic) ---
  const lastPeakTime = useRef(0);
  const consecutiveSteps = useRef(0);
  const currentHeadingRef = useRef(0); 
  const gyroAccumulator = useRef(0);
  const lastGyroTime = useRef(Date.now());

  // ---------------------------------------------------------
  // 1. COMPASS LOGIC (Orientation)
  // ---------------------------------------------------------
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      sub = await Location.watchHeadingAsync((obj) => {
        const angle = Math.round(obj.magHeading);
        setHeading(angle);
        currentHeadingRef.current = angle;
      });
    })();

    return () => { if (sub) sub.remove(); };
  }, []);

  // ---------------------------------------------------------
  // 2. PEDOMETER LOGIC (Movement)
  // ---------------------------------------------------------
  useEffect(() => {
    Accelerometer.setUpdateInterval(50);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
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
                     recordStep(); // <--- TRIGGER UPDATE
                 }
            } else {
                 consecutiveSteps.current = 1;
            }
            lastPeakTime.current = now;
        }
      }
    });
    return () => sub.remove();
  }, []);

  // ---------------------------------------------------------
  // 3. GYROSCOPE LOGIC (Visual Feedback)
  // ---------------------------------------------------------
  useEffect(() => {
    Gyroscope.setUpdateInterval(50);
    const sub = Gyroscope.addListener(({ z }) => {
      const now = Date.now();
      const dt = (now - lastGyroTime.current) / 1000;
      lastGyroTime.current = now;

      const degrees = z * (180 / Math.PI) * dt;
      gyroAccumulator.current += degrees;

      // Detect Sharp Turns
      if (gyroAccumulator.current > TURN_THRESHOLD) {
         showTurnAlert("LEFT ⬅️");
      } else if (gyroAccumulator.current < -TURN_THRESHOLD) {
         showTurnAlert("RIGHT ➡️");
      }
    });
    return () => sub.remove();
  }, []);

  const showTurnAlert = (dir: string) => {
    setTurnAction(dir);
    gyroAccumulator.current = 0;
    setTimeout(() => setTurnAction("STRAIGHT"), 1500);
  };

  // ---------------------------------------------------------
  // 4. THE DEAD RECKONING MATH
  // ---------------------------------------------------------
  const recordStep = () => {
    Vibration.vibrate(15);
    setSteps(p => p + 1);

    // Convert Degrees to Radians for Math.sin/cos
    // 0° = North (+Y), 90° = East (+X)
    const rad = currentHeadingRef.current * (Math.PI / 180);

    setCoords(prev => ({
       x: prev.x + (STEP_LENGTH * Math.sin(rad)), // East/West
       y: prev.y + (STEP_LENGTH * Math.cos(rad))  // North/South
    }));
  };

  // --- RENDER HELPERS ---
  const getCardinal = (deg: number) => ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8];

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
           <FontAwesome5 name="chevron-left" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>MARGA NAV</Text>
            <Text style={styles.headerSub}>Sensor Fusion: Active</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* 1. VISUALIZATION DECK */}
        <View style={styles.vizContainer}>
           {/* TURN INDICATOR OVERLAY */}
           {turnAction !== "STRAIGHT" && (
             <View style={styles.turnOverlay}>
                <FontAwesome5 
                  name={turnAction.includes("LEFT") ? "arrow-left" : "arrow-right"} 
                  size={40} color={COLORS.bg} 
                />
                <Text style={styles.turnText}>{turnAction}</Text>
             </View>
           )}

           {/* COMPASS RING */}
           <View style={[styles.compassRing, { transform: [{ rotate: `${-heading}deg` }] }]}>
              <View style={styles.northMarker} />
              <MaterialCommunityIcons name="navigation" size={80} color={COLORS.gold} />
           </View>
           
           {/* LIVE HEADING */}
           <View style={styles.headingBadge}>
              <Text style={styles.headingText}>{heading}° {getCardinal(heading)}</Text>
           </View>
        </View>

        {/* 2. STATS GRID */}
        <View style={styles.grid}>
           <View style={styles.card}>
              <FontAwesome5 name="shoe-prints" size={24} color={COLORS.gold} style={{marginBottom:5}}/>
              <Text style={styles.statValue}>{steps}</Text>
              <Text style={styles.statLabel}>STEPS</Text>
           </View>
           <View style={styles.card}>
              <FontAwesome5 name="ruler-combined" size={24} color={COLORS.gold} style={{marginBottom:5}}/>
              <Text style={styles.statValue}>{(steps * STEP_LENGTH).toFixed(1)}m</Text>
              <Text style={styles.statLabel}>DISTANCE</Text>
           </View>
        </View>

        {/* 3. LIVE COORDINATES (THE RESULT) */}
        <View style={styles.coordsCard}>
           <Text style={styles.coordsTitle}>REAL-TIME POSITION</Text>
           <View style={styles.coordsRow}>
              <View style={styles.coordBox}>
                 <Text style={styles.coordLabel}>X (EAST)</Text>
                 <Text style={styles.coordValue}>{coords.x.toFixed(1)}m</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.coordBox}>
                 <Text style={styles.coordLabel}>Y (NORTH)</Text>
                 <Text style={styles.coordValue}>{coords.y.toFixed(1)}m</Text>
              </View>
           </View>
        </View>

        {/* RESET */}
        <TouchableOpacity 
           style={styles.resetBtn} 
           onPress={() => { setSteps(0); setCoords({x:0, y:0}); Vibration.vibrate(50); }}
        >
           <Text style={styles.resetText}>RESET PATH</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 40, alignItems: 'center' },

  // HEADER
  header: {
    width: '100%', flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.grey, backgroundColor: COLORS.bg, zIndex: 10
  },
  backButton: { 
    padding: 10, marginRight: 15, borderWidth: 1, borderColor: COLORS.grey, borderRadius: 8, backgroundColor: '#1C1C1E' 
  },
  headerTitle: { color: COLORS.gold, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#888', fontSize: 12, fontWeight: 'bold' },

  // VISUALIZATION
  vizContainer: { 
     width: 300, height: 300, justifyContent: 'center', alignItems: 'center', marginVertical: 20 
  },
  compassRing: {
     width: 240, height: 240, borderRadius: 120, borderWidth: 4, borderColor: COLORS.grey,
     justifyContent: 'center', alignItems: 'center', backgroundColor: '#111'
  },
  northMarker: {
     position: 'absolute', top: 0, width: 4, height: 20, backgroundColor: COLORS.red
  },
  headingBadge: {
     position: 'absolute', bottom: 10, backgroundColor: '#000', borderWidth: 1, borderColor: COLORS.gold,
     paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15
  },
  headingText: { color: COLORS.gold, fontWeight: 'bold', fontFamily: 'monospace' },

  // GYRO ALERT
  turnOverlay: {
     position: 'absolute', top: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center',
     backgroundColor: COLORS.gold, padding: 10, borderRadius: 20, gap: 10
  },
  turnText: { color: COLORS.bg, fontWeight: 'bold', fontSize: 16 },

  // STATS
  grid: { flexDirection: 'row', gap: 15, width: '90%', marginBottom: 20 },
  card: { 
     flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, padding: 20, alignItems: 'center',
     borderWidth: 1, borderColor: COLORS.grey
  },
  statValue: { color: COLORS.white, fontSize: 32, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 12, fontWeight: 'bold', marginTop: 5 },

  // COORDS
  coordsCard: {
     width: '90%', backgroundColor: '#111', borderRadius: 16, padding: 20,
     borderWidth: 1, borderColor: COLORS.gold, marginBottom: 20
  },
  coordsTitle: { color: '#888', textAlign: 'center', marginBottom: 15, fontWeight: 'bold', letterSpacing: 1 },
  coordsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  coordBox: { alignItems: 'center' },
  coordLabel: { color: '#666', fontSize: 10, marginBottom: 5 },
  coordValue: { color: COLORS.gold, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  divider: { width: 1, height: 40, backgroundColor: COLORS.grey },

  // RESET
  resetBtn: { paddingVertical: 15, paddingHorizontal: 40, backgroundColor: '#1C1C1E', borderRadius: 30, borderWidth: 1, borderColor: COLORS.grey },
  resetText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
}); 