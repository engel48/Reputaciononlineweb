import 'dart:convert';

/// Utilidades mínimas para inspeccionar el JWT del lado del cliente (solo lectura del payload).
class Jwt {
  /// Decodifica el payload del JWT. Devuelve null si es inválido.
  static Map<String, dynamic>? decode(String token) {
    final parts = token.split('.');
    if (parts.length != 3) return null;
    try {
      var payload = parts[1].replaceAll('-', '+').replaceAll('_', '/');
      switch (payload.length % 4) {
        case 2:
          payload += '==';
          break;
        case 3:
          payload += '=';
          break;
      }
      return jsonDecode(utf8.decode(base64.decode(payload))) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// True si el token venció (o es inválido).
  static bool isExpired(String token) {
    final payload = decode(token);
    final exp = payload?['exp'];
    if (exp is! int) return true;
    final expiry = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
    return DateTime.now().isAfter(expiry);
  }
}
