import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class SentimentChip extends StatelessWidget {
  const SentimentChip(this.sentiment, {super.key});
  final String sentiment;

  static String label(String s) {
    switch (s) {
      case 'positive':
        return 'Positivo';
      case 'negative':
        return 'Negativo';
      default:
        return 'Neutral';
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = AppColors.sentiment(sentiment);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label(sentiment),
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}
