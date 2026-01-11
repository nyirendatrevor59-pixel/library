import { Platform } from 'react-native';

// API configuration
export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? "http://10.0.2.2:5001"
    : "http://localhost:5001"
  : "";