import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/julia.dart';
import '../../shared/format.dart';
import '../../shared/widgets/neural_background.dart';
import '../../shared/widgets/sentiment_chip.dart';
import 'julia_providers.dart';

class JuliaScreen extends ConsumerStatefulWidget {
  const JuliaScreen({super.key});

  @override
  ConsumerState<JuliaScreen> createState() => _JuliaScreenState();
}

class _JuliaScreenState extends ConsumerState<JuliaScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();

  static const _suggestions = [
    '¿Cómo está mi reputación esta semana?',
    'Resumí las menciones más negativas',
    'Dame ideas para mejorar mi imagen',
    '¿Qué debería responder ante una crisis?',
  ];

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send([String? preset]) async {
    final text = preset ?? _input.text;
    if (text.trim().isEmpty) return;
    _input.clear();
    FocusScope.of(context).unfocus();
    await ref.read(juliaControllerProvider.notifier).send(text);
    _scrollToEnd();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(juliaControllerProvider);
    ref.listen(juliaControllerProvider, (_, __) => _scrollToEnd());

    final state = async.asData?.value ?? const JuliaState();
    final messages = state.messages;
    final sending = messages.isNotEmpty && messages.last.pending;

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          titleSpacing: 0,
          title: Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: const BoxDecoration(
                  gradient: AppColors.brandGradient,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Julia', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  Text(
                    sending ? 'escribiendo…' : 'Asistente de reputación',
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            IconButton(
              tooltip: 'Nueva conversación',
              icon: const Icon(Icons.add_comment_outlined),
              onPressed: () => ref.read(juliaControllerProvider.notifier).clear(),
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Chat'),
              Tab(text: 'Análisis'),
              Tab(text: 'Reportes'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _chatBody(async, messages, sending),
            const _AnalisisTab(),
            const _ReportesTab(),
          ],
        ),
      ),
    );
  }

  Widget _chatBody(
      AsyncValue<JuliaState> async, List<JuliaMessage> messages, bool sending) {
    return Column(
      children: [
        Expanded(
          child: async.isLoading
              ? const Center(child: CircularProgressIndicator())
              : messages.isEmpty
                  ? _Welcome(onPick: _send)
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.fromLTRB(14, 16, 14, 16),
                      itemCount: messages.length,
                      itemBuilder: (_, i) => _Bubble(messages[i]),
                    ),
        ),
        _Composer(controller: _input, sending: sending, onSend: () => _send()),
      ],
    );
  }
}

