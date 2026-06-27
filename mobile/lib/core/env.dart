/// Configuración de entorno de la app.
///
/// El backend es la MISMA API Next.js de la web (se reúsa toda la lógica + auth JWT).
/// Override en build: `--dart-define=API_BASE_URL=https://...`
class Env {
  /// Base del backend (sin `/api`). Los endpoints se arman como `$apiBaseUrl/api/...`.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://reputaciononline.com.co',
  );

  /// URL scheme para deep-links (OAuth de redes y retorno de pago Wompi).
  static const String deepLinkScheme = 'reputaciononline';

  static const String appName = 'Reputación Online';

  /// Versión actual de la app (debe coincidir con pubspec.yaml `version`).
  /// Se envía a `/api/app/config` para el control de actualización forzada.
  static const String appVersion = '1.0.0';
}
