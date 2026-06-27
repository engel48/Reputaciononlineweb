import 'dart:convert';

/// Decodifica el campo `response` de /api/julia (viene como JSON string,
/// aunque toleramos que ya sea un Map).
Map<String, dynamic> _decodeResponse(dynamic raw) {
  if (raw is Map) return raw.cast<String, dynamic>();
  if (raw is String && raw.trim().isNotEmpty) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) return decoded.cast<String, dynamic>();
    } catch (_) {/* texto plano: sin estructura */}
  }
  return const {};
}

double _toDouble(dynamic v) {
  if (v is num) return v.toDouble();
  return double.tryParse('$v') ?? 0;
}

int _toInt(dynamic v) {
  if (v is num) return v.toInt();
  return int.tryParse('$v') ?? 0;
}

List<String> _toStringList(dynamic v) =>
    (v is List) ? v.map((e) => '$e').toList() : const [];

/// Resultado del análisis de sentimiento de un texto (action: 'analyze').
class SentimentResult {
  SentimentResult({
    required this.sentiment,
    required this.score,
    required this.explanation,
  });

  final String sentiment; // positive | negative | neutral
  final double score;
  final String explanation;

  factory SentimentResult.fromResponse(dynamic raw) {
    final j = _decodeResponse(raw);
    return SentimentResult(
      sentiment: '${j['sentiment'] ?? 'neutral'}',
      score: _toDouble(j['score']),
      explanation: '${j['explanation'] ?? ''}',
    );
  }
}

/// Informe de reputación generado por Julia (action: 'reputation').
class ReputationReport {
  ReputationReport({
    required this.overallScore,
    required this.sentiment,
    required this.summary,
    required this.sourcesFound,
    required this.sourcesSummary,
    required this.strengths,
    required this.risks,
    required this.recommendations,
    required this.query,
  });

  final int overallScore;
  final String sentiment;
  final String summary;
  final int sourcesFound;
  final Map<String, int> sourcesSummary;
  final List<String> strengths;
  final List<String> risks;
  final List<String> recommendations;
  final String query;

  factory ReputationReport.fromResponse(dynamic raw) {
    final j = _decodeResponse(raw);
    final ss = <String, int>{};
    final rawSummary = j['sources_summary'];
    if (rawSummary is Map) {
      rawSummary.forEach((k, v) => ss['$k'] = _toInt(v));
    }
    return ReputationReport(
      overallScore: _toInt(j['overallScore']),
      sentiment: '${j['sentiment'] ?? 'neutral'}',
      summary: '${j['summary'] ?? ''}',
      sourcesFound: _toInt(j['sources_found']),
      sourcesSummary: ss,
      strengths: _toStringList(j['strengths']),
      risks: _toStringList(j['risks']),
      recommendations: _toStringList(j['recommendations']),
      query: '${j['query'] ?? ''}',
    );
  }
}

/// Un mensaje del chat con Julia (usuario o asistente).
class JuliaMessage {
  JuliaMessage({
    required this.role,
    required this.content,
    required this.timestamp,
    this.pending = false,
    this.error = false,
  });

  final String role; // 'user' | 'assistant'
  final String content;
  final DateTime timestamp;

  /// True mientras se espera la respuesta del backend (burbuja "escribiendo…").
  final bool pending;

  /// True si esta burbuja representa un error (créditos, red, etc.).
  final bool error;

  bool get isUser => role == 'user';

  factory JuliaMessage.fromJson(Map<String, dynamic> j) {
    return JuliaMessage(
      role: (j['role'] ?? 'assistant').toString(),
      content: (j['content'] ?? '').toString(),
      timestamp: DateTime.tryParse((j['created_at'] ?? '').toString())?.toLocal() ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }

  JuliaMessage copyWith({String? content, bool? pending, bool? error}) {
    return JuliaMessage(
      role: role,
      content: content ?? this.content,
      timestamp: timestamp,
      pending: pending ?? this.pending,
      error: error ?? this.error,
    );
  }
}
