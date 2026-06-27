import '../../shared/format.dart';

/// Mención encontrada en un sitio de noticias monitoreado.
class NewsMention {
  NewsMention({
    required this.id,
    required this.title,
    required this.author,
    required this.context,
    required this.sentiment,
    required this.url,
    required this.siteName,
    required this.publishedDate,
    required this.matchedTerms,
    required this.isRead,
  });

  final String id;
  final String title;
  final String author;
  final String context;
  final String sentiment;
  final String url;
  final String siteName;
  final DateTime? publishedDate;
  final List<String> matchedTerms;
  final bool isRead;

  factory NewsMention.fromJson(Map<String, dynamic> j) {
    final site = (j['site'] as Map?)?.cast<String, dynamic>();
    return NewsMention(
      id: (j['id'] ?? '').toString(),
      title: (j['article_title'] ?? 'Sin título').toString(),
      author: (j['article_author'] ?? '').toString(),
      context: (j['mention_context'] ?? '').toString(),
      sentiment: (j['sentiment'] ?? 'neutral').toString(),
      url: (j['article_url'] ?? '').toString(),
      siteName: (site?['name'] ?? 'Noticia').toString(),
      publishedDate: Fmt.parseDate(j['published_date'] ?? j['discovered_at']),
      matchedTerms:
          ((j['matched_terms'] as List?) ?? const []).map((e) => e.toString()).toList(),
      isRead: j['is_read'] == true,
    );
  }
}

/// Estadísticas agregadas de menciones de noticias.
class NewsStats {
  NewsStats({
    required this.total,
    required this.unread,
    required this.positive,
    required this.negative,
    required this.neutral,
  });

  final int total;
  final int unread;
  final int positive;
  final int negative;
  final int neutral;

  factory NewsStats.fromJson(Map<String, dynamic> j) => NewsStats(
        total: (j['total'] as num?)?.toInt() ?? 0,
        unread: (j['unread'] as num?)?.toInt() ?? 0,
        positive: (j['positive'] as num?)?.toInt() ?? 0,
        negative: (j['negative'] as num?)?.toInt() ?? 0,
        neutral: (j['neutral'] as num?)?.toInt() ?? 0,
      );

  static NewsStats get empty =>
      NewsStats(total: 0, unread: 0, positive: 0, negative: 0, neutral: 0);
}

/// Resultado combinado para la pantalla de noticias.
class NewsFeed {
  NewsFeed({required this.mentions, required this.stats});
  final List<NewsMention> mentions;
  final NewsStats stats;
}
