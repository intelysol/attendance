import 'package:flutter/material.dart';
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
          secondary: const Color(0xFF0F172A),
          surface: Colors.white,
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          Theme.of(context).textTheme,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 1,
          iconTheme: IconThemeData(color: Color(0xFF0F172A)),
        ),
      ),
      home: const RootNavigationScaffold(),
    );
  }
}

class RootNavigationScaffold extends StatefulWidget {
  const RootNavigationScaffold({super.key});

  @override
  State<RootNavigationScaffold> createState() => _RootNavigationScaffoldState();
}

class _RootNavigationScaffoldState extends State<RootNavigationScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          Center(child: Text("Home Dashboard")),
          Center(child: Text("Attendance & GPS Check-In")),
          Center(child: Text("Leave Management")),
          Center(child: Text("Payslips Vault")),
          Center(child: Text("Employee Profile")),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.fingerprint), label: 'Attendance'),
          NavigationDestination(icon: Icon(Icons.event_note_outlined), label: 'Leave'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Payslips'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}
