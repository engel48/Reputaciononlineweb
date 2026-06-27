import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/search_result.dart';
import '../../shared/format.dart';
import '../../shared/widgets/sentiment_chip.dart';
import 'busqueda_providers.dart';

class BusquedaScreen extends ConsumerStatefulWidget {
  const BusquedaScreen({super.key});

  @override
  ConsumerState<BusquedaScreen> createState() => _BusquedaScreenState();
}

class _BusquedaScreenState extends ConsumerState<BusquedaScreen> {
  final _input = TextEditingController();

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final q = _input.text.trim();
    if (q.isEmpty) return;
    FocusScope.of(context).unfocus();
    await ref.read(searchControllerProvider.notifier).search(q);
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(searchControllerProvider);
    final state = async.asData?.value;
    final loading = async.isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Búsqueda de reputación')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => _search(),
                    decoration: const InputDecoration(
                      hintText: 'Nombre de persona, marca o tema…',
                      prefixIcon: Icon(Icons.search),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: loading ? null : _search,
                  child: loading
                      ? const SizedBox(
                          width: 18, height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Analizar'),
                ),
              ],
            ),
          ),
          Expanded(
            child: loading
                ? const _Loading()
                : state == null
                    ? const _Intro()
                    : state.error != null
                        ? _Error(state.error!)
                        : state.result == null
                            ? const _Intro()
                            : _Results(state.result!),
          ),
        ],
      ),
    );
  }
}

class _Loading extends StatelessWidget {
  const _Loading();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Analizando noticias en tiempo real…',
              style: TextStyle(color: AppColors.muted)),
        ],
      ),
    );
  }
}

class _Intro extends StatelessWidget {
  const _Intro();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.travel_explore, size: 56, color: AppColors.cyan),
            SizedBox(height: 16),
            Text('Analizá la reputación de cualquiera',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            SizedBox(height: 8),
            Text(
              'Buscamos noticias reales en vivo y Julia analiza el sentimiento general. Consume créditos según los resultados.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.muted, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class _Error extends StatelessWidget {
  const _Error(this.message);
  final String message;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)),
          ],
        ),
      ),
    );
  }
}

class _Results extends StatelessWidget {
  const _Results(this.r);
  final SearchResult r;

  @override
  Widget build(BuildContext context) {
    if (r.news.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text('No se encontraron noticias recientes para "${r.query}".',
              textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sentimiento sobre "${r.query}"',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('${r.sourcesAnalyzed} fuentes analizadas',
                    style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                const SizedBox(height: 14),
                _SentBar(label: 'Positivo', pct: r.positive, color: AppColors.success),
                const SizedBox(height: 8),
                _SentBar(label: 'Neutral', pct: r.neutral, color: AppColors.muted),
                const SizedBox(height: 8),
                _SentBar(label: 'Negativo', pct: r.negative, color: AppColors.danger),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text('Noticias encontradas', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...r.news.map((n) => _NewsTile(n)),
      ],
    );
  }
}

class _SentBar extends StatelessWidget {
  const _SentBar({required this.label, required this.pct, required this.color});
  final String label;
  final int pct;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(width: 70, child: Text(label, style: const TextStyle(fontSize: 13))),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: (pct / 100).clamp(0, 1),
              minHeight: 8,
              backgroundColor: color.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
        ),
        const SizedBox(width: 10),
        SizedBox(width: 38, child: Text('$pct%', textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w600))),
      ],
    );
  }
}

class _NewsTile extends StatelessWidget {
  const _NewsTile(this.n);
  final SearchNews n;

  Future<void> _open() async {
    if (n.url.isEmpty) return;
    final uri = Uri.tryParse(n.url);
    if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: _open,
        title: Text(n.title, maxLines: 2, overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
        subtitle: Text('${n.source}${n.date != null ? ' · ${Fmt.relative(n.date)}' : ''}',
            style: const TextStyle(fontSize: 11.5)),
        trailing: SentimentChip(n.sentiment),
      ),
    );
  }
}
