import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image } from 'react-native';
import * as Location from 'expo-location'; // <--- THE PRO FIX
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// IMPORT YOUR SVG COMPONENT (If you made it)
// import CompassRose from './CompassRose'; 

const COLORS = {
  bg: '#000000',
  gold: '#FFD700',
  white: '#FFFFFF',
  grey: '#333333',
  red: '#FF4500'
};

interface Props {
  onBack?: () => void;
}

export default function CompassTest({ onBack }: Props) {
  const [heading, setHeading] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startCompass = async () => {
      // 1. Request Permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // 2. Watch Heading (The "Pro" Compass)
      subscription = await Location.watchHeadingAsync((obj) => {
        let newHeading = obj.magHeading; // Magnetic North (0-360)
        setHeading(newHeading);
      });
    };

    startCompass();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // --- HELPER: Get Cardinal Direction ---
  const getCardinal = (angle: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
    return directions[index];
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
        <Text style={styles.headerTitle}>PRO COMPASS</Text>
      </View>

      {/* MAIN VISUAL */}
      <View style={styles.compassContainer}>
        
        {/* ROTATING DIAL */}
        {/* We rotate the DIAL opposite to heading so North stays pointing North */}
        <View style={[styles.dial, { transform: [{ rotate: `${-heading}deg` }] }]}>
           
           {/* OUTER RING */}
           <View style={styles.outerRing} />
           
           {/* INNER TICKS */}
           <View style={styles.innerRing} />
           
           {/* MARKERS */}
           <Text style={[styles.marker, styles.north]}>N</Text>
           <Text style={[styles.marker, styles.east]}>E</Text>
           <Text style={[styles.marker, styles.south]}>S</Text>
           <Text style={[styles.marker, styles.west]}>W</Text>

           {/* DECORATIVE STAR (Simplified Visual) */}
           <MaterialCommunityIcons name="star-four-points" size={180} color={COLORS.gold} style={{ opacity: 0.2 }} />
        </View>

        {/* FIXED RED POINTER (The Phone) */}
        {/* This stays fixed at the top, indicating where the phone is pointing */}
        <View style={styles.pointerContainer}>
             <View style={styles.pointer} />
        </View>

      </View>

      {/* READOUT */}
      <View style={styles.readoutBox}>
         <Text style={styles.degreeText}>{Math.round(heading)}°</Text>
         <Text style={styles.directionText}>{getCardinal(heading)}</Text>
      </View>

      <Text style={styles.hintText}>{errorMsg || "High Accuracy Mode Active"}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center' },
  
  header: {
    width: '100%', flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: 30
  },
  backButton: { padding: 10, marginRight: 15, borderWidth: 1, borderColor: '#333', borderRadius: 8, backgroundColor: '#1C1C1E' },
  headerTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },

  // COMPASS VISUALS
  compassContainer: {
    width: 320, height: 320,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 40,
  },
  dial: {
    width: 300, height: 300,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 150,
    borderWidth: 2, borderColor: '#333',
    // Shadow for depth
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  
  // Rings
  outerRing: {
     position: 'absolute', width: '95%', height: '95%',
     borderRadius: 150, borderWidth: 2, borderColor: '#444'
  },
  innerRing: {
     position: 'absolute', width: '60%', height: '60%',
     borderRadius: 150, borderWidth: 1, borderColor: '#222', backgroundColor: '#000'
  },

  // Text Markers
  marker: { position: 'absolute', fontSize: 28, fontWeight: 'bold', color: COLORS.grey },
  north: { top: 15, color: COLORS.red }, 
  south: { bottom: 15, color: COLORS.white },
  east: { right: 20, top: '45%', color: COLORS.white },
  west: { left: 20, top: '45%', color: COLORS.white },

  // The Fixed Pointer
  pointerContainer: {
      position: 'absolute', top: -10, alignItems: 'center', zIndex: 10
  },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 15, borderRightWidth: 15, borderBottomWidth: 30,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: COLORS.gold,
  },

  // Readout
  readoutBox: { alignItems: 'center', marginBottom: 20 },
  degreeText: { fontSize: 80, fontWeight: 'bold', color: COLORS.white },
  directionText: { fontSize: 40, fontWeight: 'bold', color: COLORS.gold, letterSpacing: 2 },
  
  hintText: { color: '#666', fontSize: 14, fontStyle: 'italic' }
});