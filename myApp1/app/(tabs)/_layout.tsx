import { Tabs } from 'expo-router';
import React from 'react';
import { FontAwesome } from '@expo/vector-icons'; 

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
            backgroundColor: '#000000',
            height: 80,
            borderTopColor: '#FFD700',
            borderTopWidth: 2,
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
            fontSize: 16,
            // REMOVED: fontWeight: 'bold', 
            // ADDED:
            fontFamily: 'Atkinson-Bold', 
            marginBottom: 10,
        }
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesome size={28} name="eye" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesome size={28} name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}