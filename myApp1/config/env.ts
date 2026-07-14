import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];

export const BACKEND_IP = debuggerHost || '10.0.57.99'; // fallback if hostUri isn't available
