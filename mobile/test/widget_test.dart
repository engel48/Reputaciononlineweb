import 'package:flutter_test/flutter_test.dart';
import 'package:reputacion_online/data/api/jwt.dart';
import 'package:reputacion_online/data/models/app_config.dart';
import 'package:reputacion_online/data/models/user.dart';
import 'package:reputacion_online/features/admin/admin_providers.dart';

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

  group('AppConfigData', () {
    test('fromResponse mapea gate, flags y anuncios', () {
      final c = AppConfigData.fromResponse({
        'data': {
          'forceUpdate': true,
          'maintenanceMode': false,
          'maintenanceMessage': 'msg',
          'updateUrl': 'https://play.google.com/x',
          'latestVersion': '1.2.0',
          'featureFlags': {'beta_julia': true, 'off': false},
          'announcements': [
            {'title': 'Hola', 'body': 'Bienvenido', 'level': 'success'}
          ],
        }
      });
      expect(c.forceUpdate, isTrue);
      expect(c.maintenanceMode, isFalse);
      expect(c.flag('beta_julia'), isTrue);
      expect(c.flag('off'), isFalse);
      expect(c.flag('inexistente'), isFalse);
      expect(c.announcements.single.title, 'Hola');
    });

    test('ok no bloquea por defecto', () {
      expect(AppConfigData.ok.forceUpdate, isFalse);
      expect(AppConfigData.ok.maintenanceMode, isFalse);
    });
  });

  group('AdminAnalytics', () {
    test('fromResponse parsea dispositivos y sesiones', () {
      final a = AdminAnalytics.fromResponse({
        'data': {
          'devices': {'total': 10, 'android': 7, 'ios': 3, 'active7d': 5},
          'sessions': {'last7d': 20, 'last30d': 80},
        }
      });
      expect(a.devicesTotal, 10);
      expect(a.android, 7);
      expect(a.ios, 3);
      expect(a.sessions30d, 80);
    });
  });
}
