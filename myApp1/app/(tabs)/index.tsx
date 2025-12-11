import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Vibration, TouchableWithoutFeedback, StatusBar } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ✅ CORRECT RELATIVE PATHS
import Netra from '../../components/Netra';
import Mudra from '../../components/Mudra';
import Marga from '../../components/Marga';
import VoiceAssistant from '../../components/VoiceAssistant';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/designSystem';

// 1. DEFINE TYPES
interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  isActive: boolean;
  onPress: () => void;
}

// 2. THE FEATURE CARD COMPONENT (UI) - Food App Grid Style
const FeatureCard = ({ title, subtitle, description, icon, isActive, onPress }: FeatureCardProps) => (
  <TouchableOpacity 
    style={[styles.gridCard, isActive && styles.activeGridCard]} 
    onPress={() => {
      Vibration.vibrate(10);
      onPress();
    }}
    activeOpacity={0.85}
  >
    <View style={[styles.gridIconContainer, isActive && styles.activeGridIconContainer]}>
      <FontAwesome5 name={icon} size={36} color={isActive ? COLORS.background : COLORS.primary} />
    </View>
    <Text style={[styles.gridTitle, isActive && styles.activeGridTitle]} numberOfLines={1}>
      {title}
    </Text>
    <Text style={[styles.gridSubtitle, isActive && styles.activeGridSubtitle]} numberOfLines={2}>
      {subtitle}
    </Text>
    {isActive && (
      <View style={styles.checkmark}>
        <FontAwesome5 name="check-circle" size={20} color={COLORS.primary} solid />
      </View>
    )}
  </TouchableOpacity>
);

// 3. MAIN HOME SCREEN
export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false); 
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // --- TRIPLE TAP DETECTION ---
  const handleTripleTap = () => {
    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    if (newTapCount === 3) {
      Vibration.vibrate([0, 50, 100, 50]);
      setShowVoiceAssistant(true);
      setTapCount(0);
    } else {
      const timeout = setTimeout(() => {
        setTapCount(0);
      }, 500);
      setTapTimeout(timeout);
    }
  };

  // --- VOICE ASSISTANT NAVIGATION ---
  const handleVoiceNavigate = (destination: string) => {
    if (destination.includes('NETRA')) setSelectedMode('NETRA');
    if (destination.includes('MUDRA')) setSelectedMode('MUDRA');
    if (destination.includes('MARGA')) setSelectedMode('MARGA');
    
    setShowVoiceAssistant(false);
    setIsScanning(true);
  };

  // --- LOGIC: SWITCHING COMPONENTS ---
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
    setIsScanning(true); 
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <TouchableWithoutFeedback onPress={handleTripleTap}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          
          {/* HEADER WITH PROMO BANNER */}
          <View style={styles.header}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.menuButton}>
                <FontAwesome5 name="bars" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.appName}>DivyaDrishti</Text>
              <TouchableOpacity style={styles.notificationButton}>
                <FontAwesome5 name="bell" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* PROMO BANNER */}
            <LinearGradient
              colors={[COLORS.primary, '#C4FF0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoBanner}
            >
              <View style={styles.promoContent}>
                <View style={styles.promoText}>
                  <Text style={styles.promoTitle}>AI Vision Assistant</Text>
                  <Text style={styles.promoSubtitle}>Select your accessibility mode</Text>
                </View>
                <View style={styles.promoIcon}>
                  <FontAwesome5 name="eye" size={48} color={COLORS.background} />
                </View>
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.sectionTitle}>ASSISTANCE MODES</Text>

          {/* 2x2 GRID OF CARDS */}
          <View style={styles.gridContainer}>
            <FeatureCard 
              title="NETRA" 
              subtitle="Vision Detection"
              description="Object & Distance"
              icon="eye"
              isActive={selectedMode === 'NETRA'}
              onPress={() => setSelectedMode('NETRA')}
            />
            <FeatureCard 
              title="MUDRA" 
              subtitle="Currency Reader"
              description="Note Scanner"
              icon="rupee-sign"
              isActive={selectedMode === 'MUDRA'}
              onPress={() => setSelectedMode('MUDRA')}
            />
            <FeatureCard 
              title="MARGA" 
              subtitle="Navigation"
              description="Indoor Guide"
              icon="route"
              isActive={selectedMode === 'MARGA'}
              onPress={() => setSelectedMode('MARGA')}
            />
            <FeatureCard 
              title="VOICE" 
              subtitle="Assistant"
              description="Triple Tap"
              icon="microphone-alt"
              isActive={showVoiceAssistant}
              onPress={() => setShowVoiceAssistant(true)}
            />
          </View>

          {/* START BUTTON */}
          {selectedMode && (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStart}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[COLORS.primary, '#C4FF0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.startButtonText}>Start {selectedMode}</Text>
                <FontAwesome5 name="arrow-right" size={24} color={COLORS.background} />
              </LinearGradient>
            </TouchableOpacity>
          )}

        </ScrollView>
      </TouchableWithoutFeedback>

      {/* VOICE ASSISTANT OVERLAY */}
      {showVoiceAssistant && (
        <VoiceAssistant
          onNavigate={handleVoiceNavigate}
          onClose={() => setShowVoiceAssistant(false)}
        />
      )}
    </View>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  contentContainer: { 
    paddingBottom: 120,
    flexGrow: 1,
  },
  
  header: { 
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxxl,
    marginBottom: SPACING.xl,
  },
  
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  appName: { 
    fontSize: 22, 
    fontFamily: TYPOGRAPHY.fontBold, 
    color: COLORS.textPrimary, 
    letterSpacing: 0.5,
  },
  
  promoBanner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    ...SHADOWS.medium,
  },
  
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  promoText: {
    flex: 1,
  },
  
  promoTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: TYPOGRAPHY.fontBold,
    color: COLORS.background,
    marginBottom: SPACING.xs,
  },
  
  promoSubtitle: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontRegular,
    color: COLORS.background,
    opacity: 0.9,
  },
  
  promoIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.1)',
    borderRadius: RADIUS.full,
  },
  
  sectionTitle: { 
    fontSize: TYPOGRAPHY.small, 
    color: COLORS.textSecondary, 
    fontFamily: TYPOGRAPHY.fontBold, 
    textTransform: 'uppercase', 
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.lg,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
  },
  
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  
  gridCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 160,
    position: 'relative',
    ...SHADOWS.small,
  },
  
  activeGridCard: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  
  gridIconContainer: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  activeGridIconContainer: {
    backgroundColor: 'rgba(255, 214, 10, 0.2)',
  },
  
  gridTitle: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: TYPOGRAPHY.fontBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  
  activeGridTitle: {
    color: COLORS.primary,
  },
  
  gridSubtitle: {
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontRegular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeightNormal * TYPOGRAPHY.small,
  },
  
  activeGridSubtitle: {
    color: COLORS.textSecondary,
  },
  
  checkmark: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  
  startButton: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  
  gradientButton: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  
  startButtonText: { 
    fontSize: TYPOGRAPHY.h3, 
    fontFamily: TYPOGRAPHY.fontBold, 
    color: COLORS.background, 
    letterSpacing: 1,
  },
});