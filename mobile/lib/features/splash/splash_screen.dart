import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/widgets/brand_loader.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/neural_background.dart';

/// Splash in-app mientras se restaura la sesión: gradiente de marca + red
/// neuronal + logo con un pulso suave + loader de marca.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1700),
  )..repeat(reverse: true);

  late final Animation<double> _scale =
      Tween<double>(begin: 0.95, end: 1.06).animate(
    CurvedAnimation(parent: _c, curve: Curves.easeInOut),
  );
  late final Animation<double> _fade =
      Tween<double>(begin: 0.6, end: 1.0).animate(
    CurvedAnimation(parent: _c, curve: Curves.easeInOut),
  );

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        child: Stack(
          children: [
            const Positioned.fill(child: NeuralBackground(nodeCount: 24)),
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FadeTransition(
                    opacity: _fade,
                    child: ScaleTransition(
                      scale: _scale,
                      child: const BrandLogo(height: 78, white: true),
                    ),
                  ),
                  const SizedBox(height: 36),
                  const BrandLoader(size: 38, onLight: false),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