class _Welcome extends StatelessWidget {
  const _Welcome({required this.onPick});
  final void Function(String) onPick;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 24),
        SizedBox(
          height: 150,
          child: Stack(
            alignment: Alignment.center,
            children: [
              const Positioned.fill(child: NeuralBackground(nodeCount: 18)),
              Container(
                width: 76,
                height: 76,
                decoration: const BoxDecoration(
                  gradient: AppColors.brandGradient,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 38),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Text('Hola, soy Julia',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        const Text(
          'Tu asistente de reputación online. Preguntame sobre tus menciones, sentimiento, crisis o estrategia.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.muted, fontSize: 13),
        ),
        const SizedBox(height: 28),
        ..._JuliaScreenState._suggestions.map(
          (s) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: OutlinedButton(
              onPressed: () => onPick(s),
              style: OutlinedButton.styleFrom(
                alignment: Alignment.centerLeft,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.bolt, size: 16, color: AppColors.cyan),
                  const SizedBox(width: 10),
                  Expanded(child: Text(s, style: const TextStyle(fontSize: 13))),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble(this.m);
  final JuliaMessage m;

  @override
  Widget build(BuildContext context) {
    final isUser = m.isUser;
    final bg = m.error
        ? AppColors.danger.withValues(alpha: 0.12)
        : isUser
            ? AppColors.cyan
            : Theme.of(context).colorScheme.surfaceContainerHighest;
    final fg = isUser ? AppColors.accentNavy : Theme.of(context).colorScheme.onSurface;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isUser ? 16 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 16),
          ),
        ),
        child: m.pending
            ? const _TypingDots()
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (m.error)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.error_outline, size: 14, color: AppColors.danger),
                          SizedBox(width: 4),
                          Text('Aviso', style: TextStyle(fontSize: 11, color: AppColors.danger, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  SelectableText(
                    m.content,
                    style: TextStyle(color: m.error ? null : fg, fontSize: 14, height: 1.35),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    Fmt.relative(m.timestamp),
                    style: TextStyle(
                      fontSize: 10,
                      color: (isUser ? AppColors.accentNavy : AppColors.muted).withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _TypingDots extends StatefulWidget {
  const _TypingDots();
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 40,
      height: 18,
      child: AnimatedBuilder(
        animation: _c,
        builder: (_, __) {
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(3, (i) {
              final t = (_c.value + i * 0.2) % 1.0;
              final scale = 0.6 + 0.4 * (1 - (t - 0.5).abs() * 2).clamp(0, 1);
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Transform.scale(
                  scale: scale,
                  child: const CircleAvatar(radius: 4, backgroundColor: AppColors.cyan),
                ),
              );
            }),
          );
        },
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.sending, required this.onSend});
  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(top: BorderSide(color: Theme.of(context).dividerColor.withValues(alpha: 0.4))),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 5,
                textInputAction: TextInputAction.newline,
                decoration: const InputDecoration(
                  hintText: 'Escribile a Julia…',
                  border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(22))),
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 46,
              height: 46,
              child: FloatingActionButton(
                heroTag: 'julia-send',
                elevation: 0,
                onPressed: sending ? null : onSend,
                backgroundColor: sending ? AppColors.muted : AppColors.cyan,
                child: sending
                    ? const SizedBox(
                        width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send, color: AppColors.accentNavy, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// ── Pestaña "Análisis": texto → sentimiento ──────────────────────────────
class _AnalisisTab extends ConsumerStatefulWidget {
  const _AnalisisTab();

  @override
  ConsumerState<_AnalisisTab> createState() => _AnalisisTabState();
}

class _AnalisisTabState extends ConsumerState<_AnalisisTab> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _run() {
    FocusScope.of(context).unfocus();
    ref.read(juliaAnalysisProvider.notifier).analyze(_ctrl.text);
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(juliaAnalysisProvider);
    final loading = async.isLoading;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Pegá un texto (comentario, reseña, tuit…) y Julia te dice el sentimiento. Cuesta 1 crédito.',
          style: TextStyle(color: AppColors.muted, fontSize: 13),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _ctrl,
          minLines: 3,
          maxLines: 8,
          decoration: const InputDecoration(
            hintText: 'Escribí o pegá el texto a analizar…',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: loading ? null : _run,
          icon: loading
              ? const _BtnSpinner()
              : const Icon(Icons.psychology_alt_outlined),
          label: Text(loading ? 'Analizando…' : 'Analizar sentimiento'),
        ),
        const SizedBox(height: 16),
        async.when(
          loading: () => const SizedBox.shrink(),
          error: (e, _) => _ErrorCard('$e'),
          data: (r) => r == null ? const SizedBox.shrink() : _SentimentCard(r),
        ),
      ],
    );
  }
}

class _SentimentCard extends StatelessWidget {
  const _SentimentCard(this.r);
  final SentimentResult r;

  @override
  Widget build(BuildContext context) {
    final pct = (r.score <= 1 ? r.score * 100 : r.score).clamp(0, 100).round();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                SentimentChip(r.sentiment),
                const Spacer(),
                Text('Confianza $pct%',
                    style: const TextStyle(color: AppColors.muted, fontSize: 12)),
              ],
            ),
            if (r.explanation.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(r.explanation,
                  style: const TextStyle(fontSize: 14, height: 1.35)),
            ],
          ],
        ),
      ),
    );
  }
}

/// ── Pestaña "Reportes": nombre/marca → informe de reputación ─────────────
class _ReportesTab extends ConsumerStatefulWidget {
  const _ReportesTab();

