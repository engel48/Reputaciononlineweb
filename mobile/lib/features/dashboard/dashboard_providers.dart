import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/dashboard.dart';

/// Carga el analytics real del dashboard (/api/dashboard-analytics).
final dashboardProvider = FutureProvider.autoDispose<DashboardData>((ref) async {
  final res = await ref.read(apiClientProvider).get('/dashboard-analytics');
  return DashboardData.fromResponse((res as Map).cast<String, dynamic>());
});
