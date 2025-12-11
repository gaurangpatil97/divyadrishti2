import React, { useState } from 'react';
import { View, Vibration, TouchableWithoutFeedback } from 'react-native';
import VoiceAssistant from './VoiceAssistant';
import { useRouter } from 'expo-router';
import { useNavigation } from '../contexts/NavigationContext';

interface GlobalVoiceAssistantWrapperProps {
  children: React.ReactNode;
}

export default function GlobalVoiceAssistantWrapper({ children }: GlobalVoiceAssistantWrapperProps) {
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  const router = useRouter();
  const { triggerNavigation } = useNavigation();

  // Triple tap detection
  const handleTripleTap = () => {
    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    if (newTapCount === 3) {
      // Triple tap detected!
      Vibration.vibrate([0, 50, 100, 50]);
      setShowVoiceAssistant(true);
      setTapCount(0);
    } else {
      // Reset after 500ms if no third tap
      const timeout = setTimeout(() => {
        setTapCount(0);
      }, 500);
      setTapTimeout(timeout);
    }
  };

  // Voice navigation handler
  const handleVoiceNavigate = (destination: string) => {
    setShowVoiceAssistant(false);
    
    // Navigate based on destination
    if (destination === 'HOME') {
      // Just go to home, no mode selection
      router.push('/(tabs)');
    } else {
      // For Netra, Mudra, Marga - navigate to home and trigger the mode
      router.push('/(tabs)');
      setTimeout(() => {
        triggerNavigation(destination);
      }, 100);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTripleTap}>
      <View style={{ flex: 1 }}>
        {children}
        
        {/* Global Voice Assistant Overlay */}
        {showVoiceAssistant && (
          <VoiceAssistant 
            onClose={() => setShowVoiceAssistant(false)}
            onNavigate={handleVoiceNavigate}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
