import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../auth/auth_controller.dart';

class PerfilScreen extends ConsumerWidget {
  const PerfilScreen({super.key});

  static const _planLabels = {
    'free': 'Free',
    'basic': 'Básico',
    'pro': 'Profesional',
    'enterprise': 'Enterprise',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    if (user == null) return const SizedBox.shrink();

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 38,
                  backgroundColor: AppColors.cyan.withValues(alpha: 0.18),
                  child: Text(user.initials,
                      style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accentNavy)),
                ),
                const SizedBox(height: 12),
                Text(user.displayName,
                    style: Theme.of(context).textTheme.titleLarge),
                Text(user.email, style: const TextStyle(color: AppColors.muted)),
                if (user.isAdmin)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Chip(
                      label: const Text('Administrador'),
                      backgroundColor: AppColors.accentNavy.withValues(alpha: 0.12),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                _row(Icons.workspace_premium_outlined, 'Plan',
                    _planLabels[user.plan] ?? user.plan),
                const Divider(height: 1),
                _row(Icons.bolt, 'Créditos', '${user.credits}'),
                if (user.company != null) ...[
                  const Divider(height: 1),
                  _row(Icons.business_outlined, 'Empresa', user.company!),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () => _confirmLogout(context, ref),
            icon: const Icon(Icons.logout, color: AppColors.danger),
            label: const Text('Cerrar sesión',
                style: TextStyle(color: AppColors.danger)),
            style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) => ListTile(
        leading: Icon(icon, color: AppColors.cyanHover),
        title: Text(label),
        trailing: Text(value,
            style: const TextStyle(fontWeight: FontWeight.w600)),
      );

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Cerrar sesión'),
        content: const Text('¿Querés salir de tu cuenta?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(c, false),
              child: const Text('Cancelar')),
          TextButton(
              onPressed: () => Navigator.pop(c, true),
              child: const Text('Salir',
                  style: TextStyle(color: AppColors.danger))),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(authControllerProvider.notifier).logout();
    }
  }
}
