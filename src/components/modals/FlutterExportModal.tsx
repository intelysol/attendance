import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, FolderTree, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const FLUTTER_FILES: { title: string; path: string; language: string; content: string }[] = [
  {
    title: 'pubspec.yaml',
    path: 'mobile_flutter/pubspec.yaml',
    language: 'yaml',
    content: `name: intelysol_hcm_mobile
description: "Intelysol HCM Mobile — Production Native Flutter App for Laravel HCM SaaS"
publish_to: 'none'
version: 1.4.0+14

environment:
  sdk: '>=3.2.0 <4.0.0'
  flutter: ">=3.16.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  dio: ^5.4.1
  flutter_secure_storage: ^9.0.0
  geolocator: ^11.0.0
  permission_handler: ^11.3.0
  google_fonts: ^6.1.0
  lucide_icons: ^0.257.0
  uuid: ^4.3.3
  intl: ^0.19.0`,
  },
  {
    title: 'main.dart',
    path: 'mobile_flutter/lib/main.dart',
    language: 'dart',
    content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const IntelysolHcmApp());
}

class IntelysolHcmApp extends StatelessWidget {
  const IntelysolHcmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Intelysol HCM Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD97706),
          primary: const Color(0xFFD97706),
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(),
      ),
      home: const RootNavigationScaffold(),
    );
  }
}`,
  },
  {
    title: 'geolocation_service.dart',
    path: 'mobile_flutter/lib/core/services/geolocation_service.dart',
    language: 'dart',
    content: `import 'dart:math';
import 'package:geolocator/geolocator.dart';

class MobileGeolocationService {
  static double calculateDistanceInMeters(
    double lat1, double lon1, double lat2, double lon2,
  ) {
    const double earthRadius = 6371000; // in meters
    final double dLat = (lat2 - lat1) * pi / 180.0;
    final double dLon = (lon2 - lon1) * pi / 180.0;
    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180.0) * cos(lat2 * pi / 180.0) * sin(dLon / 2) * sin(dLon / 2);
    return earthRadius * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  Future<Position> getCurrentPositionWithPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) throw Exception('Location services disabled.');
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }
}`,
  },
  {
    title: 'api_endpoints.dart',
    path: 'mobile_flutter/lib/core/constants/api_endpoints.dart',
    language: 'dart',
    content: `class ApiEndpoints {
  static const String defaultBaseUrl = 'https://hcm-api.example.com/api/v1';

  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String todayAttendance = '/attendance/today';
  static const String punch = '/attendance/punch';
  static const String attendanceHistory = '/attendance/history';
  static const String leaveBalances = '/leaves/balances';
  static const String applyLeave = '/leaves/apply';
  static const String payslips = '/payslips';
}`,
  },
  {
    title: 'Build Guide (README.md)',
    path: 'mobile_flutter/README.md',
    language: 'markdown',
    content: `# Build Native Android APK & iOS IPA

1. Navigate to directory:
   cd mobile_flutter

2. Install Dart/Flutter dependencies:
   flutter pub get

3. Run in Debug Mode on Emulator/Phone:
   flutter run

4. Build Standalone Release APK:
   flutter build apk --release

5. Build Google Play App Bundle (AAB):
   flutter build appbundle --release`,
  },
];

export const FlutterExportModal: React.FC = () => {
  const { closeModal, showToast } = useApp();
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const file = FLUTTER_FILES[activeFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    showToast('success', 'Copied to Clipboard', `Copied ${file.title}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Code2 size={20} className="text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Native Flutter Codebase &amp; Architecture
              </h3>
              <p className="text-[11px] text-slate-500">
                Generated in <code className="font-mono text-slate-700">/mobile_flutter/</code>
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Environment Architecture Notice */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 space-y-1 text-xs text-amber-950">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle size={15} className="text-amber-700 shrink-0" />
            <span>AI Studio Environment Disclosure:</span>
          </div>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            Google AI Studio web runtimes execute Node.js/Vite on port 3000 (no native Android SDK or Xcode toolchain). To fulfill production specifications without silently falling back to a plain web app, this workspace includes:
          </p>
          <ul className="text-[11px] list-disc list-inside space-y-0.5 text-amber-900 pt-1">
            <li>A pixel-accurate interactive mobile runtime testing all 16 HCM features.</li>
            <li>The full, compilable Flutter Dart source tree in <code className="font-mono font-semibold">/mobile_flutter/</code> ready for <code className="font-mono">flutter build apk</code>.</li>
          </ul>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          {FLUTTER_FILES.map((f, idx) => (
            <button
              key={f.path}
              onClick={() => setActiveFileIndex(idx)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                activeFileIndex === idx
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.title}
            </button>
          ))}
        </div>

        {/* Code Viewer Container */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner text-slate-200 text-xs">
          <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="font-mono text-[11px] text-amber-400 truncate">
              {file.path}
            </span>
            <button
              onClick={handleCopy}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed text-slate-300">
            {file.content}
          </pre>
        </div>

        {/* Terminal Run Instructions */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Terminal size={14} className="text-amber-600" />
            <span>Native Android APK Build Command</span>
          </div>
          <div className="bg-slate-900 text-amber-300 font-mono text-[11px] p-2 rounded-xl">
            cd mobile_flutter &amp;&amp; flutter pub get &amp;&amp; flutter build apk --release
          </div>
        </div>
      </div>
    </div>
  );
};
