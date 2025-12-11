import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/designSystem';

interface Props {
  onBack: () => void;
}

export default function Mudra({ onBack }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* 1. HEADER ROW */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MUDRA MODE</Text>
      </View>

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Currency Assistant Active</Text>
        
        {/* Placeholder for Camera */}
        <View style={styles.placeholderBox}>
          <FontAwesome5 name="rupee-sign" size={50} color={COLORS.textSecondary} style={{marginBottom: 20}} />
          <Text style={styles.placeholderText}>[ Camera Feed Here ]</Text>
        </View>

        {/* Additional content to demonstrate scrolling */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How to use Mudra</Text>
          <Text style={styles.infoText}>1. Point camera at currency note</Text>
          <Text style={styles.infoText}>2. Wait for detection</Text>
          <Text style={styles.infoText}>3. Listen to voice feedback</Text>
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
  // HEADER STYLES
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xxxl, 
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.h2,
    fontFamily: TYPOGRAPHY.fontBold,
    letterSpacing: 1,
  },
  // SCROLLABLE CONTENT
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 120,
    flexGrow: 1,
  },
  subtitle: { 
    fontSize: TYPOGRAPHY.lg, 
    fontFamily: TYPOGRAPHY.fontMedium,
    color: COLORS.textPrimary, 
    marginBottom: SPACING.xxl,
    textAlign: 'center',
  },
  placeholderBox: {
    width: '100%', 
    height: 300, 
    borderWidth: 2, 
    borderColor: COLORS.border,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: SPACING.xxl, 
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  placeholderText: { 
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontRegular,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: TYPOGRAPHY.fontBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: TYPOGRAPHY.fontRegular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 24,
  },
});