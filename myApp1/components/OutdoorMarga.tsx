import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const COLORS = { bg: '#000000', gold: '#FFD700', grey: '#333333', cardBg: '#1C1C1E', white: '#FFF' };

export default function OutdoorMarga() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* SATELLITE VISUAL */}
      <View style={styles.vizContainer}>
        <View style={styles.satelliteRing}>
          <FontAwesome5 name="satellite-dish" size={60} color={COLORS.gold} />
        </View>
        <Text style={styles.statusText}>Searching for Satellites...</Text>
      </View>

      {/* GPS STATS */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <FontAwesome5 name="tachometer-alt" size={24} color={COLORS.gold} style={{marginBottom:8}}/>
          <Text style={styles.statValue}>0.0</Text>
          <Text style={styles.statLabel}>KM/H</Text>
        </View>
        <View style={styles.card}>
          <FontAwesome5 name="map-marked-alt" size={24} color={COLORS.gold} style={{marginBottom:8}}/>
          <Text style={styles.statValue}>--</Text>
          <Text style={styles.statLabel}>ALTITUDE</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
         <Text style={styles.infoTitle}>GLOBAL COORDINATES</Text>
         <Text style={styles.infoText}>LAT: --.------</Text>
         <Text style={styles.infoText}>LNG: --.------</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 20, width: '100%' },
  vizContainer: { alignItems: 'center', marginBottom: 30 },
  satelliteRing: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: COLORS.gold,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', marginBottom: 15,
    borderStyle: 'dashed'
  },
  statusText: { color: COLORS.gold, fontFamily: 'Atkinson-Bold', fontSize: 16 },
  grid: { flexDirection: 'row', gap: 15, width: '100%', paddingHorizontal: 20, marginBottom: 20 },
  card: { 
    flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.grey
  },
  statValue: { color: COLORS.white, fontSize: 32, fontFamily: 'Atkinson-Bold' },
  statLabel: { color: '#666', fontSize: 12, fontFamily: 'Atkinson-Regular', marginTop: 5 },
  infoBox: { 
      width: '90%', backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 12, 
      borderWidth: 1, borderColor: COLORS.grey, alignItems: 'center' 
  },
  infoTitle: { color: '#888', fontFamily: 'Atkinson-Bold', marginBottom: 10, fontSize: 12 },
  infoText: { color: COLORS.gold, fontFamily: 'Atkinson-Bold', fontSize: 18, marginVertical: 2 },
});