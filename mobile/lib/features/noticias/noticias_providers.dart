import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/keyword.dart';
import '../../data/models/news_mention.dart';

/// Menciones de noticias + estadísticas (/api/news-monitoring/mentions).
final newsFeedProvider = FutureProvider.autoDispose<NewsFeed>((ref) async {
  final res = await ref.read(apiClientProvider).get('/news-monitoring/mentions', query: {
    'limit': 50,
  });
  final data = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
  final mentions = ((data['mentions'] as List?) ?? const [])
      .map((e) => NewsMention.fromJson((e as Map).cast<String, dynamic>()))
      .toList();
  final stats = data['statistics'] is Map
      ? NewsStats.fromJson((data['statistics'] as Map).cast<String, dynamic>())
      : NewsStats.empty;
  return NewsFeed(mentions: mentions, stats: stats);
});

/// Palabras clave monitoreadas (/api/news-monitoring/keywords).
final keywordsProvider = FutureProvider.autoDispose<List<Keyword>>((ref) async {
  final res = await ref.read(apiClientProvider).get('/news-monitoring/keywords');
  return ((res['keywords'] as List?) ?? const [])
      .map((e) => Keyword.fromJson((e as Map).cast<String, dynamic>()))
      .toList();
});

/// Acciones sobre keywords (agregar / eliminar).
class KeywordActions {
  KeywordActions(this.ref);
  final Ref ref;

  Future<void> add(String keyword) async {
    await ref.read(apiClientProvider).post('/news-monitoring/keywords', body: {
      'keyword': keyword.trim(),
    });
    ref.invalidate(keywordsProvider);
  }

  Future<void> remove(String id) async {
    await ref.read(apiClientProvider).delete('/news-monitoring/keywords', query: {'id': id});
    ref.invalidate(keywordsProvider);
  }
}

final keywordActionsProvider = Provider((ref) => KeywordActions(ref));
