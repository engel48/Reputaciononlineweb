import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Loader de marca: un arco con gradiente cyan→navy que rota. Reemplaza al
/// CircularProgressIndicator plano para darle identidad a las cargas.
class BrandLoader extends StatefulWidget {
  const BrandLoader({super.key, this.size = 46, this.label, this.onLight = true});

  final double size;
  final String? label;

  /// true: arco cyan/navy (sobre fondo claro). false: arco blanco (sobre gradiente).
  final bool onLight;

  @override
  State<BrandLoader> createState() => _BrandLoaderState();
}

class _BrandLoaderState extends State<BrandLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))
        ..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          RotationTransition(
            turns: _c,
            child: SizedBox(
              width: widget.size,
              height: widget.size,
              child: CustomPaint(painter: _ArcPainter(onLight: widget.onLight)),
            ),
          ),
          if (widget.label != null) ...[
            const SizedBox(height: 14),
            Text(
              widget.label!,
              style: TextStyle(
                color: widget.onLight ? AppColors.muted : Colors.white70,
                fontSize: 13,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  _ArcPainter({required this.onLight});
  final bool onLight;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.10
      ..strokeCap = StrokeCap.round
      ..shader = (onLight
              ? const SweepGradient(
                  colors: [AppColors.cyan, AppColors.accentNavy, Colors.transparent],
                  stops: [0.0, 0.7, 1.0],
                )
              : SweepGradient(
                  colors: [Colors.white, Colors.white.withValues(alpha: 0.5), Colors.transparent],
                  stops: const [0.0, 0.7, 1.0],
                ))
          .createShader(rect);
    canvas.drawArc(rect.deflate(size.width * 0.08), 0, math.pi * 1.55, false, paint);
  }

  @override
  bool shouldRepaint(covariant _ArcPainter old) => false;
}
