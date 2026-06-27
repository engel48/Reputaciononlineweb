import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/env.dart';
import '../../core/providers.dart';
import '../../data/models/app_config.dart';

String _platformName() {
  if (kIsWeb) return 'web';
  try {
    if (Platform.isIOS) return 'ios';
    if (Platform.isAndroid) return 'android';
  } catch (_) {}
  return 'android';
}

/// Configuración remota de la app. Si el endpoint falla, devuelve `AppConfigData.ok`
/// para no bloquear nunca al usuario por un error de red.
final appConfigProvider = FutureProvider<AppConfigData>((ref) async {
  try {
    final res = await ref.read(apiClientProvider).get('/app/config', query: {
      'version': Env.appVersion,
      'platform': _platformName(),
    });
    return AppConfigData.fromResponse((res as Map).cast<String, dynamic>());
  } catch (_) {
    return AppConfigData.ok;
  }
});
