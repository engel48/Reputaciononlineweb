import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../auth/auth_controller.dart';

/// Inicio (stub de Fase 0; en Fase 1 se conecta a /api/dashboard-analytics).
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: AppBar(
        title: Text('Hola, ${user?.displayName.split(' ').first ?? ''}'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Chip(
              avatar: const Icon(Icons.bolt, size: 18, color: AppColors.accentNavy),
              label: Text('${user?.credits ?? 0}'),
              backgroundColor: AppColors.cyan.withValues(alpha: 0.15),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Tu reputación hoy',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  const Text(
                      'El panel en tiempo real (sentimiento, menciones y redes) se conecta en la próxima fase.'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
