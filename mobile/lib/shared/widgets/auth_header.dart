import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'brand_logo.dart';
import 'neural_background.dart';

/// Encabezado de marca para las pantallas de auth (login/registro):
/// gradiente de marca + red neuronal + logo blanco + título/subtítulo.
class AuthHeader extends StatelessWidget {
  const AuthHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.onBack,
  });

  final String title;
  final String? subtitle;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(top: topPad + 20, bottom: 30, left: 24, right: 24),
      decoration: const BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
        boxShadow: [
          BoxShadow(color: Color(0x3301257D), blurRadius: 20, offset: Offset(0, 10)),
        ],
      ),
      child: Stack(
        children: [
          const Positioned.fill(child: NeuralBackground(nodeCount: 14)),
          Column(
            children: [
              const SizedBox(height: 6),
              const BrandLogo(height: 46, white: true),
              const SizedBox(height: 20),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Colors.white, fontSize: 23, fontWeight: FontWeight.w800),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 6),
                Text(
                  subtitle!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70, fontSize: 13.5),
                ),
              ],
            ],
          ),
          if (onBack != null)
            Positioned(
              left: -8,
              top: -4,
              child: IconButton(
                onPressed: onBack,
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                tooltip: 'Volver',
              ),
            ),
        ],
      ),
    );
  }
}
