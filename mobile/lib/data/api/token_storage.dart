import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Almacenamiento seguro del JWT y del usuario actual.
class TokenStorage {
  TokenStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _kToken = 'auth_token';
  static const _kUser = 'auth_user';
  static const _kTheme = 'theme_mode';

  // Cache en memoria del token: el interceptor lo lee en CADA request, y en
  // Android el almacén seguro (Keystore) es lento (en emulador, decenas de ms).
  // Leerlo una vez y cachearlo evita bloquear el hilo en cada llamada.
  String? _cachedToken;
  bool _tokenLoaded = false;

  Future<void> save(String token, Map<String, dynamic> user) async {
    // El cache en memoria cubre el uso inmediato (el login no espera al disco).
    _cachedToken = token;
    _tokenLoaded = true;
    // Persistencia en segundo plano: en Android el Keystore es lento (en
    // emulador, segundos) y NO debe bloquear el flujo de login. Si la app se
    // cierra antes de que termine, el usuario simplemente vuelve a loguearse.
    unawaited(_storage.write(key: _kToken, value: token));
    unawaited(_storage.write(key: _kUser, value: jsonEncode(user)));
  }

  Future<String?> readToken() async {
    if (_tokenLoaded) return _cachedToken;
    _cachedToken = await _storage.read(key: _kToken);
    _tokenLoaded = true;
    return _cachedToken;
  }

  Future<Map<String, dynamic>?> readUser() async {
    final raw = await _storage.read(key: _kUser);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> updateUser(Map<String, dynamic> user) =>
      _storage.write(key: _kUser, value: jsonEncode(user));

  /// Preferencia de tema del dispositivo (no se borra al cerrar sesión).
  Future<String?> readThemeMode() => _storage.read(key: _kTheme);
  Future<void> writeThemeMode(String value) =>
      _storage.write(key: _kTheme, value: value);

  Future<void> clear() async {
    _cachedToken = null;
    _tokenLoaded = true; // sin token, pero ya "cargado": readToken devuelve null sin tocar el almacén
    await _storage.delete(key: _kToken);
    await _storage.delete(key: _kUser);
  }
}
