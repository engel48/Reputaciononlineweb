# Reputación Online — App móvil (Flutter)

App Android + iOS que reúsa la **misma API Next.js** de la web (auth JWT) y la misma base Supabase.
Branding corporativo (cyan `#00E5FF` / navy `#0B1120`), splash y red neuronal animada.

## Requisitos
- **Flutter** 3.9+ (Dart 3.9+). `flutter doctor` sin errores.
- **Android:** **JDK 17** + Android SDK (Java 8 NO alcanza para Gradle 8.12 / AGP 8.9).
- **iOS:** una **Mac** con Xcode + cuenta Apple Developer (para firmar/publicar).

## Configuración de entorno
La base de la API se define en `lib/core/env.dart` (`apiBaseUrl`, default `https://reputaciononline.com.co`).
Override en build:
```
flutter build apk --release --dart-define=API_BASE_URL=https://tu-dominio.com
```
Recordá actualizar `Env.appVersion` y `pubspec.yaml` (`version: x.y.z+N`) en cada release
(se usa para el control de actualización forzada vía `/api/app/config`).

## Firebase Cloud Messaging (push) — opcional hasta activarlo
La app funciona sin Firebase (el push queda en no-op). Para activarlo:
1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com) (gratis).
2. Agregar app **Android** (`com.reputaciononline.reputacion_online`) → descargar
   `google-services.json` y copiarlo a `android/app/google-services.json`.
   - El plugin de Google Services se aplica **solo si ese archivo existe** (build seguro).
3. Agregar app **iOS** (mismo bundle id) → `GoogleService-Info.plist` a `ios/Runner/`.
4. **Backend:** en el entorno de Coolify, setear `FIREBASE_SERVICE_ACCOUNT` con el JSON de la
   service account (Configuración del proyecto → Cuentas de servicio → Generar clave privada).
   Sin esto, `/api/admin/app/push` responde 503 con mensaje claro.

## Firma de release (Android)
1. Generar el keystore (una vez):
   ```
   keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Copiar `android/key.properties.example` → `android/key.properties` y completar.
   (Ambos `*.jks` y `key.properties` están en `.gitignore`.)
3. Si no hay `key.properties`, el release se firma con la clave de debug (solo para pruebas).

## Builds
```
flutter pub get

# Android (APK de prueba)
flutter build apk --release

# Android (AAB para Google Play)
flutter build appbundle --release

# iOS (en Mac)
flutter build ipa --release
```

## Íconos y splash
Generados con `flutter_launcher_icons` y `flutter_native_splash` (config en `pubspec.yaml`):
```
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

## Verificación
```
flutter analyze   # 0 issues
flutter test      # verde
```
