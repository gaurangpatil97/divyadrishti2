import React from 'react';
import { StyleSheet, View } from 'react-native';

// ✅ IMPORT THE FILE DIRECTLY
import MargaMerged from './Marga(merged)';

export default function IndoorMarga() {
  return (
    <View style={styles.container}>
      {/* Rendering the merged code directly.
         Passing a dummy onBack function to satisfy the prop requirement.
         (The parent Marga Menu handles the actual back navigation in the header).
      */}
      <MargaMerged onBack={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});