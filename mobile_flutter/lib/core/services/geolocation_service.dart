import 'dart:math';
import 'package:geolocator/geolocator.dart';

class GeolocationResult {
  final double latitude;
  final double longitude;
  final double accuracy;
  final double distanceMeters;
  final bool isWithinGeofence;
  final bool isAccuracyValid;

  GeolocationResult({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    required this.distanceMeters,
    required this.isWithinGeofence,
    required this.isAccuracyValid,
  });
}

class MobileGeolocationService {
  /// Calculate great circle distance in meters using Haversine formula
  static double calculateDistanceInMeters(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadius = 6371000; // in meters
    final double dLat = _toRadians(lat2 - lat1);
    final double dLon = _toRadians(lon2 - lon1);

    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) * cos(_toRadians(lat2)) * sin(dLon / 2) * sin(dLon / 2);

    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }

  static double _toRadians(double degree) => degree * pi / 180.0;

  /// Request foreground location with permission handling
  Future<GeolocationResult> getBranchVerificationPosition({
    required double branchLat,
    required double branchLon,
    required double geofenceRadiusMeters,
    double maxAllowedAccuracyMeters = 50.0,
  }) async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('GPS Location services are disabled. Please enable GPS.');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permission denied. Branch geofence check requires access.');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception(
        'Location permissions are permanently denied. Please enable in Device Settings.',
      );
    }

    final Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
      timeLimit: const Duration(seconds: 12),
    );

    final double distance = calculateDistanceInMeters(
      position.latitude,
      position.longitude,
      branchLat,
      branchLon,
    );

    return GeolocationResult(
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      distanceMeters: distance,
      isWithinGeofence: distance <= geofenceRadiusMeters,
      isAccuracyValid: position.accuracy <= maxAllowedAccuracyMeters,
    );
  }
}
