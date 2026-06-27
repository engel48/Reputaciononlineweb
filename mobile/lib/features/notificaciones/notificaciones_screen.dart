import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/notification.dart';
import '../../shared/format.dart';
import '../../shared/widgets/async_view.dart';
import 'notificaciones_providers.dart';

class NotificacionesScreen extends ConsumerWidget {
  const NotificacionesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificaciones'),
        actions: [
          async.maybeWhen(
            data: (d) => d.unreadCount > 0
                ? TextButton(
                    onPressed: () =>
                        ref.read(notificationsActionsProvider).markAllRead(),
                    child: const Text('Marcar todas'),
                  )
                : const SizedBox.shrink(),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsProvider),
        child: AsyncView<NotificationsData>(
          value: async,
          onRetry: () => ref.invalidate(notificationsProvider),
          data: (d) => d.items.isEmpty
              ? ListView(
                  children: const [
                    SizedBox(height: 120),
                    EmptyState(
                      icon: Icons.notifications_off_outlined,
                      message: 'No tenés notificaciones por ahora',
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: d.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) => _NotifTile(d.items[i]),
                ),
        ),
      ),
    );
  }
}

class _NotifTile extends ConsumerWidget {
  const _NotifTile(this.n);
  final AppNotification n;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color = _typeColor(n.type, n.priority);
    return Card(
      margin: EdgeInsets.zero,
      color: n.read ? null : color.withValues(alpha: 0.06),
      child: ListTile(
        onTap: n.read
            ? null
            : () => ref.read(notificationsActionsProvider).markRead(n.id),
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.14),
          child: Icon(_typeIcon(n.type), color: color, size: 20),
        ),
        title: Text(
          n.title.isEmpty ? _typeLabel(n.type) : n.title,
          style: TextStyle(
              fontWeight: n.read ? FontWeight.w500 : FontWeight.w700),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (n.message.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 2, bottom: 4),
                child: Text(n.message,
                    maxLines: 3, overflow: TextOverflow.ellipsis),
              ),
            Text(Fmt.relative(n.timestamp),
                style: const TextStyle(color: AppColors.muted, fontSize: 11)),
          ],
        ),
        isThreeLine: n.message.isNotEmpty,
        trailing: n.read
            ? null
            : Container(
                width: 9,
                height: 9,
                decoration:
                    BoxDecoration(color: color, shape: BoxShape.circle),
              ),
      ),
    );
  }

  Color _typeColor(String type, String priority) {
    if (priority == 'high') return AppColors.danger;
    switch (type) {
      case 'success':
        return AppColors.success;
      case 'warning':
        return AppColors.warning;
      case 'error':
      case 'crisis':
        return AppColors.danger;
      case 'mention':
        return AppColors.accentNavy;
      default:
        return AppColors.cyanHover;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'success':
        return Icons.check_circle_outline;
      case 'warning':
        return Icons.warning_amber_rounded;
      case 'error':
      case 'crisis':
        return Icons.error_outline;
      case 'mention':
        return Icons.forum_outlined;
      case 'system':
        return Icons.settings_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'success':
        return 'Listo';
      case 'warning':
        return 'Aviso';
      case 'error':
        return 'Error';
      case 'crisis':
        return 'Crisis';
      case 'mention':
        return 'Nueva mención';
      case 'system':
        return 'Sistema';
      default:
        return 'Notificación';
    }
  }
}
