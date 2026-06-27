/// Anuncio remoto mostrado en la app (banner).
class Announcement {
  Announcement({required this.title, required this.body, this.level = 'info'});
  final String title;
  final String body;
  final String level; // info | warning | success

  factory Announcement.fromJson(Map<String, dynamic> j) => Announcement(
        title: (j['title'] ?? '').toString(),
        body: (j['body'] ?? j['message'] ?? '').toString(),
        level: (j['level'] ?? 'info').toString(),
      );
}

/// Configuración remota de la app (app gate) — de /api/app/config.
class AppConfigData {
  AppConfigData({
    required this.forceUpdate,
    required this.updateAvailable,
    required this.maintenanceMode,
    required this.maintenanceMessage,
    required this.updateUrl,
    required this.latestVersion,
    required this.featureFlags,
    required this.announcements,
  });

  final bool forceUpdate;
  final bool updateAvailable;
  final bool maintenanceMode;
  final String maintenanceMessage;
  final String updateUrl;
  final String latestVersion;
  final Map<String, bool> featureFlags;
  final List<Announcement> announcements;

  bool flag(String key) => featureFlags[key] ?? false;

  factory AppConfigData.fromResponse(Map<String, dynamic> res) {
    final d = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
    return AppConfigData(
      forceUpdate: d['forceUpdate'] == true,
      updateAvailable: d['updateAvailable'] == true,
      maintenanceMode: d['maintenanceMode'] == true,
      maintenanceMessage: (d['maintenanceMessage'] ?? '').toString(),
      updateUrl: (d['updateUrl'] ?? '').toString(),
      latestVersion: (d['latestVersion'] ?? '').toString(),
      featureFlags: ((d['featureFlags'] as Map?) ?? const {})
          .map((k, v) => MapEntry(k.toString(), v == true)),
      announcements: ((d['announcements'] as List?) ?? const [])
          .map((e) => Announcement.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
    );
  }

  /// Config "todo OK" por defecto cuando el endpoint falla (nunca bloquear por error de red).
  static AppConfigData get ok => AppConfigData(
        forceUpdate: false,
        updateAvailable: false,
        maintenanceMode: false,
        maintenanceMessage: '',
        updateUrl: '',
        latestVersion: '',
        featureFlags: const {},
        announcements: const [],
      );
}
