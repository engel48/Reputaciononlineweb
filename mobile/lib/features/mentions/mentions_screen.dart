import 'package:flutter/material.dart';
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
                  child: ChoiceChip(
                    label: Text(f == null ? 'Todas' : PlatformUi.label(f)),
                    selected: isSel,
                    onSelected: (_) =>
                        ref.read(mentionPlatformFilter.notifier).set(f),
                    selectedColor: AppColors.cyan.withValues(alpha: 0.2),
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
              ? ListView(children: const [
                  SizedBox(height: 120),
                  EmptyState(
                    icon: Icons.hearing_disabled,
                    message: 'Sin menciones en los últimos 7 días.',
                  ),
                ])
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

class _MentionTile extends StatelessWidget {
  const _MentionTile(this.m);
  final Mention m;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
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
