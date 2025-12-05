import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface Props {
  onBack: () => void;
}

export default function Marga({ onBack }: Props) {
  return (
    <View style={styles.container}>
      
      {/* 1. HEADER ROW */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MARGA MODE</Text>
      </View>

      {/* 2. MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>Indoor Navigation Active</Text>
        
        {/* Placeholder Box */}
        <View style={styles.placeholderBox}>
          <FontAwesome5 name="route" size={50} color="#333" style={{marginBottom: 20}} />
          <Text style={styles.placeholderText}>[ Pathfinding Module Loading... ]</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // HEADER STYLES
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60, 
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 10,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // BODY STYLES
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subtitle: { fontSize: 18, color: '#FFFFFF', marginBottom: 40 },
  placeholderBox: {
    width: '100%', height: 300, borderWidth: 2, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderRadius: 12,
  },
  placeholderText: { color: '#666' },
});