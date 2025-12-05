import React, { useState } from 'react';
import { View, Vibration, TouchableWithoutFeedback } from 'react-native';
import VoiceAssistant from './VoiceAssistant';
import { useRouter } from 'expo-router';

interface GlobalVoiceAssistantWrapperProps {
  children: React.ReactNode;
}

export default function GlobalVoiceAssistantWrapper({ children }: GlobalVoiceAssistantWrapperProps) {
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  const router = useRouter();

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
      router.push('/(tabs)');
    } else if (destination === 'NETRA') {
      // Close voice assistant and let the index page handle navigation
      router.push('/(tabs)');
      // Send event to trigger Netra mode
      setTimeout(() => {
        // This will be handled by the index page
      }, 100);
    } else if (destination === 'MUDRA') {
      router.push('/(tabs)');
    } else if (destination === 'MARGA') {
      router.push('/(tabs)');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTripleTap}>
      <View style={{ flex: 1 }}>
        {children}
        
        {/* Global Voice Assistant Overlay */}
        {showVoiceAssistant && (
          <VoiceAssistant
            onNavigate={handleVoiceNavigate}
            onClose={() => setShowVoiceAssistant(false)}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
