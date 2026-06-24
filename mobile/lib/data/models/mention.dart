import '../../shared/format.dart';

int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;

/// Mención de /api/mentions/recent.
class Mention {
  Mention({
    required this.id,
    required this.author,
    required this.platform,
    required this.content,
    required this.sentiment,
    required this.timestamp,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.location,
    required this.verified,
  });

  final String id, author, platform, content, sentiment, location;
  final DateTime? timestamp;
  final int likes, comments, shares;
  final bool verified;

  factory Mention.fromJson(Map<String, dynamic> j) {
    final eng = (j['engagement'] as Map?)?.cast<String, dynamic>() ?? {};
    return Mention(
      id: '${j['id']}',
      author: '${j['author'] ?? ''}',
      platform: '${j['platform'] ?? ''}',
      content: '${j['content'] ?? ''}',
      sentiment: '${j['sentiment'] ?? 'neutral'}',
      timestamp: Fmt.parseDate(j['timestamp']),
      likes: _i(eng['likes']),
      comments: _i(eng['comments']),
      shares: _i(eng['shares'] ?? eng['retweets']),
      location: '${j['location'] ?? ''}',
      verified: j['verified'] == true,
    );
  }
}
