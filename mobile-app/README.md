# Reputación Online - App Móvil Flutter

Esta carpeta contendrá la aplicación móvil Flutter de Reputación Online.

## 🏗️ Crear proyecto Flutter

```bash
cd mobile-app
flutter create --org com.reputaciononline reputacion_online_app
cd reputacion_online_app
```

## 📦 Dependencias Requeridas

Agregar en `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Networking y API
  dio: ^5.4.0                    # HTTP client
  retrofit: ^4.0.3               # REST client
  json_annotation: ^4.8.1        # JSON serialization

  # State Management
  riverpod: ^2.4.9
  flutter_riverpod: ^2.4.9

  # Autenticación y Seguridad
  flutter_secure_storage: ^9.0.0  # Almacenar tokens
  jwt_decoder: ^2.0.1              # Decodificar JWT

  # OAuth y Deep Linking
  uni_links: ^0.5.1                # Deep linking
  url_launcher: ^6.2.2             # Abrir URLs

  # UI Components
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  fl_chart: ^0.65.0

  # Utilidades
  intl: ^0.18.1
  shared_preferences: ^2.2.2

dev_dependencies:
  build_runner: ^2.4.7
  retrofit_generator: ^8.0.4
  json_serializable: ^6.7.1
```

## 🔐 Configuración de Autenticación

### API URL

Crear `lib/core/constants/api_constants.dart`:

```dart
class ApiConstants {
  // Cambiar por tu URL de producción
  static const String baseUrl = 'http://localhost:3000';

  // Endpoints
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String me = '/api/auth/me';
  static const String dashboardAnalytics = '/api/dashboard-analytics';
  static const String socialMediaConsolidated = '/api/social-media/consolidated';
}
```

### API Client con Bearer Token

Crear `lib/core/api/api_client.dart`:

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio dio;
  final storage = const FlutterSecureStorage();

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    // Interceptor para añadir Bearer token automáticamente
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Manejar token expirado (401)
        if (error.response?.statusCode == 401) {
          await storage.delete(key: 'auth_token');
          // Redirigir a login
          // Navigator.pushReplacementNamed(context, '/login');
        }
        return handler.next(error);
      },
    ));
  }

  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await dio.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );

    if (response.data['success'] && response.data['token'] != null) {
      // Guardar token en Secure Storage
      await storage.write(key: 'auth_token', value: response.data['token']);
    }

    return response.data;
  }

  // Register
  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    final response = await dio.post(
      ApiConstants.register,
      data: userData,
    );

    if (response.data['success'] && response.data['token'] != null) {
      await storage.write(key: 'auth_token', value: response.data['token']);
    }

    return response.data;
  }

  // Get current user
  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await dio.get(ApiConstants.me);
    return response.data;
  }

  // Logout
  Future<void> logout() async {
    await storage.delete(key: 'auth_token');
  }
}
```

## 📱 Estructura de Carpetas Recomendada

```
lib/
├── core/
│   ├── api/
│   │   ├── api_client.dart           # Dio con Bearer token
│   │   └── api_constants.dart        # URLs y endpoints
│   ├── models/
│   │   ├── user.dart
│   │   ├── social_media.dart
│   │   ├── analytics.dart
│   │   └── mention.dart
│   └── services/
│       ├── auth_service.dart
│       └── storage_service.dart
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── login_screen.dart
│   │   │   └── register_screen.dart
│   │   ├── controllers/
│   │   │   └── auth_controller.dart
│   │   └── widgets/
│   │       └── auth_form.dart
│   ├── dashboard/
│   │   ├── screens/
│   │   │   └── dashboard_screen.dart
│   │   ├── controllers/
│   │   │   └── dashboard_controller.dart
│   │   └── widgets/
│   │       ├── metrics_card.dart
│   │       └── sentiment_chart.dart
│   └── social_media/
│       ├── screens/
│       │   └── connections_screen.dart
│       └── controllers/
│           └── social_controller.dart
├── shared/
│   ├── widgets/
│   │   ├── loading_indicator.dart
│   │   └── error_widget.dart
│   └── theme/
│       └── app_theme.dart
└── main.dart
```

## 🔗 OAuth con Deep Linking

### Configuración Android

Editar `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTop"
    android:theme="@style/LaunchTheme">

    <!-- Deep link para OAuth callbacks -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="reputaciononline"
            android:host="oauth" />
    </intent-filter>
