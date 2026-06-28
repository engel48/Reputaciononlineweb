import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';

import '../../core/providers.dart';

/// Autenticación biométrica (huella / Face ID), defensiva: si algo falla
/// devuelve false en vez de tirar excepción.
class BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();

  Future<bool> isAvailable() async {
    try {
      if (!await _auth.isDeviceSupported()) return false;
      return await _auth.canCheckBiometrics;
    } catch (_) {
      return false;
    }
  }

  Future<bool> authenticate(String reason) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: false, // permite PIN/patrón del dispositivo como respaldo
          stickyAuth: true,
        ),
      );
    } catch (_) {
      return false;
    }
  }
}

final biometricServiceProvider =
    Provider<BiometricService>((ref) => BiometricService());

/// ¿El dispositivo soporta biometría? (para mostrar/ocultar el toggle)
final biometricAvailableProvider = FutureProvider<bool>(
    (ref) => ref.read(biometricServiceProvider).isAvailable());

/// ¿El usuario activó el desbloqueo biométrico? (persistido en el dispositivo)
final biometricEnabledProvider =
    NotifierProvider<BiometricEnabledController, bool>(
        BiometricEnabledController.new);

class BiometricEnabledController extends Notifier<bool> {
  @override
  bool build() {
    _load();
    return false;
  }

  Future<void> _load() async {
    state = await ref.read(tokenStorageProvider).readBiometricEnabled();
  }

  Future<void> set(bool value) async {
    state = value;
    await ref.read(tokenStorageProvider).writeBiometricEnabled(value);
  }
}

/// ¿La sesión actual ya fue desbloqueada? (en memoria; arranca bloqueada).
final biometricUnlockedProvider =
    NotifierProvider<BiometricUnlockedController, bool>(
        BiometricUnlockedController.new);

class BiometricUnlockedController extends Notifier<bool> {
  @override
  bool build() => false;
  void unlock() => state = true;
  void lock() => state = false;
}
