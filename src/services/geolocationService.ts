import { BranchLocation } from '../types/auth';

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  timestamp: number;
  distanceToBranchMeters: number;
  isWithinGeofence: boolean;
  accuracyAcceptable: boolean;
  source: 'DEVICE_GPS' | 'SIMULATED_PRESET';
}

export type GeolocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'ACCURACY_TOO_POOR'
  | 'UNSUPPORTED';

export interface GeolocationError {
  code: GeolocationErrorCode;
  message: string;
}

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate standard UUID v4 for idempotency
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Service to request device location or apply branch testing simulation
 */
export const geolocationService = {
  /**
   * Request real browser/device foreground GPS position
   */
  async getCurrentPosition(
    branch: BranchLocation,
    timeoutMs = 12000
  ): Promise<{ result?: LocationResult; error?: GeolocationError }> {
    if (!navigator.geolocation) {
      return {
        error: {
          code: 'UNSUPPORTED',
          message: 'GPS geolocation is not supported on this browser or platform.',
        },
      };
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          error: {
            code: 'TIMEOUT',
            message: 'Location request timed out. Please check your device GPS signal.',
          },
        });
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          const { latitude, longitude, accuracy } = pos.coords;
          const distance = calculateHaversineDistance(
            latitude,
            longitude,
            branch.latitude,
            branch.longitude
          );
          const isWithinGeofence = distance <= branch.geofenceRadiusMeters;
          const accuracyAcceptable = accuracy <= branch.requiredAccuracyMeters;

          resolve({
            result: {
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
              timestamp: pos.timestamp,
              distanceToBranchMeters: distance,
              isWithinGeofence,
              accuracyAcceptable,
              source: 'DEVICE_GPS',
            },
          });
        },
        (err) => {
          clearTimeout(timer);
          let code: GeolocationErrorCode = 'POSITION_UNAVAILABLE';
          let message = 'Unable to determine your current position.';

          if (err.code === err.PERMISSION_DENIED) {
            code = 'PERMISSION_DENIED';
            message = 'Location permission was denied. Branch verification requires location access.';
          } else if (err.code === err.TIMEOUT) {
            code = 'TIMEOUT';
            message = 'Location request timed out. Try refreshing or moving closer to a window.';
          }

          resolve({ error: { code, message } });
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs - 500,
          maximumAge: 5000,
        }
      );
    });
  },

  /**
   * Simulate realistic coordinates relative to assigned branch for QA and verification
   */
  simulatePosition(
    branch: BranchLocation,
    scenario: 'at_desk' | 'cafeteria' | 'outside_geofence' | 'poor_accuracy' | 'permission_denied'
  ): { result?: LocationResult; error?: GeolocationError } {
    if (scenario === 'permission_denied') {
      return {
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Location permission was denied by user or system policy.',
        },
      };
    }

    let lat = branch.latitude;
    let lon = branch.longitude;
    let accuracy = 12;

    switch (scenario) {
      case 'at_desk':
        // ~28 meters offset
        lat += 0.00018;
        lon += 0.00015;
        accuracy = 12;
        break;
      case 'cafeteria':
        // ~72 meters offset
        lat += 0.00045;
        lon += 0.00035;
        accuracy = 18;
        break;
      case 'outside_geofence':
        // ~480 meters away (outside 150m boundary)
        lat += 0.0035;
        lon += 0.0028;
        accuracy = 25;
        break;
      case 'poor_accuracy':
        // Inside coords but poor signal uncertainty (140m accuracy > 50m max allowed)
        lat += 0.00012;
        lon += 0.00010;
        accuracy = 145;
        break;
    }

    const distance = calculateHaversineDistance(lat, lon, branch.latitude, branch.longitude);
    const isWithinGeofence = distance <= branch.geofenceRadiusMeters;
    const accuracyAcceptable = accuracy <= branch.requiredAccuracyMeters;

    return {
      result: {
        latitude: lat,
        longitude: lon,
        accuracy,
        timestamp: Date.now(),
        distanceToBranchMeters: distance,
        isWithinGeofence,
        accuracyAcceptable,
        source: 'SIMULATED_PRESET',
      },
    };
  },
};