</activity>
```

### Configuración iOS

Editar `ios/Runner/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>reputaciononline</string>
        </array>
    </dict>
</array>
```

### Manejo de Deep Links en Flutter

```dart
import 'package:uni_links/uni_links.dart';

class OAuthService {
  StreamSubscription? _sub;

  void initDeepLinking(BuildContext context) {
    _sub = uriLinkStream.listen((Uri? uri) {
      if (uri != null && uri.scheme == 'reputaciononline') {
        if (uri.host == 'oauth' && uri.path == '/callback') {
          final code = uri.queryParameters['code'];
          final platform = uri.queryParameters['platform'];

          if (code != null && platform != null) {
            _handleOAuthCallback(code, platform);
          }
        }
      }
    });
  }

  Future<void> _handleOAuthCallback(String code, String platform) async {
    // Intercambiar código por token
    final response = await ApiClient().dio.post(
      '/api/auth/$platform',
      data: {'code': code},
    );

    // Mostrar resultado al usuario
  }

  void dispose() {
    _sub?.cancel();
  }
}
```

## 🚀 Flujo de Autenticación

1. **Login/Register**:
   ```dart
   final result = await ApiClient().login(email, password);
   // Token se guarda automáticamente en Secure Storage
   ```

2. **Requests Autenticadas**:
   ```dart
   final analytics = await ApiClient().dio.get('/api/dashboard-analytics');
   // Header Authorization: Bearer {token} se añade automáticamente
   ```

3. **Token Expirado**:
   - Interceptor detecta 401
   - Elimina token de Secure Storage
   - Redirige a pantalla de login

## 📊 Ejemplo de Uso

```dart
// lib/features/dashboard/screens/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final dashboardProvider = FutureProvider((ref) async {
  final response = await ApiClient().dio.get('/api/dashboard-analytics');
  return response.data['data'];
});

class DashboardScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analytics = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(title: Text('Dashboard')),
      body: analytics.when(
        data: (data) => ListView(
          children: [
            MetricsCard(
              title: 'Menciones Totales',
              value: data['mentions']['total'].toString(),
            ),
            SentimentChart(data: data['mentions']),
          ],
        ),
        loading: () => Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
```

## 🔧 Comandos de Desarrollo

```bash
# Correr app en modo desarrollo
flutter run

# Build para producción
flutter build apk --release      # Android
flutter build ios --release      # iOS

# Analizar código
flutter analyze

# Generar código (models, retrofit)
flutter pub run build_runner build --delete-conflicting-outputs
```

## 🌐 Configurar URL del Backend

Antes de correr la app, actualizar la URL en `lib/core/constants/api_constants.dart`:

```dart
// Desarrollo local
static const String baseUrl = 'http://localhost:3000';

// Producción
static const String baseUrl = 'https://tu-dominio.com';
```

## ✅ Checklist de Setup

- [ ] Crear proyecto Flutter
- [ ] Agregar dependencias en `pubspec.yaml`
- [ ] Configurar deep linking (Android + iOS)
- [ ] Crear ApiClient con Dio + Bearer token
- [ ] Crear pantallas de Login/Register
- [ ] Crear Dashboard screen
- [ ] Implementar OAuth handlers
- [ ] Testing en dispositivo físico
- [ ] Build de producción

---

**Siguiente paso**: `flutter create --org com.reputaciononline reputacion_online_app`
