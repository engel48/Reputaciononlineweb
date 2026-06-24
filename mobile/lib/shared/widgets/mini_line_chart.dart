import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Mini gráfico de línea (serie temporal del dashboard).
class MiniLineChart extends StatelessWidget {
  const MiniLineChart({super.key, required this.values, this.color = AppColors.cyan});

  final List<double> values;
  final Color color;

  @override
  Widget build(BuildContext context) {
    if (values.length < 2) {
      return const SizedBox(height: 80);
    }
    final spots = [
      for (int i = 0; i < values.length; i++) FlSpot(i.toDouble(), values[i]),
    ];
    final maxY = values.reduce((a, b) => a > b ? a : b);
    return SizedBox(
      height: 90,
      child: LineChart(
        LineChartData(
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          lineTouchData: const LineTouchData(enabled: false),
          minY: 0,
          maxY: maxY <= 0 ? 1 : maxY * 1.2,
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: color,
              barWidth: 3,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: color.withValues(alpha: 0.15),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
