import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Tema Material 3 con la identidad de Reputación Online (cyan/navy, fuente Inter).
class AppTheme {
  AppTheme._();

  static const double radius = 16;

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.cyan,
      primary: AppColors.cyan,
      onPrimary: AppColors.navy,
      secondary: AppColors.accentNavy,
      brightness: Brightness.light,
      surface: AppColors.bgLight,
      error: AppColors.danger,
    );
    return _base(scheme, Brightness.light).copyWith(
      scaffoldBackgroundColor: AppColors.surfaceLight,
    );
  }

  static ThemeData get dark {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.cyan,
      primary: AppColors.cyan,
      onPrimary: AppColors.navy,
      secondary: AppColors.cyan,
      brightness: Brightness.dark,
      surface: AppColors.navyMedium,
      error: AppColors.danger,
    );
    return _base(scheme, Brightness.dark).copyWith(
      scaffoldBackgroundColor: AppColors.navy,
    );
  }

  static ThemeData _base(ColorScheme scheme, Brightness b) {
    final isDark = b == Brightness.dark;
    final textColor = isDark ? AppColors.textOnDark : AppColors.textOnLight;
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      brightness: b,
      fontFamily: 'Inter',
      textTheme: ThemeData(brightness: b)
          .textTheme
          .apply(fontFamily: 'Inter', bodyColor: textColor, displayColor: textColor),
      // AppBar de marca (navy + texto blanco) en TODAS las pantallas. El
      // dashboard pinta encima un gradiente como hero.
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.accentNavy,
        foregroundColor: Colors.white,
        iconTheme: IconThemeData(color: Colors.white),
        actionsIconTheme: IconThemeData(color: Colors.white),
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: isDark ? 0 : 5,
        shadowColor: AppColors.accentNavy.withValues(alpha: 0.16),
        surfaceTintColor: Colors.transparent,
        color: isDark ? AppColors.navyMedium : AppColors.bgLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: BorderSide(
            color: isDark
                ? AppColors.navyLight
                : AppColors.borderLight.withValues(alpha: 0.7),
          ),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.cyan,
          foregroundColor: AppColors.navy,
          elevation: 0,
          minimumSize: const Size.fromHeight(52),
          textStyle: const TextStyle(
              fontFamily: 'Inter', fontWeight: FontWeight.w600, fontSize: 15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.cyan,
          minimumSize: const Size.fromHeight(52),
          side: const BorderSide(color: AppColors.cyan),
          textStyle: const TextStyle(
              fontFamily: 'Inter', fontWeight: FontWeight.w600, fontSize: 15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? AppColors.navyLight : AppColors.surfaceLight,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? AppColors.navyLight : AppColors.borderLight,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? AppColors.navyLight : AppColors.borderLight,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.cyan, width: 1.5),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        side: BorderSide.none,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: isDark ? AppColors.navyMedium : AppColors.bgLight,
        indicatorColor: AppColors.cyan.withValues(alpha: 0.18),
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor),
        ),
        height: 64,
      ),
      dividerTheme: DividerThemeData(
        color: isDark ? AppColors.navyLight : AppColors.borderLight,
        thickness: 1,
      ),
      // Pestañas en blanco: viven sobre AppBars con gradiente de marca.
      tabBarTheme: const TabBarThemeData(
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white70,
        indicatorColor: Colors.white,
        dividerColor: Colors.transparent,
        labelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    );
  }
}
