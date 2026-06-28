import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/dashboard.dart';
import '../../data/models/keyword.dart';
import '../../shared/platform_ui.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/neural_background.dart';
import '../noticias/noticias_providers.dart';
import '../redes/redes_providers.dart';
import '../redes/redes_screen.dart';
import 'onboarding.dart';

/// Onboarding guiado para usuarios nuevos: bienvenida → conectar redes →
/// palabras clave → listo. Saltable en cualquier momento.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pc = PageController();
  int _page = 0;
  bool _finishing = false;
  static const _last = 3;

  @override
  void dispose() {
    _pc.dispose();
    super.dispose();
  }

  void _next() {
    if (_page < _last) {
      _pc.nextPage(
          duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
    } else {
      _finish();
    }
  }

  void _back() {
    if (_page > 0) {
      _pc.previousPage(
          duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
    }
  }

  Future<void> _finish() async {
    if (_finishing) return;
    setState(() => _finishing = true);
    await completeOnboarding(ref);
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _finishing ? null : _finish,
                child: const Text('Saltar'),
              ),
            ),
            Expanded(
              child: PageView(
                controller: _pc,
                onPageChanged: (i) => setState(() => _page = i),
                children: const [
                  _WelcomeStep(),
                  _ConnectStep(),
                  _KeywordsStep(),
                  _DoneStep(),
                ],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_last + 1, (i) {
                final active = i == _page;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: active ? 22 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: active
                        ? AppColors.cyan
                        : AppColors.muted.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(999),
                  ),
                );
              }),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  if (_page > 0) ...[
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _finishing ? null : _back,
                        child: const Text('Atrás'),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: _finishing ? null : _next,
                      child: Text(_page == _last ? 'Ir al inicio' : 'Siguiente'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepShell extends StatelessWidget {
  const _StepShell({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(28, 12, 28, 12),
      children: children,
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.icon, required this.title, required this.subtitle});
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 8),
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            gradient: AppColors.brandGradient,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.accentNavy.withValues(alpha: 0.28),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Icon(icon, color: Colors.white, size: 40),
        ),
        const SizedBox(height: 22),
        Text(title,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        Text(subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: AppColors.muted, fontSize: 14.5, height: 1.4)),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _WelcomeStep extends StatelessWidget {
  const _WelcomeStep();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned.fill(
            child: Opacity(opacity: 0.5, child: NeuralBackground(nodeCount: 14))),
        _StepShell(
          children: [
            const SizedBox(height: 30),
            const Center(child: BrandLogo(height: 64)),
            const SizedBox(height: 34),
            Text('¡Bienvenido a Reputación Online!',
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            const Text(
              'En 2 pasos dejamos tu cuenta lista para monitorear lo que se dice de vos en redes y medios, con análisis de IA.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.muted, fontSize: 15, height: 1.45),
            ),
          ],
        ),
      ],
    );
  }
}

class _ConnectStep extends ConsumerWidget {
  const _ConnectStep();

  static const _platforms = [
    ['youtube', 'YouTube'],
    ['facebook', 'Facebook'],
    ['instagram', 'Instagram'],
    ['twitter', 'X (Twitter)'],
  ];

  Future<void> _connect(
      BuildContext context, WidgetRef ref, String oauthKey, String label) async {
    final token = await ref.read(tokenStorageProvider).readToken();
    if (token == null || token.isEmpty || !context.mounted) return;
    final result = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (_) => OAuthWebView(provider: oauthKey, label: label, token: token),
      ),
    );
    if (result == 'ok') ref.invalidate(redesStatusProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status =
        ref.watch(redesStatusProvider).asData?.value ?? <String, PlatformStat>{};
    return _StepShell(
      children: [
        const _StepHeader(
          icon: Icons.hub_outlined,
          title: 'Conectá tus redes',
          subtitle:
              'Vinculá tus cuentas para traer menciones, seguidores y engagement. Podés hacerlo ahora o más tarde.',
        ),
        ..._platforms.map((p) {
          final key = p[0] == 'twitter' ? 'x' : p[0];
          final connected = status[key]?.connected == true;
          final color = PlatformUi.color(key);
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: color.withValues(alpha: 0.15),
                child: Icon(PlatformUi.icon(key), color: color),
              ),
              title: Text(p[1],
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              trailing: connected
                  ? const Icon(Icons.check_circle, color: AppColors.success)
                  : TextButton(
                      onPressed: () => _connect(context, ref, p[0], p[1]),
                      child: const Text('Conectar'),
                    ),
            ),
          );
        }),
      ],
    );
  }
}

class _KeywordsStep extends ConsumerStatefulWidget {
  const _KeywordsStep();
  @override
  ConsumerState<_KeywordsStep> createState() => _KeywordsStepState();
}

class _KeywordsStepState extends ConsumerState<_KeywordsStep> {
  final _ctrl = TextEditingController();
  bool _adding = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _add() async {
    final kw = _ctrl.text.trim();
    if (kw.length < 2 || _adding) return;
    setState(() => _adding = true);
    try {
      await ref.read(keywordActionsProvider).add(kw);
      _ctrl.clear();
    } catch (_) {} finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final keywords = ref.watch(keywordsProvider).asData?.value ?? <Keyword>[];
    return _StepShell(
      children: [
        const _StepHeader(
          icon: Icons.key_outlined,
          title: 'Palabras clave',
          subtitle:
              'Agregá tu nombre o el de tu marca para monitorear noticias y menciones en medios.',
        ),
        TextField(
          controller: _ctrl,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _add(),
          decoration: InputDecoration(
            hintText: 'Ej: tu nombre o tu marca',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: IconButton(
              icon: _adding
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.add_circle, color: AppColors.cyanHover),
              onPressed: _adding ? null : _add,
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (keywords.isEmpty)
          const Text('Todavía no agregaste palabras clave.',
              style: TextStyle(color: AppColors.muted, fontSize: 13))
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: keywords
                .map((k) => Chip(
                      label: Text(k.keyword),
                      onDeleted: () =>
                          ref.read(keywordActionsProvider).remove(k.id),
                    ))
                .toList(),
          ),
      ],
    );
  }
}

class _DoneStep extends StatelessWidget {
  const _DoneStep();

  @override
  Widget build(BuildContext context) {
    return _StepShell(
      children: [
        const SizedBox(height: 20),
        const _StepHeader(
          icon: Icons.check_circle_outline,
          title: '¡Todo listo!',
          subtitle:
              'Tu cuenta quedó configurada. La app sincroniza sola cada pocos minutos: apenas haya datos, los vas a ver en el inicio.',
        ),
        const SizedBox(height: 8),
        const Center(
          child: Text('Tocá "Ir al inicio" para empezar.',
              style: TextStyle(color: AppColors.muted, fontSize: 13)),
        ),
      ],
    );
  }
}
