import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/env.dart';
import '../../core/providers.dart';

/// Servicio de notificaciones push (FCM).
///
/// Es DEFENSIVO: si Firebase no está configurado todavía (faltan
/// `google-services.json` / `GoogleService-Info.plist`), `Firebase.initializeApp`
/// falla y todo se vuelve no-op silencioso — la app sigue funcionando sin push.
/// Una vez agregados los archivos de Firebase, se activa automáticamente.
class PushService {
  PushService(this.ref);
  final Ref ref;

  bool _initialized = false;
  String? _token;

  String get _platform {
    try {
      if (Platform.isIOS) return 'ios';
      if (Platform.isAndroid) return 'android';
    } catch (_) {}
    return 'android';
  }

  /// Inicializa Firebase + FCM y registra el dispositivo en el backend.
  /// Llamar tras un login exitoso (cuando ya hay token JWT).
  Future<void> registerForUser() async {
    try {
      if (!_initialized) {
        await Firebase.initializeApp();
        _initialized = true;
      }

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);

      _token = await messaging.getToken();
      if (_token == null || _token!.isEmpty) return;

      await _sendToken(_token!);

      // Re-registrar si FCM rota el token.
      messaging.onTokenRefresh.listen((t) {
        _token = t;
        _sendToken(t);
      });
    } catch (e) {
      // Firebase no configurado o sin permisos: ignorar (push deshabilitado).
      if (kDebugMode) {
        debugPrint('[push] no disponible (Firebase sin configurar?): $e');
      }
    }
  }

  Future<void> _sendToken(String token) async {
    try {
      await ref.read(apiClientProvider).post('/app/register-device', body: {
        'fcmToken': token,
        'platform': _platform,
        'appVersion': Env.appVersion,
      });
      // Ping de sesión para analíticas.
      await ref.read(apiClientProvider).post('/app/session', body: {
        'platform': _platform,
        'appVersion': Env.appVersion,
        'fcmToken': token,
      });
    } catch (_) {
      // Silencioso: no romper el flujo si el backend falla.
    }
  }
}

final pushServiceProvider = Provider<PushService>((ref) => PushService(ref));
