import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/credit.dart';

/// Balance + historial de créditos (/api/credits).
final creditsProvider = FutureProvider.autoDispose<CreditSummary>((ref) async {
  final res = await ref.read(apiClientProvider).get('/credits');
  return CreditSummary.fromResponse((res as Map).cast<String, dynamic>());
});
