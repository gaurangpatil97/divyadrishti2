import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Vibration } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

// 1. DEFINE THE TYPES (Fixes the red errors)
interface ProfileOptionProps {
  icon: any; // Allows any icon name from FontAwesome
  label: string;
  isDestructive?: boolean;
  onPress?: () => void;
}

// 2. REUSABLE COMPONENT WITH TYPES APPLIED
const ProfileOption = ({ icon, label, isDestructive = false, onPress }: ProfileOptionProps) => (
  <TouchableOpacity 
    style={[
      styles.optionCard, 
      isDestructive && styles.destructiveCard 
    ]} 
    onPress={() => {
      Vibration.vibrate(10); // Haptic feedback
      if(onPress) onPress();
    }}
    activeOpacity={0.7}
  >
    <View style={[
      styles.iconContainer, 
      isDestructive && styles.destructiveIconContainer
    ]}>
      <FontAwesome name={icon} size={24} color={isDestructive ? "#FF3B30" : "#FFD700"} />
    </View>

    <Text style={[
      styles.optionText, 
      isDestructive && styles.destructiveText
    ]}>{label}</Text>

    <MaterialIcons name="chevron-right" size={28} color={isDestructive ? "#FF3B30" : "#666"} />
  </TouchableOpacity>
);

// 3. MAIN SCREEN
export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {/* User Icon */}
          <FontAwesome name="user" size={60} color="#000" />
        </View>
        <Text style={styles.name}>Gaurang Patil</Text>
        <Text style={styles.role}>Premium User • ID: 16010122306</Text>
      </View>

      {/* SECTION TITLE */}
      <Text style={styles.sectionTitle}>Account Settings</Text>

      {/* SETTINGS GRID */}
      <View style={styles.optionsWrapper}>
        <ProfileOption icon="phone" label="Emergency Contact" />
        <ProfileOption icon="volume-up" label="Voice & Sound" />
        <ProfileOption icon="eye" label="Display Preferences" />
      </View>

      {/* SPACER */}
      <View style={styles.spacer} />

      {/* LOGOUT BUTTON */}
      <ProfileOption 
        icon="sign-out" 
        label="Log Out" 
        isDestructive 
        onPress={() => console.log("Logout Pressed")} 
      />

      <Text style={styles.versionText}>DivyaDrishti v1.0.0 (Beta)</Text>

    </ScrollView>
  );
}

// 4. STYLES (Premium Gold & Black Theme)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // True Black
  },
  contentContainer: {
    padding: 24,
    paddingTop: 50,
  },

  // HEADER
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFD700', // Gold Background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFF', // White ring for 3D pop
  },
  name: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  role: {
    fontSize: 16,
    color: '#8E8E93', 
    fontWeight: '500',
  },

  // SECTIONS
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93', // iOS Gray
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  
  optionsWrapper: {
    gap: 16, // Space between cards
  },

  // CARD STYLE
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#1C1C1E', // Dark Card Grey
    borderRadius: 16,
    borderWidth: 1,           
    borderColor: 'rgba(255, 215, 0, 0.5)', // 50% Gold Border
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20, 
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold Tint
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // DESTRUCTIVE (LOGOUT)
  destructiveCard: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)', // Red Border
    marginTop: 10,
  },
  destructiveIconContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)', // Red Tint
  },
  destructiveText: {
    color: '#FF3B30', // Red Text
  },

  spacer: {
    height: 30,
  },
  versionText: {
    textAlign: 'center',
    color: '#444',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 10,
  },
});