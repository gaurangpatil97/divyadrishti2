import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Vibration, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/designSystem';

// ✅ IMPORT SUB-COMPONENTS
import IndoorMarga from './IndoorMarga';
import OutdoorMarga from './OutdoorMarga';

interface Props {
  onBack: () => void;
}

// --- LOCAL COMPONENT: THE BIG CARD ---
const MargaCard = ({ 
  title, 
  subtitle, 
  icon, 
  isActive,
  onPress 
}: { 
  title: string;
  subtitle: string;
  icon: any;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity 
    style={[styles.card, isActive && styles.activeCard]} 
    onPress={() => { Vibration.vibrate(10); onPress(); }}
    activeOpacity={0.85}
  >
    <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
      <FontAwesome5 name={icon} size={40} color={isActive ? COLORS.background : COLORS.primary} />
    </View>
    <Text style={[styles.cardTitle, isActive && styles.activeCardTitle]}>{title}</Text>
    <Text style={[styles.cardSubtitle, isActive && styles.activeCardSubtitle]}>{subtitle}</Text>
    {isActive && (
      <View style={styles.checkmark}>
        <FontAwesome5 name="check-circle" size={20} color={COLORS.primary} solid />
      </View>
    )}
  </TouchableOpacity>
);

// --- MAIN COMPONENT ---
export default function Marga({ onBack }: Props) {
  const [subMode, setSubMode] = useState<'INDOOR' | 'OUTDOOR' | null>(null);

  // 1. RENDER INDOOR MODE
  if (subMode === 'INDOOR') {
    return <IndoorMarga onBack={() => setSubMode(null)} />;
  }

  // 2. RENDER OUTDOOR MODE
  if (subMode === 'OUTDOOR') {
    return <OutdoorMarga onBack={() => setSubMode(null)} />;
  }

  // 3. RENDER MENU (DEFAULT)
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <FontAwesome5 name="chevron-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.appName}>MARGA</Text>
            <View style={styles.placeholder} />
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
                <Text style={styles.promoTitle}>Navigation Assistant</Text>
                <Text style={styles.promoSubtitle}>Choose your navigation mode</Text>
              </View>
              <View style={styles.promoIcon}>
                <FontAwesome5 name="route" size={48} color={COLORS.background} />
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>NAVIGATION MODES</Text>

        {/* 2x1 GRID OF CARDS */}
        <View style={styles.gridContainer}>
          {/* INDOOR CARD */}
          <MargaCard 
            title="INDOOR" 
            subtitle="Step & Compass"
            icon="compass"
            isActive={false}
            onPress={() => setSubMode('INDOOR')}
          />

          {/* OUTDOOR CARD */}
          <MargaCard 
            title="OUTDOOR" 
            subtitle="GPS Tracking"
            icon="map-marked-alt"
            isActive={false}
            onPress={() => setSubMode('OUTDOOR')}
          />
        </View>

        {/* FEATURES LIST */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <FontAwesome5 name="directions" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>Turn-by-turn directions</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <FontAwesome5 name="microphone" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>Voice guidance</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <FontAwesome5 name="walking" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>Step counting</Text>
          </View>
        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  menuContainer: { 
    paddingBottom: 120,
    flexGrow: 1,
  },
  
  // HEADER
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
  
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholder: {
    width: 44,
    height: 44,
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
  
  card: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 180,
    position: 'relative',
    ...SHADOWS.small,
  },
  
  activeCard: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  activeIconContainer: {
    backgroundColor: COLORS.primary,
  },
  
  cardTitle: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: TYPOGRAPHY.fontBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  
  activeCardTitle: {
    color: COLORS.primary,
  },
  
  cardSubtitle: {
    fontSize: TYPOGRAPHY.small,
    fontFamily: TYPOGRAPHY.fontRegular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeightNormal * TYPOGRAPHY.small,
  },
  
  activeCardSubtitle: {
    color: COLORS.textSecondary,
  },
  
  checkmark: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },

  // FEATURES SECTION
  featuresSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },

  featuresTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: TYPOGRAPHY.fontBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    letterSpacing: 0.3,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },

  featureText: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontRegular,
    color: COLORS.textPrimary,
    flex: 1,
  },
});