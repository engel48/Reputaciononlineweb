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
        foregroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: const DecoratedBox(
          decoration: BoxDecoration(gradient: AppColors.brandGradient),
        ),
        title: Text(
          'Hola, ${user?.displayName.split(' ').first ?? ''}',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        actions: [
          const _NotifBell(),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Chip(
              avatar: const Icon(Icons.bolt, size: 18, color: AppColors.accentNavy),
              label: Text('${user?.credits ?? 0}',
                  style: const TextStyle(
                      color: AppColors.accentNavy, fontWeight: FontWeight.w800)),
              backgroundColor: Colors.white,
              side: BorderSide.none,
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
        if (d.social.connected > 0 && m.total == 0) ...[
          const _WaitingDataBanner(),
          const SizedBox(height: 16),
        ],
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
        _ConnectedNetworks(d.social),
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
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.accentNavy.withValues(alpha: 0.32),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.all(22),
      child: Row(
        children: [
          SizedBox(
            width: 86,
            height: 86,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 86,
                  height: 86,
                  child: CircularProgressIndicator(
                    value: (r.score.clamp(0, 100)) / 100,
                    strokeWidth: 8,
                    backgroundColor: Colors.white.withValues(alpha: 0.22),
                    valueColor: const AlwaysStoppedAnimation(Colors.white),
                  ),
                ),
                Text('${r.score}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Índice de reputación',
                    style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                        up
                            ? Icons.trending_up
                            : (down ? Icons.trending_down : Icons.trending_flat),
                        color: Colors.white,
                        size: 20),
                    const SizedBox(width: 6),
                    Text(
                      up ? 'En alza' : (down ? 'A la baja' : 'Estable'),
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 16),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Anterior: ${r.previousScore}',
                    style: const TextStyle(color: Colors.white60, fontSize: 12)),
              ],
            ),
          ),
        ],
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

/// Aviso para cuando hay redes conectadas pero todavía no llegan datos
/// (típico mientras Meta aprueba el acceso). Evita que el usuario crea que
/// la app está rota al ver todo en 0.
class _WaitingDataBanner extends StatelessWidget {
  const _WaitingDataBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cyan.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cyan.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.cyan.withValues(alpha: 0.18),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.sync, color: AppColors.cyanHover, size: 22),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Estamos trayendo tus datos',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                SizedBox(height: 2),
                Text(
                  'Tus redes están conectadas. En cuanto se habilite el acceso, vas a ver acá tus menciones y métricas en tiempo real.',
                  style: TextStyle(
                      color: AppColors.muted, fontSize: 12.5, height: 1.35),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Lista de redes conectadas en el home (estado + seguidores). Si no hay
/// ninguna, invita a conectar.
class _ConnectedNetworks extends StatelessWidget {
  const _ConnectedNetworks(this.social);
  final SocialSummary social;

  @override
  Widget build(BuildContext context) {
    final connected = social.platforms.where((p) => p.connected).toList();
    return _SectionCard(
      title: 'Tus redes conectadas',
      child: connected.isEmpty
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Todavía no conectaste ninguna red. Conectá tus cuentas para empezar a monitorear tu reputación.',
                  style: TextStyle(color: AppColors.muted, fontSize: 13),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => context.push('/redes'),
                  icon: const Icon(Icons.add_link),
                  label: const Text('Conectar redes'),
                ),
              ],
            )
          : Column(
              children: [
                for (final p in connected) _NetRow(p),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () => context.push('/redes'),
                    icon: const Icon(Icons.tune, size: 18),
                    label: const Text('Administrar redes'),
                  ),
                ),
              ],
            ),
    );
  }
}

class _NetRow extends StatelessWidget {
  const _NetRow(this.p);
  final PlatformStat p;

  @override
  Widget build(BuildContext context) {
    final color = PlatformUi.color(p.platform);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: color.withValues(alpha: 0.14),
            child: Icon(PlatformUi.icon(p.platform), color: color, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(PlatformUi.label(p.platform),
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  '${Fmt.compact(p.followers)} seguidores · ${p.engagement.toStringAsFixed(1)}% engagement',
                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle, size: 14, color: AppColors.success),
                SizedBox(width: 4),
                Text('Conectado',
                    style: TextStyle(
                        color: AppColors.success,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
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
