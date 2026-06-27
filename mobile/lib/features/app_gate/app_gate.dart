import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import 'app_config_provider.dart';

/// Envuelve la app: si la config remota exige actualizar o está en mantenimiento,
/// muestra una pantalla bloqueante por encima de todo. En cualquier otro caso
/// (incluida config no cargada o error), deja pasar al contenido normal.
class AppGate extends ConsumerWidget {
  const AppGate({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider).asData?.value;

    if (config == null) return child;
    if (config.maintenanceMode) {
      return _Blocker(
        icon: Icons.engineering_outlined,
        title: 'En mantenimiento',
        message: config.maintenanceMessage.isNotEmpty
            ? config.maintenanceMessage
            : 'Estamos haciendo mejoras. Volvé en unos minutos.',
        actionLabel: 'Reintentar',
        onAction: () => ref.invalidate(appConfigProvider),
      );
    }
    if (config.forceUpdate) {
      return _Blocker(
        icon: Icons.system_update,
        title: 'Actualización requerida',
        message:
            'Hay una nueva versión de Reputación Online${config.latestVersion.isNotEmpty ? ' (${config.latestVersion})' : ''}. '
            'Actualizá para seguir usando la app.',
        actionLabel: 'Actualizar ahora',
        onAction: () async {
          final url = config.updateUrl;
          if (url.isNotEmpty) {
            final uri = Uri.tryParse(url);
            if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        },
      );
    }
    return child;
  }
}

class _Blocker extends StatelessWidget {
  const _Blocker({
    required this.icon,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Container(
        decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 72, color: Colors.white),
                  const SizedBox(height: 24),
                  Text(title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  Text(message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white70, fontSize: 15, height: 1.4)),
                  const SizedBox(height: 32),
                  FilledButton(
                    onPressed: onAction,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.accentNavy,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                    ),
                    child: Text(actionLabel, style: const TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
