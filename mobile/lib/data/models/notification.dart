/// Una notificación del usuario (shape de /api/notifications).
class AppNotification {
  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.read,
    required this.priority,
    this.timestamp,
    this.actionUrl,
    this.source,
  });

  final String id;
  final String type; // success | warning | error | info | mention | crisis | system…
  final String title;
  final String message;
  final bool read;
  final String priority; // low | normal | high
  final DateTime? timestamp;
  final String? actionUrl;
  final String? source;

  static bool _toBool(dynamic v) => v == true || v == 'true' || v == 1;

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: '${j['id']}',
        type: '${j['type'] ?? 'info'}',
        title: '${j['title'] ?? ''}',
        message: '${j['message'] ?? ''}',
        read: _toBool(j['read']),
        priority: '${j['priority'] ?? 'normal'}',
        timestamp: DateTime.tryParse('${j['timestamp'] ?? ''}')?.toLocal(),
        actionUrl: j['actionUrl'] as String?,
        source: j['source'] as String?,
      );
}

/// Respuesta completa de /api/notifications: lista + contador de no leídas.
class NotificationsData {
  NotificationsData({required this.items, required this.unreadCount});
  final List<AppNotification> items;
  final int unreadCount;

  factory NotificationsData.fromResponse(Map<String, dynamic> res) {
    final list = (res['notifications'] as List?) ?? const [];
    return NotificationsData(
      items: list
          .map((e) => AppNotification.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
      unreadCount: (res['unreadCount'] as num?)?.toInt() ?? 0,
    );
  }
}
