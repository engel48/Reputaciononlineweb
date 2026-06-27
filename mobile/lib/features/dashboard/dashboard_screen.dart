import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/dashboard.dart';
import '../../shared/format.dart';
import '../../shared/platform_ui.dart';
import '../../shared/widgets/async_view.dart';
import '../../shared/widgets/mini_line_chart.dart';
import '../../shared/widgets/sentiment_chip.dart';
import '../../shared/widgets/stat_card.dart';
import '../auth/auth_controller.dart';
import '../notificaciones/notificaciones_providers.dart';
import 'dashboard_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final async = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Hola, ${user?.displayName.split(' ').first ?? ''}'),
        actions: [
          const _NotifBell(),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Chip(
              avatar: const Icon(Icons.bolt, size: 18, color: AppColors.accentNavy),
              label: Text('${user?.credits ?? 0}'),
              backgroundColor: AppColors.cyan.withValues(alpha: 0.15),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(dashboardProvider),
        child: AsyncView<DashboardData>(
          value: async,
          onRetry: () => ref.invalidate(dashboardProvider),
          data: (d) => d.noData
              ? ListView(children: const [
                  SizedBox(height: 120),
                  EmptyState(
                    icon: Icons.insights_outlined,
                    message:
                        'Aún no hay datos.\nConectá tus redes para empezar a monitorear tu reputación.',
                  ),
                ])
              : _DashboardBody(d),
        ),
      ),
    );
  }
}

/// Campana de notificaciones con badge de no leídas (lee /api/notifications).
class _NotifBell extends ConsumerWidget {
  const _NotifBell();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count =
        ref.watch(notificationsProvider).asData?.value.unreadCount ?? 0;
    final icon = const Icon(Icons.notifications_outlined);
    return IconButton(
      tooltip: 'Notificaciones',
      onPressed: () => context.push('/notificaciones'),
      icon: count > 0
          ? Badge(
              label: Text('$count'),
              backgroundColor: AppColors.danger,
              child: icon,
            )
          : icon,
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody(this.d);
  final DashboardData d;

  @override
  Widget build(BuildContext context) {
    final m = d.mentions;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _ReputationCard(d.reputation),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: StatCard(
                label: 'Menciones (7d)',
                value: Fmt.number(m.total),
                icon: Icons.forum_outlined,
                sub: m.trend,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatCard(
                label: 'Redes conectadas',
                value: '${d.social.connected}',
                icon: Icons.hub_outlined,
                color: AppColors.accentNavy,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _SentimentCard(m),
        const SizedBox(height: 16),
        _SectionCard(
          title: 'Actividad (últimos 7 días)',
          child: MiniLineChart(
            values: m.timeSeries.map((e) => e.value.toDouble()).toList(),
          ),
        ),
        const SizedBox(height: 16),
        if (m.byPlatform.values.any((v) => v > 0)) _PlatformBreakdown(m.byPlatform),
        const SizedBox(height: 16),
        Text('Menciones recientes',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        if (m.recent.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: EmptyState(message: 'Sin menciones recientes'),
          )
        else
          ...m.recent.take(6).map((r) => _RecentTile(r)),
      ],
    );
  }
}

class _ReputationCard extends StatelessWidget {
  const _ReputationCard(this.r);
  final Reputation r;

  @override
  Widget build(BuildContext context) {
    final up = r.trend == 'up';
    final down = r.trend == 'down';
    final trendColor = up ? AppColors.success : (down ? AppColors.danger : AppColors.muted);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            SizedBox(
              width: 80,
              height: 80,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 80,
                    height: 80,
                    child: CircularProgressIndicator(
                      value: (r.score.clamp(0, 100)) / 100,
                      strokeWidth: 7,
                      backgroundColor: AppColors.borderLight,
                      valueColor: const AlwaysStoppedAnimation(AppColors.cyan),
                    ),
                  ),
                  Text('${r.score}',
                      style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w800)),
                ],
              ),
            ),
            const SizedBox(width: 18),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Índice de reputación',
                      style: TextStyle(color: AppColors.muted, fontSize: 13)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                          up
                              ? Icons.trending_up
                              : (down ? Icons.trending_down : Icons.trending_flat),
                          color: trendColor,
                          size: 18),
                      const SizedBox(width: 6),
                      Text(
                        up
                            ? 'En alza'
                            : (down ? 'A la baja' : 'Estable'),
                        style: TextStyle(
                            color: trendColor, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text('Anterior: ${r.previousScore}',
                      style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SentimentCard extends StatelessWidget {
  const _SentimentCard(this.m);
  final MentionsSummary m;

  @override
  Widget build(BuildContext context) {
    final total = m.total == 0 ? 1 : m.total;
    return _SectionCard(
      title: 'Sentimiento',
      child: Column(
        children: [
          _bar('Positivo', m.positive, total, AppColors.success),
          const SizedBox(height: 10),
          _bar('Neutral', m.neutral, total, AppColors.muted),
          const SizedBox(height: 10),
          _bar('Negativo', m.negative, total, AppColors.danger),
        ],
      ),
    );
  }

  Widget _bar(String label, int value, int total, Color color) {
    return Row(
      children: [
        SizedBox(width: 70, child: Text(label, style: const TextStyle(fontSize: 13))),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: value / total,
              minHeight: 8,
              backgroundColor: color.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
        ),
        const SizedBox(width: 10),
        SizedBox(
            width: 30,
            child: Text('$value',
                textAlign: TextAlign.right,
                style: const TextStyle(fontWeight: FontWeight.w600))),
      ],
    );
  }
}

class _PlatformBreakdown extends StatelessWidget {
  const _PlatformBreakdown(this.byPlatform);
  final Map<String, int> byPlatform;

  @override
  Widget build(BuildContext context) {
    final entries = byPlatform.entries.where((e) => e.value > 0).toList();
    return _SectionCard(
      title: 'Por plataforma',
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: entries.map((e) {
          final color = PlatformUi.color(e.key);
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(PlatformUi.icon(e.key), size: 16, color: color),
                const SizedBox(width: 6),
                Text('${PlatformUi.label(e.key)}: ${e.value}',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _RecentTile extends StatelessWidget {
  const _RecentTile(this.r);
  final RecentMention r;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(PlatformUi.icon(r.platform),
                    size: 16, color: PlatformUi.color(r.platform)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(r.author,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
                SentimentChip(r.sentiment),
              ],
            ),
            const SizedBox(height: 6),
            Text(r.content,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13)),
            const SizedBox(height: 4),
            Text(Fmt.relative(r.date),
                style: const TextStyle(color: AppColors.muted, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}
