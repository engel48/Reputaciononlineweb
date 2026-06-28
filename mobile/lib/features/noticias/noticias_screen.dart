import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/keyword.dart';
import '../../data/models/news_mention.dart';
import '../../shared/format.dart';
import '../../shared/widgets/async_view.dart';
import '../../shared/widgets/sentiment_chip.dart';
import 'noticias_providers.dart';

class NoticiasScreen extends ConsumerWidget {
  const NoticiasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Noticias'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Menciones'),
              Tab(text: 'Palabras clave'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [NewsMentionsTab(), KeywordsTab()],
        ),
      ),
    );
  }
}

class NewsMentionsTab extends ConsumerWidget {
  const NewsMentionsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(newsFeedProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(newsFeedProvider),
      child: AsyncView<NewsFeed>(
        value: async,
        onRetry: () => ref.invalidate(newsFeedProvider),
        data: (feed) {
          if (feed.mentions.isEmpty) {
            return ListView(children: const [
              SizedBox(height: 100),
              EmptyState(
                icon: Icons.article_outlined,
                message: 'Aún no hay menciones en medios.\nAgregá palabras clave para empezar a monitorear.',
              ),
            ]);
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _StatsRow(feed.stats),
              const SizedBox(height: 12),
              ...feed.mentions.map((m) => _NewsTile(m)),
            ],
          );
        },
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow(this.s);
  final NewsStats s;

  @override
  Widget build(BuildContext context) {
    Widget chip(String label, int v, Color c) => Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 3),
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: c.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text('$v', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: c)),
                Text(label, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
          ),
        );
    return Row(
      children: [
        chip('Total', s.total, AppColors.accentNavy),
        chip('Positivas', s.positive, AppColors.success),
        chip('Negativas', s.negative, AppColors.danger),
        chip('Sin leer', s.unread, AppColors.warning),
      ],
    );
  }
}

class _NewsTile extends StatelessWidget {
  const _NewsTile(this.m);
  final NewsMention m;

  Future<void> _open() async {
    if (m.url.isEmpty) return;
    final uri = Uri.tryParse(m.url);
    if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: _open,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(m.siteName.toUpperCase(),
                        style: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.cyanHover)),
                  ),
                  SentimentChip(m.sentiment),
                ],
              ),
              const SizedBox(height: 6),
              Text(m.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              if (m.context.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(m.context,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  if (m.author.isNotEmpty) ...[
                    const Icon(Icons.person_outline, size: 13, color: AppColors.muted),
                    const SizedBox(width: 3),
                    Flexible(
                      child: Text(m.author,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                    ),
                    const SizedBox(width: 10),
                  ],
                  const Spacer(),
                  Text(Fmt.relative(m.publishedDate),
                      style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                  const SizedBox(width: 6),
                  const Icon(Icons.open_in_new, size: 13, color: AppColors.muted),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class KeywordsTab extends ConsumerWidget {
  const KeywordsTab({super.key});

  Future<void> _addDialog(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    final keyword = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nueva palabra clave'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Ej: tu nombre o tu marca'),
          onSubmitted: (v) => Navigator.pop(ctx, v),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Agregar')),
        ],
      ),
    );
    if (keyword == null || keyword.trim().length < 2) return;
    try {
      await ref.read(keywordActionsProvider).add(keyword);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Palabra clave "${keyword.trim()}" agregada.')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(keywordsProvider);
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(keywordsProvider),
        child: AsyncView<List<Keyword>>(
          value: async,
          onRetry: () => ref.invalidate(keywordsProvider),
          data: (items) => items.isEmpty
              ? ListView(children: const [
                  SizedBox(height: 100),
                  EmptyState(
                    icon: Icons.key_outlined,
                    message: 'Sin palabras clave.\nAgregá tu nombre o marca para monitorear noticias.',
                  ),
                ])
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  itemBuilder: (_, i) => _KeywordTile(items[i]),
                ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'kw-add',
        onPressed: () => _addDialog(context, ref),
        backgroundColor: AppColors.cyan,
        foregroundColor: AppColors.accentNavy,
        icon: const Icon(Icons.add),
        label: const Text('Palabra clave'),
      ),
    );
  }
}

class _KeywordTile extends ConsumerWidget {
  const _KeywordTile(this.k);
  final Keyword k;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: (k.isActive ? AppColors.success : AppColors.muted).withValues(alpha: 0.15),
          child: Icon(k.isActive ? Icons.key : Icons.key_off,
              color: k.isActive ? AppColors.success : AppColors.muted, size: 18),
        ),
        title: Text(k.keyword, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          '${k.totalMentions} menciones · ${k.unreadMentions} sin leer'
          '${k.lastCheckedAt != null ? ' · ${Fmt.relative(k.lastCheckedAt)}' : ''}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: AppColors.danger),
          onPressed: () async {
            final ok = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Eliminar palabra clave'),
                content: Text('¿Quitar "${k.keyword}" del monitoreo?'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
                  FilledButton(
                      style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Eliminar')),
                ],
              ),
            );
            if (ok == true) {
              await ref.read(keywordActionsProvider).remove(k.id);
            }
          },
        ),
      ),
    );
  }
}
