import 'package:flutter_test/flutter_test.dart';
import 'package:reputacion_online/data/api/jwt.dart';
import 'package:reputacion_online/data/models/user.dart';

void main() {
  group('AppUser.fromJson', () {
    test('parsea campos básicos y deriva isAdmin/initials', () {
      final u = AppUser.fromJson({
        'id': 'abc',
        'email': 'leandro@example.com',
        'name': 'Leandro Pérez',
        'plan': 'pro',
        'credits': 1500,
        'role': 'admin',
      });
      expect(u.id, 'abc');
      expect(u.plan, 'pro');
      expect(u.credits, 1500);
      expect(u.isAdmin, isTrue);
      expect(u.initials, 'LP');
      expect(u.displayName, 'Leandro Pérez');
    });

    test('credits como string se castea a int', () {
      final u = AppUser.fromJson({'id': '1', 'email': 'a@b.com', 'credits': '42'});
      expect(u.credits, 42);
      expect(u.isAdmin, isFalse);
    });
  });

  group('Jwt', () {
    test('token inválido => expirado', () {
      expect(Jwt.isExpired('no-es-un-jwt'), isTrue);
      expect(Jwt.decode('no-es-un-jwt'), isNull);
    });
  });
}
