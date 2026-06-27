import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/crisis_alert.dart';

/// Alertas de crisis del usuario (/api/crisis-management/alerts).
final crisisAlertsProvider =
    FutureProvider.autoDispose.family<List<CrisisAlert>, String>((ref, status) async {
  final res = await ref.read(apiClientProvider).get('/crisis-management/alerts', query: {
    'status': status,
    'limit': 50,
  });
  return ((res['data'] as List?) ?? const [])
      .map((e) => CrisisAlert.fromJson((e as Map).cast<String, dynamic>()))
      .toList();
});

class CrisisActions {
  CrisisActions(this.ref);
  final Ref ref;

  /// Genera (o recupera) la respuesta sugerida por IA para una alerta.
  Future<String> generateResponse(String alertId) async {
    final res = await ref
        .read(apiClientProvider)
        .post('/crisis-management/alerts/$alertId/ai-response');
    final data = (res['data'] as Map?)?.cast<String, dynamic>();
    return (res['ai_response'] ?? res['response'] ?? data?['ai_response'] ?? '')
        .toString();
  }

  Future<void> setStatus(String alertId, String status) async {
    await ref.read(apiClientProvider).patch('/crisis-management/alerts',
        body: {'alertId': alertId, 'status': status});
    ref.invalidate(crisisAlertsProvider);
  }
}

final crisisActionsProvider = Provider((ref) => CrisisActions(ref));
