import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers.dart';

/// Tema elegido por el usuario (claro/oscuro/sistema), persistido en el dispositivo.
final themeModeProvider =
    NotifierProvider<ThemeModeController, ThemeMode>(ThemeModeController.new);

class ThemeModeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    _load();
    return ThemeMode.system;
  }

  Future<void> _load() async {
    final saved = await ref.read(tokenStorageProvider).readThemeMode();
    if (saved != null) state = _parse(saved);
  }

  Future<void> set(ThemeMode mode) async {
    state = mode;
    await ref.read(tokenStorageProvider).writeThemeMode(mode.name);
  }

  ThemeMode _parse(String s) => ThemeMode.values.firstWhere(
        (m) => m.name == s,
        orElse: () => ThemeMode.system,
      );
}
