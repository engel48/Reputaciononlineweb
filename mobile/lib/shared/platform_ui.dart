import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Iconografía / etiquetas / colores por red social (paridad con la web).
class PlatformUi {
  static String key(String p) {
    final v = p.toLowerCase();
    if (v == 'twitter') return 'x';
    return v;
  }

  static String label(String p) {
    switch (key(p)) {
      case 'x':
        return 'X';
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      case 'youtube':
        return 'YouTube';
      case 'news':
        return 'Noticias';
      default:
        return p.isEmpty ? '—' : p[0].toUpperCase() + p.substring(1);
    }
  }

  static IconData icon(String p) {
    switch (key(p)) {
      case 'x':
        return Icons.alternate_email;
      case 'facebook':
        return Icons.facebook;
      case 'instagram':
        return Icons.camera_alt_outlined;
      case 'youtube':
        return Icons.play_circle_outline;
      case 'news':
        return Icons.article_outlined;
      default:
        return Icons.public;
    }
  }

  static Color color(String p) {
    switch (key(p)) {
      case 'x':
        return const Color(0xFF1DA1F2);
      case 'facebook':
        return const Color(0xFF1877F2);
      case 'instagram':
        return const Color(0xFFE1306C);
      case 'youtube':
        return const Color(0xFFFF0000);
      case 'news':
        return AppColors.accentNavy;
      default:
        return AppColors.muted;
    }
  }
}
