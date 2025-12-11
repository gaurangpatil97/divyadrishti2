import React, { useState } from 'react';
import { View, Vibration, TouchableWithoutFeedback, AppState } from 'react-native';
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

  // Voice navigation handler - directly navigate
  const handleVoiceNavigate = (destination: string) => {
    console.log('🌍 Global wrapper handleVoiceNavigate called with:', destination);
    setShowVoiceAssistant(false);
    
    // Force navigation to home first
    router.push('/(tabs)');
    
    // Then emit the navigation command via a global state manager
    // For now, we'll use a simple approach: store in global object
    if (typeof global !== 'undefined') {
      (global as any).pendingVoiceNavigation = destination;
      console.log('🌍 Set global.pendingVoiceNavigation to:', destination);
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
