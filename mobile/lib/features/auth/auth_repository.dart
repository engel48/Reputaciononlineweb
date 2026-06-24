import '../../data/api/api_client.dart';
import '../../data/api/token_storage.dart';
import '../../data/models/user.dart';

/// Resultado de un registro (puede requerir verificación de email).
class RegisterResult {
  RegisterResult({required this.user, required this.requiresEmailVerification});
  final AppUser user;
  final bool requiresEmailVerification;
}

/// Acceso a los endpoints de autenticación (/api/auth/*). Reúsa la auth JWT de la web.
class AuthRepository {
  AuthRepository(this._api, this._storage);
  final ApiClient _api;
  final TokenStorage _storage;

  Future<AppUser> login(String email, String password) async {
    final data = await _api.post('/auth/login', body: {
      'email': email.trim(),
      'password': password,
    });
    return _persist(data);
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
    final data = await _api.post('/auth/register', body: {
      'name': name.trim(),
      'email': email.trim(),
      'password': password,
      'company': company,
      'phone': phone,
      'plan': plan,
      'profileType': profileType,
    });
    final user = await _persist(data);
    return RegisterResult(
      user: user,
      requiresEmailVerification: data is Map && data['requiresEmailVerification'] == true,
    );
  }

  Future<void> requestPasswordReset(String email) =>
      _api.post('/auth/request-password-reset', body: {'email': email.trim()});

  Future<void> resetPassword(String token, String password) =>
      _api.post('/auth/reset-password', body: {'token': token, 'password': password});

  Future<void> verifyEmail({required String code, required String userId}) =>
      _api.post('/auth/verify-email', body: {'code': code, 'userId': userId});

  Future<void> resendVerification({required String userId, required String email}) =>
      _api.post('/auth/resend-verification', body: {'userId': userId, 'email': email});

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) =>
      _api.post('/auth/change-password', body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': newPassword,
      });

  Future<void> logout() async {
    try {
      await _api.get('/auth/logout');
    } catch (_) {}
    await _storage.clear();
  }

  /// Guarda token + user de una respuesta de login/register y devuelve el AppUser.
  Future<AppUser> _persist(dynamic data) async {
    if (data is! Map || data['token'] == null || data['user'] == null) {
      throw ApiException('Respuesta de autenticación inválida.');
    }
    final userMap = Map<String, dynamic>.from(data['user'] as Map);
    await _storage.save(data['token'] as String, userMap);
    return AppUser.fromJson(userMap);
  }
}
