import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Vibration } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// ✅ CORRECT RELATIVE PATHS BASED ON YOUR FOLDER STRUCTURE
import Netra from '../../components/Netra';
import Mudra from '../../components/Mudra';
import Marga from '../../components/Marga';

// 1. DEFINE TYPES
interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  isActive: boolean;
  onPress: () => void;
}

// 2. THE FEATURE CARD COMPONENT (UI)
const FeatureCard = ({ title, subtitle, description, icon, isActive, onPress }: FeatureCardProps) => (
  <TouchableOpacity 
    style={[styles.card, isActive && styles.activeCard]} 
    onPress={() => {
      Vibration.vibrate(10);
      onPress();
    }}
    activeOpacity={0.8}
  >
    <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
      <FontAwesome5 name={icon} size={32} color={isActive ? "#000000" : "#FFD700"} />
    </View>
    <View style={styles.textContainer}>
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, isActive && styles.activeText]}>{title}</Text>
        <Text style={[styles.cardSubtitle, isActive && styles.activeText]}>{subtitle}</Text>
      </View>
      <Text style={[styles.cardDescription, isActive && styles.activeText]}>
        {description}
      </Text>
    </View>
  </TouchableOpacity>
);

// 3. MAIN HOME SCREEN
export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false); // Controls if we show the camera or the menu

  // --- LOGIC: SWITCHING COMPONENTS ---
  // If we are scanning, show the specific component instead of the menu
  if (isScanning) {
    if (selectedMode === 'NETRA') return <Netra onBack={() => setIsScanning(false)} />;
    if (selectedMode === 'MUDRA') return <Mudra onBack={() => setIsScanning(false)} />;
    if (selectedMode === 'MARGA') return <Marga onBack={() => setIsScanning(false)} />;
  }

  // --- LOGIC: START BUTTON ---
  const handleStart = () => {
    Vibration.vibrate(20);
    if (!selectedMode) {
      alert("Please select a mode first!");
      return;
    }
    // This flips the switch to hide the menu and show the component
    setIsScanning(true); 
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.appName}>DIVYA<Text style={styles.appNameHighlight}>DRISHTI</Text></Text>
        <Text style={styles.tagline}>AI Vision Assistant</Text>
      </View>

      <Text style={styles.sectionTitle}>Select Assistance Mode</Text>

      {/* GRID OF BOXES */}
      <View style={styles.grid}>
        <FeatureCard 
          title="NETRA" subtitle="(Vision)"
          description="Semantic Depth Detection. Identifies objects and judges distance."
          icon="eye"
          isActive={selectedMode === 'NETRA'}
          onPress={() => setSelectedMode('NETRA')}
        />
        <FeatureCard 
          title="MUDRA" subtitle="(Finance)"
          description="Currency Assistant. Scans notes and calculates total value."
          icon="rupee-sign"
          isActive={selectedMode === 'MUDRA'}
          onPress={() => setSelectedMode('MUDRA')}
        />
        <FeatureCard 
          title="MARGA" subtitle="(Navigation)"
          description="Indoor Guide. Marker-based navigation for washrooms and exits."
          icon="route"
          isActive={selectedMode === 'MARGA'}
          onPress={() => setSelectedMode('MARGA')}
        />
      </View>

      {/* START BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.startButton, !selectedMode && styles.disabledButton]}
          onPress={handleStart}
          disabled={!selectedMode}
        >
          <Text style={styles.startButtonText}>
            {selectedMode ? `ACTIVATE ${selectedMode}` : "SELECT A MODE"}
          </Text>
          <MaterialCommunityIcons name="camera-iris" size={28} color="#000" style={{marginLeft: 10}} />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  contentContainer: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 30 },
  appName: { fontSize: 42, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  appNameHighlight: { color: '#FFD700' },
  tagline: { fontSize: 18, color: '#8E8E93', fontWeight: '500', marginTop: 5, letterSpacing: 1 },
  sectionTitle: { fontSize: 14, color: '#8E8E93', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  grid: { gap: 20, marginBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)', padding: 20, alignItems: 'center' },
  activeCard: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  iconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  activeIconContainer: { backgroundColor: '#FFFFFF' },
  textContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginRight: 8 },
  cardSubtitle: { fontSize: 16, color: '#8E8E93', fontWeight: '600' },
  cardDescription: { fontSize: 15, color: '#CCCCCC', lineHeight: 22 },
  activeText: { color: '#000000' },
  footer: { marginTop: 10 },
  startButton: { backgroundColor: '#FFD700', height: 70, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  disabledButton: { backgroundColor: '#333333' },
  startButtonText: { fontSize: 20, fontWeight: '900', color: '#000000', textTransform: 'uppercase', letterSpacing: 1 },
});