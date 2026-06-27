import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/plan.dart';

/// Planes de suscripción disponibles (/api/plans).
final plansProvider = FutureProvider.autoDispose<List<Plan>>((ref) async {
  final res = await ref.read(apiClientProvider).get('/plans');
  final list = ((res['plans'] as List?) ?? const [])
      .map((e) => Plan.fromJson((e as Map).cast<String, dynamic>()))
      .toList()
    ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
  return list;
});
