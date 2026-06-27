import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Fondo animado de "red neuronal": nodos que orbitan suavemente y se conectan
/// con líneas cuando están cerca. Marca corporativa (cyan). Liviano y decorativo.
class NeuralBackground extends StatefulWidget {
  const NeuralBackground({
    super.key,
    this.nodeCount = 16,
    this.color = AppColors.cyan,
    this.height,
  });

  final int nodeCount;
  final Color color;
  final double? height;

  @override
  State<NeuralBackground> createState() => _NeuralBackgroundState();
}

class _NeuralBackgroundState extends State<NeuralBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
  late final List<_Node> _nodes;

  @override
  void initState() {
    super.initState();
    final rnd = math.Random(7);
    _nodes = List.generate(widget.nodeCount, (_) {
      return _Node(
        base: Offset(rnd.nextDouble(), rnd.nextDouble()),
        amp: 0.04 + rnd.nextDouble() * 0.06,
        phase: rnd.nextDouble() * math.pi * 2,
        speed: 0.6 + rnd.nextDouble() * 0.8,
      );
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      child: AnimatedBuilder(
        animation: _c,
        builder: (_, __) => CustomPaint(
          painter: _NeuralPainter(_nodes, _c.value, widget.color),
          size: Size.infinite,
        ),
      ),
    );
  }
}

class _Node {
  _Node({required this.base, required this.amp, required this.phase, required this.speed});
  final Offset base; // posición base normalizada (0..1)
  final double amp; // amplitud de oscilación
  final double phase;
  final double speed;

  Offset at(double t) {
    final a = phase + t * speed * math.pi * 2;
    return Offset(
      (base.dx + math.cos(a) * amp).clamp(0.0, 1.0),
      (base.dy + math.sin(a * 0.8) * amp).clamp(0.0, 1.0),
    );
  }
}

class _NeuralPainter extends CustomPainter {
  _NeuralPainter(this.nodes, this.t, this.color);
  final List<_Node> nodes;
  final double t;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final pts = nodes.map((n) {
      final p = n.at(t);
      return Offset(p.dx * size.width, p.dy * size.height);
    }).toList();

    final linePaint = Paint()
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;
    final maxDist = size.shortestSide * 0.45;

    for (int i = 0; i < pts.length; i++) {
      for (int j = i + 1; j < pts.length; j++) {
        final d = (pts[i] - pts[j]).distance;
        if (d < maxDist) {
          final op = (1 - d / maxDist) * 0.35;
          linePaint.color = color.withValues(alpha: op);
          canvas.drawLine(pts[i], pts[j], linePaint);
        }
      }
    }

    final dot = Paint()..color = color.withValues(alpha: 0.85);
    final glow = Paint()..color = color.withValues(alpha: 0.18);
    for (final p in pts) {
      canvas.drawCircle(p, 5, glow);
      canvas.drawCircle(p, 2, dot);
    }
  }

  @override
  bool shouldRepaint(covariant _NeuralPainter old) => old.t != t;
}
