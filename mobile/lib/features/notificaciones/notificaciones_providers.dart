import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/notification.dart';

/// Notificaciones del usuario (/api/notifications): lista + no leídas.
final notificationsProvider =
    FutureProvider.autoDispose<NotificationsData>((ref) async {
  final res = await ref.read(apiClientProvider).get('/notifications');
  return NotificationsData.fromResponse((res as Map).cast<String, dynamic>());
});

/// Acciones sobre notificaciones; tras cada acción refresca la lista (y el badge).
final notificationsActionsProvider =
    Provider<NotificationsActions>((ref) => NotificationsActions(ref));

class NotificationsActions {
  NotificationsActions(this._ref);
  final Ref _ref;

  Future<void> markRead(String id) async {
    await _ref.read(apiClientProvider).post('/notifications', body: {
      'action': 'markRead',
      'id': id,
    });
    _ref.invalidate(notificationsProvider);
  }

  Future<void> markAllRead() async {
    await _ref.read(apiClientProvider).post('/notifications', body: {
      'action': 'markAllRead',
    });
    _ref.invalidate(notificationsProvider);
  }
}
