import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/mention.dart';
import '../../shared/format.dart';
import '../../shared/platform_ui.dart';
import '../../shared/widgets/async_view.dart';
import '../../shared/widgets/sentiment_chip.dart';
import 'mentions_providers.dart';

class MentionsScreen extends ConsumerWidget {
  const MentionsScreen({super.key});

  static const _filters = [null, 'x', 'facebook', 'instagram', 'youtube'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(mentionPlatformFilter);
    final async = ref.watch(mentionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Menciones'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: _filters.map((f) {
                final isSel = selected == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Center(
                    child: GestureDetector(
                      onTap: () =>
                          ref.read(mentionPlatformFilter.notifier).set(f),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 9),
                        decoration: BoxDecoration(
                          color: isSel
                              ? AppColors.cyan
                              : Colors.white.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(999),
                          border: isSel
                              ? null
                              : Border.all(
                                  color: Colors.white.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          f == null ? 'Todas' : PlatformUi.label(f),
                          style: TextStyle(
                            color: isSel ? AppColors.accentNavy : Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(mentionsProvider),
        child: AsyncView<List<Mention>>(
          value: async,
          onRetry: () => ref.invalidate(mentionsProvider),
          data: (items) => items.isEmpty
              ? const _EmptyMentions()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  itemBuilder: (_, i) => _MentionTile(items[i]),
                ),
        ),
      ),
    );
  }
}

class _EmptyMentions extends StatelessWidget {
  const _EmptyMentions();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(28, 90, 28, 28),
      children: [
        Center(
          child: Container(
            width: 92,
            height: 92,
            decoration: BoxDecoration(
              gradient: AppColors.brandGradient,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.accentNavy.withValues(alpha: 0.28),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(Icons.forum_outlined, color: Colors.white, size: 42),
          ),
        ),
        const SizedBox(height: 22),
        Text(
          'Todavía no hay menciones',
          textAlign: TextAlign.center,
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        const Text(
          'Cuando se detecten comentarios o publicaciones sobre vos en tus redes, vas a verlos acá con su sentimiento y engagement.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.muted, fontSize: 14, height: 1.4),
        ),
        const SizedBox(height: 16),
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.cyan.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.swipe_down, size: 16, color: AppColors.cyanHover),
                SizedBox(width: 6),
                Text('Deslizá para actualizar',
                    style: TextStyle(
                        color: AppColors.cyanHover,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MentionTile extends StatelessWidget {
  const _MentionTile(this.m);
  final Mention m;

  void _showDetail(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _MentionDetail(m),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _showDetail(context),
        child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: PlatformUi.color(m.platform).withValues(alpha: 0.15),
                  child: Icon(PlatformUi.icon(m.platform),
                      size: 15, color: PlatformUi.color(m.platform)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Row(
                    children: [
                      Flexible(
                        child: Text(m.author,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                      ),
                      if (m.verified)
                        const Padding(
                          padding: EdgeInsets.only(left: 4),
                          child: Icon(Icons.verified, size: 14, color: AppColors.cyanHover),
                        ),
                    ],
                  ),
                ),
                SentimentChip(m.sentiment),
              ],
            ),
            const SizedBox(height: 8),
            Text(m.content, style: const TextStyle(fontSize: 13)),
            const SizedBox(height: 10),
            Row(
              children: [
                _eng(Icons.favorite_border, m.likes),
                const SizedBox(width: 14),
                _eng(Icons.chat_bubble_outline, m.comments),
                const SizedBox(width: 14),
                _eng(Icons.repeat, m.shares),
                const Spacer(),
                Text(Fmt.relative(m.timestamp),
                    style: const TextStyle(color: AppColors.muted, fontSize: 11)),
              ],
            ),
          ],
        ),
        ),
      ),
    );
  }

  Widget _eng(IconData icon, int value) => Row(
        children: [
          Icon(icon, size: 14, color: AppColors.muted),
          const SizedBox(width: 4),
          Text(Fmt.compact(value),
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        ],
      );
}

/// Detalle completo de una mención (bottom sheet): contenido sin recortar,
/// métricas y acción de copiar.
class _MentionDetail extends StatelessWidget {
  const _MentionDetail(this.m);
  final Mention m;

  @override
  Widget build(BuildContext context) {
    final color = PlatformUi.color(m.platform);
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 4, 20, 20 + MediaQuery.of(context).padding.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: color.withValues(alpha: 0.15),
                child: Icon(PlatformUi.icon(m.platform), color: color, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(m.author,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                        if (m.verified)
                          const Padding(
                            padding: EdgeInsets.only(left: 4),
                            child: Icon(Icons.verified,
                                size: 15, color: AppColors.cyanHover),
                          ),
                      ],
                    ),
                    Text(
                      PlatformUi.label(m.platform) +
                          (m.location.isNotEmpty ? ' · ${m.location}' : ''),
                      style: const TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              SentimentChip(m.sentiment),
            ],
          ),
          const SizedBox(height: 16),
          SelectableText(m.content,
              style: const TextStyle(fontSize: 15, height: 1.45)),
          const SizedBox(height: 18),
          Row(
            children: [
              _DetailStat(Icons.favorite_border, m.likes, 'Me gusta'),
              _DetailStat(Icons.chat_bubble_outline, m.comments, 'Comentarios'),
              _DetailStat(Icons.repeat, m.shares, 'Compartidos'),
            ],
          ),
          const SizedBox(height: 12),
          Text(Fmt.relative(m.timestamp),
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.tonalIcon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: m.content));
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Texto copiado')),
                );
              },
              icon: const Icon(Icons.copy_outlined),
              label: const Text('Copiar texto'),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailStat extends StatelessWidget {
  const _DetailStat(this.icon, this.value, this.label);
  final IconData icon;
  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 18, color: AppColors.cyanHover),
          const SizedBox(height: 4),
          Text(Fmt.compact(value),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          Text(label,
              style: const TextStyle(color: AppColors.muted, fontSize: 11)),
        ],
      ),
    );
  }
}
