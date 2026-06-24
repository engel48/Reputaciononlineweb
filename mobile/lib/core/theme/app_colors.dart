import 'package:flutter/material.dart';

/// Paleta corporativa de Reputación Online (idéntica a la web: tailwind.config.js / globals.css).
class AppColors {
  AppColors._();

  // Marca
  static const Color cyan = Color(0xFF00E5FF); // primario
  static const Color cyanHover = Color(0xFF00B8D4);
  static const Color cyan700 = Color(0xFF008BA3);

  static const Color navy = Color(0xFF0B1120); // secundario / fondo dark
  static const Color navyMedium = Color(0xFF151C2E);
  static const Color navyLight = Color(0xFF1F2840);
  static const Color accentNavy = Color(0xFF01257D); // acento botones/headers

  // Semánticos
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFECFDF5);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerLight = Color(0xFFFEF2F2);

  // Neutros
  static const Color textOnLight = Color(0xFF0B1120);
  static const Color textOnDark = Color(0xFFE2E8F0);
  static const Color muted = Color(0xFF94A3B8);
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color bgLight = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF8FAFC);

  /// Gradiente de marca (splash/hero).
  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [navy, accentNavy, cyan],
    stops: [0.0, 0.55, 1.0],
  );

  /// Color para un sentimiento.
  static Color sentiment(String? s) {
    switch (s) {
      case 'positive':
        return success;
      case 'negative':
        return danger;
      default:
        return muted;
    }
  }
}
