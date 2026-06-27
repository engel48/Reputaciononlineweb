import '../../shared/format.dart';

/// Una noticia individual de un análisis de búsqueda.
class SearchNews {
  SearchNews({
    required this.title,
    required this.source,
    required this.url,
    required this.sentiment,
    required this.date,
  });

  final String title;
  final String source;
  final String url;
  final String sentiment;
  final DateTime? date;

  factory SearchNews.fromJson(Map<String, dynamic> j) => SearchNews(
        title: (j['title'] ?? '').toString(),
        source: (j['source'] ?? '').toString(),
        url: (j['url'] ?? j['link'] ?? '').toString(),
        sentiment: (j['sentiment'] ?? 'neutral').toString(),
        date: Fmt.parseDate(j['date'] ?? j['publishedAt'] ?? j['pubDate']),
      );
}

/// Resultado de un análisis de reputación / búsqueda de persona.
class SearchResult {
  SearchResult({
    required this.query,
    required this.positive,
    required this.negative,
    required this.neutral,
    required this.totalMentions,
    required this.sourcesAnalyzed,
    required this.news,
  });

  final String query;
  final int positive;
  final int negative;
  final int neutral;
  final int totalMentions;
  final int sourcesAnalyzed;
  final List<SearchNews> news;

  factory SearchResult.fromResponse(Map<String, dynamic> res) {
    final analysis = (res['analysis'] as Map?)?.cast<String, dynamic>() ?? {};
    final overall =
        (analysis['overall_sentiment'] as Map?)?.cast<String, dynamic>() ?? {};
    final newsList = (res['news'] as List?) ??
        (analysis['real_news'] as List?) ??
        const [];
    return SearchResult(
      query: (res['query'] ?? '').toString(),
      positive: (overall['positive'] as num?)?.toInt() ?? 0,
      negative: (overall['negative'] as num?)?.toInt() ?? 0,
      neutral: (overall['neutral'] as num?)?.toInt() ?? 0,
      totalMentions: (analysis['total_mentions'] as num?)?.toInt() ?? newsList.length,
      sourcesAnalyzed: (analysis['sources_analyzed'] as num?)?.toInt() ?? newsList.length,
      news: newsList
          .map((e) => SearchNews.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
    );
  }
}
