import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImageResult {
  uri: string;
}

export const CameraService = {
  async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device Settings to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  },

  async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library access in your device Settings to pick photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  },

  async takePhoto(): Promise<ImageResult | null> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return { uri: result.assets[0].uri };
  },

  async pickFromGallery(): Promise<ImageResult | null> {
    const hasPermission = await this.requestMediaLibraryPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return { uri: result.assets[0].uri };
  },
};