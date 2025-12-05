import { Tabs } from 'expo-router';
import React from 'react';
import { FontAwesome } from '@expo/vector-icons'; 

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hide top header
        tabBarStyle: {
            backgroundColor: '#000000', // Pitch Black
            height: 80,                 // Tall for accessibility
            borderTopColor: '#FFD700',  // Yellow border
            borderTopWidth: 2,
        },
        tabBarActiveTintColor: '#FFD700', // Yellow = Active
        tabBarInactiveTintColor: '#666666', // Grey = Inactive
        tabBarLabelStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 10,
        }
      }}>
      
      {/* TAB 1: HOME (Index) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // explicitly type 'color' as string to satisfy TypeScript
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesome size={28} name="eye" color={color} />
          ),
        }}
      />

      {/* TAB 2: PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // explicitly type 'color' as string here too
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesome size={28} name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}