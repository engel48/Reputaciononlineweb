import 'package:flutter/material.dart';

/// Logo de marca. `mark: true` usa el isotipo (RO), si no el logotipo completo.
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.height = 40, this.mark = false});

  final double height;
  final bool mark;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      mark ? 'assets/brand/logo-mark.png' : 'assets/brand/logo.png',
      height: height,
      fit: BoxFit.contain,
    );
  }
}
