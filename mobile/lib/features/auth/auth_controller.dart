import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/api/jwt.dart';
import '../../data/models/user.dart';
import '../onboarding/onboarding.dart';
import 'auth_repository.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState(this.status, [this.user]);
  final AuthStatus status;
  final AppUser? user;

  bool get isAuthenticated => status == AuthStatus.authenticated;
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(apiClientProvider), ref.read(tokenStorageProvider)),
);

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    _restore();
    return const AuthState(AuthStatus.unknown);
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  Future<void> _restore() async {
    final storage = ref.read(tokenStorageProvider);
    final token = await storage.readToken();
    if (token == null || token.isEmpty || Jwt.isExpired(token)) {
      await storage.clear();
      state = const AuthState(AuthStatus.unauthenticated);
      return;
    }
    final userMap = await storage.readUser();
    state = userMap != null
        ? AuthState(AuthStatus.authenticated, AppUser.fromJson(userMap))
        : const AuthState(AuthStatus.unauthenticated);
  }

  Future<AppUser> login(String email, String password) async {
    final user = await _repo.login(email, password);
    state = AuthState(AuthStatus.authenticated, user);
    return user;
  }

  Future<RegisterResult> register({
    required String name,
    required String email,
    required String password,
    String? company,
    String? phone,
    String plan = 'free',
    String profileType = 'personal',
  }) async {
    final res = await _repo.register(
      name: name,
      email: email,
      password: password,
      company: company,
      phone: phone,
      plan: plan,
      profileType: profileType,
    );
    state = AuthState(AuthStatus.authenticated, res.user);
    return res;
  }

  Future<void> logout() async {
    await _repo.logout();
    ref.read(onboardingSeenProvider.notifier).reset();
    state = const AuthState(AuthStatus.unauthenticated);
  }

  /// Llamado por el interceptor en 401: limpia sesión sin pegarle a la red.
  Future<void> forceLogout() async {
    await ref.read(tokenStorageProvider).clear();
    ref.read(onboardingSeenProvider.notifier).reset();
    state = const AuthState(AuthStatus.unauthenticated);
  }

  /// Refresca el usuario en estado (p.ej. tras cambiar créditos/plan) y lo persiste.
  Future<void> setUser(AppUser user) async {
    await ref.read(tokenStorageProvider).updateUser(user.toJson());
    state = AuthState(AuthStatus.authenticated, user);
  }
}
