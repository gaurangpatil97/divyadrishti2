import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Vibration 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { SAMPLE_HOUSE_MAP } from '../../data/sample-house-map';
import { MapNode } from '../../types/indoor-navigation';

interface Props {
  onStartNavigation: (startId: string, endId: string) => void;
  onBack: () => void;
}

export default function LocationSelector({ onStartNavigation, onBack }: Props) {
  const [startLocation, setStartLocation] = useState<string | null>(null);
  const [endLocation, setEndLocation] = useState<string | null>(null);

  const handleLocationSelect = (nodeId: string, nodeName: string, isStart: boolean) => {
    Vibration.vibrate(10);
    
    if (isStart) {
      setStartLocation(nodeId);
      Speech.speak(`Start location set to ${nodeName}`);
    } else {
      setEndLocation(nodeId);
      Speech.speak(`Destination set to ${nodeName}`);
    }
  };

  const handleStartNavigation = () => {
    if (!startLocation || !endLocation) {
      Speech.speak('Please select both start and destination');
      Vibration.vibrate([0, 100, 50, 100]);
      return;
    }

    if (startLocation === endLocation) {
      Speech.speak('Start and destination cannot be the same');
      Vibration.vibrate([0, 100, 50, 100]);
      return;
    }

    Vibration.vibrate(50);
    Speech.speak('Starting navigation');
    onStartNavigation(startLocation, endLocation);
  };

  const renderLocationButton = (node: MapNode, isStart: boolean) => {
    const isSelected = isStart 
      ? startLocation === node.id 
      : endLocation === node.id;

    return (
      <TouchableOpacity
        key={`${isStart ? 'start' : 'end'}-${node.id}`}
        style={[styles.locationButton, isSelected && styles.selectedButton]}
        onPress={() => handleLocationSelect(node.id, node.displayName, isStart)}
        accessibilityLabel={`${isStart ? 'Start from' : 'Go to'} ${node.displayName}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.iconContainer}>
          <FontAwesome5 
            name={isStart ? 'map-marker-alt' : 'flag-checkered'} 
            size={24} 
            color={isSelected ? '#000' : '#FFD700'} 
          />
        </View>
        <Text style={[styles.locationText, isSelected && styles.selectedText]}>
          {node.displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onBack} 
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <FontAwesome5 name="chevron-left" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SELECT LOCATIONS</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Start Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            📍 START LOCATION
          </Text>
          <Text style={styles.sectionSubtitle}>
            Where are you starting from?
          </Text>
          <View style={styles.buttonGrid}>
            {SAMPLE_HOUSE_MAP.nodes.map(node => renderLocationButton(node, true))}
          </View>
        </View>

        {/* Destination Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            🏁 DESTINATION
          </Text>
          <Text style={styles.sectionSubtitle}>
            Where do you want to go?
          </Text>
          <View style={styles.buttonGrid}>
            {SAMPLE_HOUSE_MAP.nodes.map(node => renderLocationButton(node, false))}
          </View>
        </View>

        {/* Start Navigation Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            (!startLocation || !endLocation) && styles.startButtonDisabled
          ]}
          onPress={handleStartNavigation}
          disabled={!startLocation || !endLocation}
          accessibilityLabel="Start navigation"
          accessibilityRole="button"
          accessibilityState={{ disabled: !startLocation || !endLocation }}
        >
          <FontAwesome5 name="directions" size={28} color="#000" />
          <Text style={styles.startButtonText}>START NAVIGATION</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
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
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  buttonGrid: {
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedButton: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  selectedText: {
    color: '#000',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 30,
    gap: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  startButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  spacer: {
    height: 40,
  },
});