  @override
  ConsumerState<_ReportesTab> createState() => _ReportesTabState();
}

class _ReportesTabState extends ConsumerState<_ReportesTab> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _run() {
    FocusScope.of(context).unfocus();
    ref.read(juliaReportProvider.notifier).generate(_ctrl.text);
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(juliaReportProvider);
    final loading = async.isLoading;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Generá un informe de reputación de una persona o marca a partir de noticias en vivo.',
          style: TextStyle(color: AppColors.muted, fontSize: 13),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _ctrl,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => loading ? null : _run(),
          decoration: const InputDecoration(
            hintText: 'Nombre o marca (ej: Juan Pérez)',
            prefixIcon: Icon(Icons.search),
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: loading ? null : _run,
          icon: loading
              ? const _BtnSpinner()
              : const Icon(Icons.assessment_outlined),
          label: Text(loading ? 'Generando informe…' : 'Generar informe'),
        ),
        const SizedBox(height: 16),
        async.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 28),
            child: Center(
              child: Column(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 12),
                  Text('Buscando noticias y analizando…',
                      style: TextStyle(color: AppColors.muted, fontSize: 12)),
                ],
              ),
            ),
          ),
          error: (e, _) => _ErrorCard('$e'),
          data: (r) => r == null ? const SizedBox.shrink() : _ReportCard(r),
        ),
      ],
    );
  }
}

class _ReportCard extends StatelessWidget {
  const _ReportCard(this.r);
  final ReputationReport r;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                SizedBox(
                  width: 64,
                  height: 64,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 64,
                        height: 64,
                        child: CircularProgressIndicator(
                          value: (r.overallScore.clamp(0, 100)) / 100,
                          strokeWidth: 6,
                          backgroundColor: AppColors.borderLight,
                          valueColor:
                              const AlwaysStoppedAnimation(AppColors.cyan),
                        ),
                      ),
                      Text('${r.overallScore}',
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 18)),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.query.isEmpty ? 'Informe de reputación' : r.query,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          SentimentChip(r.sentiment),
                          const SizedBox(width: 8),
                          Text('${r.sourcesFound} fuentes',
                              style: const TextStyle(
                                  color: AppColors.muted, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (r.summary.isNotEmpty) ...[
          const SizedBox(height: 12),
          _block('Resumen',
              Text(r.summary, style: const TextStyle(fontSize: 14, height: 1.35))),
        ],
        if (r.strengths.isNotEmpty) ...[
          const SizedBox(height: 12),
          _bullets('Fortalezas', r.strengths, AppColors.success,
              Icons.check_circle_outline),
        ],
        if (r.risks.isNotEmpty) ...[
          const SizedBox(height: 12),
          _bullets('Riesgos', r.risks, AppColors.danger,
              Icons.warning_amber_rounded),
        ],
        if (r.recommendations.isNotEmpty) ...[
          const SizedBox(height: 12),
          _bullets('Recomendaciones', r.recommendations, AppColors.accentNavy,
              Icons.lightbulb_outline),
        ],
      ],
    );
  }

  Widget _block(String title, Widget child) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              child,
            ],
          ),
        ),
      );

  Widget _bullets(
          String title, List<String> items, Color color, IconData icon) =>
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style:
                      TextStyle(fontWeight: FontWeight.w700, color: color)),
              const SizedBox(height: 8),
              ...items.map(
                (s) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(icon, size: 16, color: color),
                      const SizedBox(width: 8),
                      Expanded(
                          child: Text(s,
                              style: const TextStyle(
                                  fontSize: 13.5, height: 1.3))),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard(this.message);
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.danger.withValues(alpha: 0.08),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: AppColors.danger),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontSize: 13.5))),
          ],
        ),
      ),
    );
  }
}

class _BtnSpinner extends StatelessWidget {
  const _BtnSpinner();
  @override
  Widget build(BuildContext context) => const SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
      );
}
