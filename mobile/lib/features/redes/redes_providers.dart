import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/dashboard.dart';

/// Estado de conexión de redes sociales por plataforma (de /dashboard-analytics).
final redesStatusProvider =
    FutureProvider.autoDispose<Map<String, PlatformStat>>((ref) async {
  final res = await ref.read(apiClientProvider).get('/dashboard-analytics');
  final data = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
  final social = (data['socialMedia'] as Map?)?.cast<String, dynamic>() ?? {};
  final list = ((social['platforms'] as List?) ?? const [])
      .map((e) => PlatformStat.fromJson((e as Map).cast<String, dynamic>()))
      .toList();
  return {for (final p in list) p.platform.toLowerCase(): p};
});
