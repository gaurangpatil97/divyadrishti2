import { Tabs } from 'expo-router';
import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING, SHADOWS } from '../../constants/designSystem';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          height: 90,
          borderTopWidth: 0,
          paddingBottom: 20,
          paddingTop: 10,
          position: 'absolute',
          borderTopColor: 'transparent',
        },
        tabBarActiveTintColor: COLORS.background,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <View style={styles.tabBarContainer}>
            <View style={styles.tabBarPill} />
          </View>
        ),
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={[
              styles.iconPill,
              focused && styles.iconPillActive
            ]}>
              <FontAwesome5 
                size={24} 
                name="home" 
                color={focused ? COLORS.background : COLORS.textSecondary}
                solid={focused}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={[
              styles.iconPill,
              focused && styles.iconPillActive
            ]}>
              <FontAwesome5 
                size={24} 
                name="user" 
                color={focused ? COLORS.background : COLORS.textSecondary}
                solid={focused}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabBarPill: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    height: 70,
    borderRadius: 35,
    ...SHADOWS.large,
  },
  iconPill: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPillActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.medium,
  },
});