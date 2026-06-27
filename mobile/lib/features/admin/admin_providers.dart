import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';

/// Analíticas de la app (/api/admin/app/analytics).
class AdminAnalytics {
  AdminAnalytics({
    required this.devicesTotal,
    required this.android,
    required this.ios,
    required this.active7d,
    required this.sessions7d,
    required this.sessions30d,
  });

  final int devicesTotal, android, ios, active7d, sessions7d, sessions30d;

  factory AdminAnalytics.fromResponse(Map<String, dynamic> res) {
    final d = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
    final dev = (d['devices'] as Map?)?.cast<String, dynamic>() ?? {};
    final ses = (d['sessions'] as Map?)?.cast<String, dynamic>() ?? {};
    int n(dynamic v) => (v as num?)?.toInt() ?? 0;
    return AdminAnalytics(
      devicesTotal: n(dev['total']),
      android: n(dev['android']),
      ios: n(dev['ios']),
      active7d: n(dev['active7d']),
      sessions7d: n(ses['last7d']),
      sessions30d: n(ses['last30d']),
    );
  }
}

/// Config remota (vista admin, snake_case crudo de /api/admin/app/config).
class AdminAppConfig {
  AdminAppConfig({
    required this.minSupportedVersion,
    required this.latestVersion,
    required this.forceUpdate,
    required this.maintenanceMode,
    required this.maintenanceMessage,
    required this.updateUrlAndroid,
    required this.updateUrlIos,
  });

  String minSupportedVersion;
  String latestVersion;
  bool forceUpdate;
  bool maintenanceMode;
  String maintenanceMessage;
  String updateUrlAndroid;
  String updateUrlIos;

  factory AdminAppConfig.fromResponse(Map<String, dynamic> res) {
    final d = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
    return AdminAppConfig(
      minSupportedVersion: (d['min_supported_version'] ?? '1.0.0').toString(),
      latestVersion: (d['latest_version'] ?? '1.0.0').toString(),
      forceUpdate: d['force_update'] == true,
      maintenanceMode: d['maintenance_mode'] == true,
      maintenanceMessage: (d['maintenance_message'] ?? '').toString(),
      updateUrlAndroid: (d['update_url_android'] ?? '').toString(),
      updateUrlIos: (d['update_url_ios'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toUpdate() => {
        'min_supported_version': minSupportedVersion,
        'latest_version': latestVersion,
        'force_update': forceUpdate,
        'maintenance_mode': maintenanceMode,
        'maintenance_message': maintenanceMessage,
        'update_url_android': updateUrlAndroid,
        'update_url_ios': updateUrlIos,
      };
}

final adminAnalyticsProvider = FutureProvider.autoDispose<AdminAnalytics>((ref) async {
  final res = await ref.read(apiClientProvider).get('/admin/app/analytics');
  return AdminAnalytics.fromResponse((res as Map).cast<String, dynamic>());
});

final adminConfigProvider = FutureProvider.autoDispose<AdminAppConfig>((ref) async {
  final res = await ref.read(apiClientProvider).get('/admin/app/config');
  return AdminAppConfig.fromResponse((res as Map).cast<String, dynamic>());
});

class AdminAppActions {
  AdminAppActions(this.ref);
  final Ref ref;

  Future<void> saveConfig(AdminAppConfig cfg) async {
    await ref.read(apiClientProvider).post('/admin/app/config', body: cfg.toUpdate());
    ref.invalidate(adminConfigProvider);
  }

  /// Devuelve (sent, failed, total).
  Future<(int, int, int)> sendPush({
    required String title,
    required String body,
    required String segment,
    String? plan,
    String? platform,
  }) async {
    final payload = <String, dynamic>{'title': title, 'body': body, 'segment': segment};
    if (segment == 'plan' && plan != null) payload['plan'] = plan;
    if (segment == 'platform' && platform != null) payload['platform'] = platform;
    final res = await ref.read(apiClientProvider).post('/admin/app/push', body: payload);
    final d = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
    int n(dynamic v) => (v as num?)?.toInt() ?? 0;
    return (n(d['sent']), n(d['failed']), n(d['total']));
  }
}

final adminAppActionsProvider = Provider((ref) => AdminAppActions(ref));
