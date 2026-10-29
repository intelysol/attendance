# Intelysol HCM Mobile — Production Native Flutter Application

Native iOS and Android client for the **Intelysol Multi-Tenant Laravel HCM SaaS** platform.

## Architecture & Clean Code Design

The mobile codebase follows **Feature-First Clean Architecture**:

```
mobile_flutter/
├── android/app/src/main/AndroidManifest.xml (Location permissions configured)
├── ios/Runner/Info.plist (NSLocationWhenInUseUsageDescription)
├── lib/
│   ├── main.dart                      # App entry point, BLoC providers, dependency injection
│   ├── core/
│   │   ├── constants/api_endpoints.dart # Versioned REST endpoints (/api/v1/)
│   │   ├── network/api_client.dart      # Centralized Dio HTTP client with Bearer auth & retry
│   │   ├── services/
│   │   │   ├── secure_storage_service.dart # KeyStore / Keychain encryption
│   │   │   └── geolocation_service.dart    # High-accuracy GPS, geofence radius & Haversine
│   ├── features/
│   │   ├── auth/                      # Login, token session restoration, logout
│   │   ├── attendance/                # Mobile punch, branch geofencing, punch history & calendar
│   │   ├── leave/                     # Leave balance quotas, apply with attachment, cancel
│   │   ├── payslips/                  # Encrypted payslip viewer, ephemeral download token
│   │   └── profile/                   # Authorized employee identity & immutable fields
```

## Prerequisites & Native Build Instructions

### 1. Requirements
- Flutter SDK $\ge 3.16.0$ / Dart SDK $\ge 3.2.0$
- Android Studio / Android SDK 34 / JDK 17
- Xcode 15+ (for iOS build on macOS)

### 2. Configure Environment
Set your Laravel HCM backend base URL in `lib/core/constants/api_endpoints.dart`:
```dart
const String defaultApiBaseUrl = 'https://hcm-api.yourcompany.com/api/v1';
```

### 3. Install Dependencies
```bash
cd mobile_flutter
flutter pub get
```

### 4. Run Development Build
```bash
# Run on connected Android / iOS physical device or simulator
flutter run --debug
```

### 5. Build Production Android APK & App Bundle
```bash
# Build standalone release APK
flutter build apk --release

# Build Google Play App Bundle (AAB)
flutter build appbundle --release
```

### 6. Build Production iOS
```bash
flutter build ipa --release
```

## Security & Geofence Verification Invariant
1. The client **never** trusts client-supplied timestamps or client-declared attendance approval.
2. Coordinates $(lat, lon)$, accuracy $(m)$, device telemetry, and a unique UUID $v4$ idempotency key (`X-Idempotency-Key`) are transmitted over HTTPS with `Bearer <token>`.
3. The Laravel backend calculates the authoritative Haversine distance to the assigned branch geofence and decides whether to authorize or reject the punch.
