import '../../shared/format.dart';

int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
double _d(dynamic v) => v is num ? v.toDouble() : double.tryParse('$v') ?? 0;

/// Respuesta de GET /api/dashboard-analytics.
class DashboardData {
  DashboardData({
    required this.mentions,
    required this.reputation,
    required this.social,
    required this.noData,
  });

  final MentionsSummary mentions;
  final Reputation reputation;
  final SocialSummary social;
  final bool noData;

  factory DashboardData.fromResponse(Map<String, dynamic> res) {
    final data = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
    return DashboardData(
      mentions: MentionsSummary.fromJson(
          (data['mentions'] as Map?)?.cast<String, dynamic>() ?? {}),
      reputation: Reputation.fromJson(
          (data['reputation'] as Map?)?.cast<String, dynamic>() ?? {}),
      social: SocialSummary.fromJson(
          (data['socialMedia'] as Map?)?.cast<String, dynamic>() ?? {}),
      noData: res['no_data'] == true || data['no_data'] == true,
    );
  }
}

class MentionsSummary {
  MentionsSummary({
    required this.total,
    required this.positive,
    required this.negative,
    required this.neutral,
    required this.trend,
    required this.byPlatform,
    required this.recent,
    required this.timeSeries,
  });

  final int total, positive, negative, neutral;
  final String trend;
  final Map<String, int> byPlatform;
  final List<RecentMention> recent;
  final List<TimePoint> timeSeries;

  factory MentionsSummary.fromJson(Map<String, dynamic> j) {
    final bp = (j['byPlatform'] as Map?)?.cast<String, dynamic>() ?? {};
    return MentionsSummary(
      total: _i(j['total']),
      positive: _i(j['positive']),
      negative: _i(j['negative']),
      neutral: _i(j['neutral']),
      trend: '${j['trend'] ?? ''}',
      byPlatform: bp.map((k, v) => MapEntry(k, _i(v))),
      recent: ((j['recent'] as List?) ?? [])
          .map((e) => RecentMention.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
      timeSeries: ((j['timeSeries'] as List?) ?? [])
          .map((e) => TimePoint.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
    );
  }
}

class RecentMention {
  RecentMention({
    required this.id,
    required this.author,
    required this.content,
    required this.sentiment,
    required this.platform,
    required this.date,
  });

  final String id, author, content, sentiment, platform;
  final DateTime? date;

  factory RecentMention.fromJson(Map<String, dynamic> j) => RecentMention(
        id: '${j['id']}',
        author: '${j['author'] ?? ''}',
        content: '${j['content'] ?? ''}',
        sentiment: '${j['sentiment'] ?? 'neutral'}',
        platform: '${j['platform'] ?? ''}',
        date: Fmt.parseDate(j['date']),
      );
}

class TimePoint {
  TimePoint(this.date, this.value);
  final String date;
  final int value;
  factory TimePoint.fromJson(Map<String, dynamic> j) =>
      TimePoint('${j['date'] ?? ''}', _i(j['value']));
}

class Reputation {
  Reputation({required this.score, required this.previousScore, required this.trend});
  final int score, previousScore;
  final String trend;
  factory Reputation.fromJson(Map<String, dynamic> j) => Reputation(
        score: _i(j['score']),
        previousScore: _i(j['previousScore']),
        trend: '${j['trend'] ?? 'stable'}',
      );
}

class SocialSummary {
  SocialSummary({required this.connected, required this.platforms});
  final int connected;
  final List<PlatformStat> platforms;
  factory SocialSummary.fromJson(Map<String, dynamic> j) => SocialSummary(
        connected: _i(j['connected']),
        platforms: ((j['platforms'] as List?) ?? [])
            .map((e) => PlatformStat.fromJson((e as Map).cast<String, dynamic>()))
            .toList(),
      );
}

class PlatformStat {
  PlatformStat({
    required this.platform,
    required this.followers,
    required this.engagement,
    required this.connected,
  });
  final String platform;
  final int followers;
  final double engagement;
  final bool connected;
  factory PlatformStat.fromJson(Map<String, dynamic> j) => PlatformStat(
        platform: '${j['platform'] ?? ''}',
        followers: _i(j['followers']),
        engagement: _d(j['engagement']),
        connected: j['connected'] == true,
      );
}
