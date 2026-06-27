import '../../shared/format.dart';

/// Palabra clave monitoreada por el usuario.
class Keyword {
  Keyword({
    required this.id,
    required this.keyword,
    required this.isActive,
    required this.totalMentions,
    required this.unreadMentions,
    required this.checkFrequencyMinutes,
    required this.lastCheckedAt,
  });

  final String id;
  final String keyword;
  final bool isActive;
  final int totalMentions;
  final int unreadMentions;
  final int checkFrequencyMinutes;
  final DateTime? lastCheckedAt;

  factory Keyword.fromJson(Map<String, dynamic> j) => Keyword(
        id: (j['id'] ?? '').toString(),
        keyword: (j['keyword'] ?? '').toString(),
        isActive: j['is_active'] != false,
        totalMentions: (j['total_mentions'] as num?)?.toInt() ?? 0,
        unreadMentions: (j['unread_mentions'] as num?)?.toInt() ?? 0,
        checkFrequencyMinutes: (j['check_frequency_minutes'] as num?)?.toInt() ?? 60,
        lastCheckedAt: Fmt.parseDate(j['last_checked_at']),
      );
}
