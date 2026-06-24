import 'package:flutter/material.dart';

/// Placeholder reutilizable para secciones aún en construcción (fases siguientes).
class ComingSoon extends StatelessWidget {
  const ComingSoon({super.key, required this.title, this.icon = Icons.bolt});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48, color: muted),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('Disponible en breve', style: TextStyle(color: muted)),
        ],
      ),
    );
  }
}
