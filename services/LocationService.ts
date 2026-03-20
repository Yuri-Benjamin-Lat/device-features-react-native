import * as Location from 'expo-location';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
}

export const LocationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<LocationResult> {
    const hasPermission = await this.requestPermission();

    if (!hasPermission) {
      throw new Error(
        'Location permission denied. Please enable location access in Settings to auto-fill your address.'
      );
    }

    let locationData: Location.LocationObject;
    try {
      locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch {
      throw new Error(
        'Unable to retrieve your location. Please check your GPS settings.'
      );
    }

    const { latitude, longitude } = locationData.coords;

    let address = 'Unknown location';
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const r = results[0];
        const parts: string[] = [];

        if (r.name) parts.push(r.name);
        if (r.street && r.street !== r.name) parts.push(r.street);
        if (r.city) parts.push(r.city);
        if (r.region) parts.push(r.region);
        if (r.country) parts.push(r.country);

        address = parts.filter(Boolean).join(', ') || 'Unknown location';
      }
    } catch {
      // Non-fatal: we have coords even if geocoding fails
      address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }

    return { latitude, longitude, address };
  },
};