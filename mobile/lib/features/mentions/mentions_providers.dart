import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/mention.dart';

/// Filtro de plataforma activo (null = todas).
class MentionFilterNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? platform) => state = platform;
}

final mentionPlatformFilter =
    NotifierProvider<MentionFilterNotifier, String?>(MentionFilterNotifier.new);

/// Menciones recientes (/api/mentions/recent), últimos 7 días, con filtro opcional.
final mentionsProvider = FutureProvider.autoDispose<List<Mention>>((ref) async {
  final platform = ref.watch(mentionPlatformFilter);
  final res = await ref.read(apiClientProvider).get('/mentions/recent', query: {
    'limit': 50,
    'hours': 168,
    if (platform != null) 'platform': platform,
  });
  final data = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
  return ((data['mentions'] as List?) ?? [])
      .map((e) => Mention.fromJson((e as Map).cast<String, dynamic>()))
      .toList();
});
