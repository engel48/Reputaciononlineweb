import 'package:flutter/material.dart';

/// Logo de marca. `white: true` usa el logotipo en blanco (para fondos de marca);
/// `mark: true` usa el isotipo cuadrado; si no, el logotipo completo en cian.
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.height = 40, this.mark = false, this.white = false});

  final double height;
  final bool mark;
  final bool white;

  @override
  Widget build(BuildContext context) {
    final asset = white
        ? 'assets/brand/logo-white.png'
        : (mark ? 'assets/brand/icon.png' : 'assets/brand/logo.png');
    return Image.asset(asset, height: height, fit: BoxFit.contain);
  }
}
