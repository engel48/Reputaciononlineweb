import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/widgets/brand_logo.dart';
import 'auth_controller.dart';
import 'biometric.dart';

/// Si el desbloqueo biométrico está activo y la sesión está autenticada pero
/// todavía no fue desbloqueada (arranque en frío o vuelta de segundo plano),
/// muestra una pantalla de bloqueo por encima de todo.
class BiometricGate extends ConsumerStatefulWidget {
  const BiometricGate({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<BiometricGate> createState() => _BiometricGateState();
}

class _BiometricGateState extends ConsumerState<BiometricGate>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Al ir a segundo plano, re-bloquear para pedir biometría al volver.
    if (state == AppLifecycleState.paused &&
        ref.read(biometricEnabledProvider)) {
      ref.read(biometricUnlockedProvider.notifier).lock();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final enabled = ref.watch(biometricEnabledProvider);
    final unlocked = ref.watch(biometricUnlockedProvider);
    final locked = enabled && auth.isAuthenticated && !unlocked;

    return Stack(
      children: [
        widget.child,
        if (locked) const _LockScreen(),
      ],
    );
  }
}

class _LockScreen extends ConsumerStatefulWidget {
  const _LockScreen();
  @override
  ConsumerState<_LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends ConsumerState<_LockScreen> {
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _authenticate());
  }

  Future<void> _authenticate() async {
    if (_busy) return;
    setState(() => _busy = true);
    final ok = await ref
        .read(biometricServiceProvider)
        .authenticate('Desbloqueá Reputación Online');
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) ref.read(biometricUnlockedProvider.notifier).unlock();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      child: Container(
        decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const BrandLogo(height: 60, white: true),
                  const SizedBox(height: 40),
                  const Icon(Icons.lock_outline, color: Colors.white, size: 44),
                  const SizedBox(height: 16),
                  const Text('App bloqueada',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  const Text('Usá tu huella o rostro para entrar.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white70, fontSize: 14)),
                  const SizedBox(height: 32),
                  FilledButton.icon(
                    onPressed: _busy ? null : _authenticate,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.accentNavy,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 28, vertical: 14),
                    ),
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Desbloquear'),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () =>
                        ref.read(authControllerProvider.notifier).logout(),
                    child: const Text('Salir y usar contraseña',
                        style: TextStyle(color: Colors.white70)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
