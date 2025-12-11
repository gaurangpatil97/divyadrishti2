import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Vibration } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// ✅ IMPORT SUB-COMPONENTS
import IndoorMarga from './IndoorMarga';
import OutdoorMarga from './OutdoorMarga';

const COLORS = {
  bg: '#000000',
  gold: '#FFD700',
  grey: '#333333',
  cardBg: '#1C1C1E',
  white: '#FFFFFF'
};

interface Props {
  onBack: () => void;
}

// --- LOCAL COMPONENT: THE BIG CARD ---
const MargaCard = ({ title, subtitle, icon, onPress }: { title: string, subtitle: string, icon: any, onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.card} 
    onPress={() => { Vibration.vibrate(10); onPress(); }}
    activeOpacity={0.8}
  >
    <View style={styles.iconCircle}>
       <FontAwesome5 name={icon} size={32} color={COLORS.gold} />
    </View>
    <View style={styles.textContainer}>
       <Text style={styles.cardTitle}>{title}</Text>
       <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={30} color={COLORS.gold} />
  </TouchableOpacity>
);

// --- MAIN COMPONENT ---
export default function Marga({ onBack }: Props) {
  const [subMode, setSubMode] = useState<'INDOOR' | 'OUTDOOR' | null>(null);

  // 1. RENDER INDOOR MODE
  if (subMode === 'INDOOR') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSubMode(null)} style={styles.backButton}>
             <FontAwesome5 name="chevron-left" size={24} color={COLORS.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>INDOOR NAV</Text>
        </View>
        <IndoorMarga />
      </View>
    );
  }

  // 2. RENDER OUTDOOR MODE
  if (subMode === 'OUTDOOR') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSubMode(null)} style={styles.backButton}>
             <FontAwesome5 name="chevron-left" size={24} color={COLORS.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OUTDOOR GPS</Text>
        </View>
        <OutdoorMarga />
      </View>
    );
  }

  // 3. RENDER MENU (DEFAULT)
  return (
    <View style={styles.container}>
      
      {/* HEADER (Goes back to Home) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
           <FontAwesome5 name="chevron-left" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>MARGA</Text>
            <Text style={styles.headerSub}>Select Navigation Type</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.menuContainer}>
         
         <Text style={styles.sectionLabel}>AVAILABLE MODES</Text>

         {/* INDOOR CARD */}
         <MargaCard 
            title="INDOOR NAVIGATION" 
            subtitle="Dead Reckoning (Steps + Compass)"
            icon="dungeon"
            onPress={() => setSubMode('INDOOR')}
         />

         {/* OUTDOOR CARD */}
         <MargaCard 
            title="OUTDOOR GPS" 
            subtitle="Satellite Positioning & Address"
            icon="satellite-dish"
            onPress={() => setSubMode('OUTDOOR')}
         />

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  // HEADER
  header: {
    width: '100%', flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.grey, backgroundColor: COLORS.bg, zIndex: 10
  },
  backButton: { 
    padding: 10, marginRight: 15, borderWidth: 1, borderColor: COLORS.grey, borderRadius: 8, backgroundColor: '#1C1C1E' 
  },
  headerTitle: { color: COLORS.gold, fontSize: 22, fontFamily: 'Atkinson-Bold', letterSpacing: 1 },
  headerSub: { color: '#888', fontSize: 12, fontFamily: 'Atkinson-Regular' },

  // MENU
  menuContainer: { padding: 20, paddingTop: 30 },
  sectionLabel: { color: '#888', fontFamily: 'Atkinson-Bold', fontSize: 12, marginBottom: 15, letterSpacing: 1 },

  // CARD STYLES
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)'
  },
  iconCircle: {
     width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 215, 0, 0.1)',
     justifyContent: 'center', alignItems: 'center', marginRight: 20
  },
  textContainer: { flex: 1 },
  cardTitle: { color: COLORS.gold, fontFamily: 'Atkinson-Bold', fontSize: 18, marginBottom: 4 },
  cardSubtitle: { color: '#888', fontFamily: 'Atkinson-Regular', fontSize: 12 },
});