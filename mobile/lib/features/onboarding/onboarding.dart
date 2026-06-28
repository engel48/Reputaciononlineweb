import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/user.dart';
import '../auth/auth_controller.dart';

/// Respaldo local: ¿ya se mostró/saltó el onboarding en este dispositivo?
/// Sirve para no quedar en loop si el flag del backend no se pudo guardar.
final onboardingSeenProvider =
    NotifierProvider<OnboardingSeenController, bool>(
        OnboardingSeenController.new);

class OnboardingSeenController extends Notifier<bool> {
  @override
  bool build() {
    _load();
    return false;
  }

  Future<void> _load() async {
    state = await ref.read(tokenStorageProvider).readOnboardingSeen();
  }

  Future<void> markSeen() async {
    state = true;
    await ref.read(tokenStorageProvider).writeOnboardingSeen();
  }
}

/// Marca el onboarding como completado (flag del backend + respaldo local) y
/// refresca el usuario. Tras esto el router redirige solo a /home.
///
/// IMPORTANTE: capturamos todos los providers ANTES del primer `await`. Al
/// completar, el cambio de estado dispara la navegación y desmonta la pantalla;
/// usar `ref` después del await reventaría ("ref used after unmount").
Future<void> completeOnboarding(WidgetRef ref,
    {Map<String, dynamic> profile = const {}}) async {
  final seenCtrl = ref.read(onboardingSeenProvider.notifier);
  final authCtrl = ref.read(authControllerProvider.notifier);
  final api = ref.read(apiClientProvider);
  final user = ref.read(authControllerProvider).user;

  if (user != null) {
    try {
      final res = await api.put('/users', body: {
        'userId': user.id,
        'onboardingCompleted': true,
        ...profile,
      });
      final updated = AppUser.fromJson(
          ((res as Map)['user'] as Map).cast<String, dynamic>());
      await authCtrl.setUser(updated);
    } catch (_) {
      // Si falla el backend, el respaldo local de abajo evita el loop.
    }
  }
  await seenCtrl.markSeen();
}
