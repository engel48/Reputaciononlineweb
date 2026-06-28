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
Future<void> completeOnboarding(WidgetRef ref) async {
  await ref.read(onboardingSeenProvider.notifier).markSeen();
  final user = ref.read(authControllerProvider).user;
  if (user == null) return;
  try {
    final res = await ref.read(apiClientProvider).put('/users', body: {
      'userId': user.id,
      'onboardingCompleted': true,
    });
    final updated =
        AppUser.fromJson(((res as Map)['user'] as Map).cast<String, dynamic>());
    await ref.read(authControllerProvider.notifier).setUser(updated);
  } catch (_) {
    // Si falla el backend, el respaldo local ya evita el loop.
  }
}
