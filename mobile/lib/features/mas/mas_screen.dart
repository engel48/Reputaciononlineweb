import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../auth/auth_controller.dart';

class _Entry {
  const _Entry(this.title, this.subtitle, this.icon, this.route, this.color);
  final String title;
  final String subtitle;
  final IconData icon;
  final String route;
  final Color color;
}

class MasScreen extends ConsumerWidget {
  const MasScreen({super.key});

  static const _entries = [
    _Entry('Noticias', 'Menciones en medios y keywords', Icons.article_outlined, '/noticias', AppColors.cyan),
    _Entry('Búsqueda', 'Analizá la reputación de alguien', Icons.travel_explore, '/busqueda', AppColors.accentNavy),
    _Entry('Crisis', 'Alertas y respuesta con IA', Icons.warning_amber_rounded, '/crisis', AppColors.warning),
    _Entry('Redes sociales', 'Conectá tus cuentas', Icons.hub_outlined, '/redes', AppColors.success),
    _Entry('Notificaciones', 'Tus alertas y avisos', Icons.notifications_outlined, '/notificaciones', AppColors.accentNavy),
    _Entry('Planes', 'Mejorá tu suscripción', Icons.workspace_premium_outlined, '/planes', AppColors.cyanHover),
    _Entry('Ajustes', 'Contraseña y tema', Icons.settings_outlined, '/configuracion', AppColors.cyan),
    _Entry('Mi perfil', 'Cuenta y sesión', Icons.person_outline, '/perfil', AppColors.muted),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Más')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Cabecera con el usuario
          Card(
            child: ListTile(
              onTap: () => context.push('/perfil'),
              leading: CircleAvatar(
                backgroundColor: AppColors.cyan.withValues(alpha: 0.2),
                child: Text(
                  user?.initials ?? '?',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.accentNavy),
                ),
              ),
              title: Text(user?.displayName ?? 'Mi cuenta',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(user?.email ?? ''),
              trailing: const Icon(Icons.chevron_right),
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.05,
            children: _entries.map((e) => _Tile(e)).toList(),
          ),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile(this.e);
  final _Entry e;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push(e.route),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: e.color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(e.icon, color: e.color, size: 24),
              ),
              const Spacer(),
              Text(e.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 2),
              Text(e.subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
            ],
          ),
        ),
      ),
    );
  }
}
