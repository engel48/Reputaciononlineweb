import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Tarjeta de métrica compacta (icono + valor + etiqueta).
class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color = AppColors.cyanHover,
    this.sub,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String? sub;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                if (sub != null) ...[
                  const Spacer(),
                  Text(sub!,
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 11)),
                ],
              ],
            ),
            const SizedBox(height: 10),
            Text(value,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
