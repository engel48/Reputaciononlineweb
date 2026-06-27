import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/crisis_alert.dart';
import '../../shared/format.dart';
import '../../shared/widgets/async_view.dart';
import 'crisis_providers.dart';

class CrisisScreen extends ConsumerStatefulWidget {
  const CrisisScreen({super.key});

  @override
  ConsumerState<CrisisScreen> createState() => _CrisisScreenState();
}

class _CrisisScreenState extends ConsumerState<CrisisScreen> {
  String _status = 'active';

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(crisisAlertsProvider(_status));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Crisis'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: SizedBox(
            height: 52,
            child: Row(
              children: [
                const SizedBox(width: 12),
                for (final s in const [
                  ['active', 'Activas'],
                  ['acknowledged', 'En curso'],
                  ['resolved', 'Resueltas'],
                  ['all', 'Todas'],
                ])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(s[1]),
                      selected: _status == s[0],
                      selectedColor: AppColors.cyan.withValues(alpha: 0.2),
                      onSelected: (_) => setState(() => _status = s[0]),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(crisisAlertsProvider(_status)),
        child: AsyncView<List<CrisisAlert>>(
          value: async,
          onRetry: () => ref.invalidate(crisisAlertsProvider(_status)),
          data: (items) => items.isEmpty
              ? ListView(children: const [
                  SizedBox(height: 110),
                  EmptyState(
                    icon: Icons.shield_outlined,
                    message: 'Sin crisis en este estado.\nTu reputación está tranquila por ahora.',
                  ),
                ])
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  itemBuilder: (_, i) => _AlertCard(items[i]),
                ),
        ),
      ),
    );
  }
}

class _AlertCard extends ConsumerStatefulWidget {
  const _AlertCard(this.a);
  final CrisisAlert a;

  @override
  ConsumerState<_AlertCard> createState() => _AlertCardState();
}

class _AlertCardState extends ConsumerState<_AlertCard> {
  bool _loadingAi = false;
  String? _aiResponse;

  Color get _sevColor {
    switch (widget.a.severity) {
      case 'critical':
        return AppColors.danger;
      case 'high':
        return const Color(0xFFFB7185);
      case 'medium':
        return AppColors.warning;
      default:
        return AppColors.muted;
    }
  }

  Future<void> _generate() async {
    setState(() => _loadingAi = true);
    try {
      final res = await ref.read(crisisActionsProvider).generateResponse(widget.a.id);
      setState(() => _aiResponse = res.isEmpty ? 'No se pudo generar una respuesta.' : res);
    } catch (e) {
      setState(() => _aiResponse = 'Error: $e');
    } finally {
      if (mounted) setState(() => _loadingAi = false);
    }
  }

  Future<void> _setStatus(String status) async {
    await ref.read(crisisActionsProvider).setStatus(widget.a.id, status);
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.a;
    final ai = _aiResponse ?? a.aiResponse;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _sevColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.warning_amber_rounded, size: 14, color: _sevColor),
                      const SizedBox(width: 4),
                      Text(a.severityLabel,
                          style: TextStyle(color: _sevColor, fontWeight: FontWeight.w700, fontSize: 11)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(a.typeLabel,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                ),
                Text(Fmt.relative(a.createdAt),
                    style: const TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
            const SizedBox(height: 8),
            Text(a.description, style: const TextStyle(fontSize: 13.5, height: 1.35)),
            if (ai != null && ai.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.cyan.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cyan.withValues(alpha: 0.25)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.auto_awesome, size: 14, color: AppColors.cyanHover),
                        SizedBox(width: 6),
                        Text('Respuesta sugerida por Julia',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.cyanHover)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    SelectableText(ai, style: const TextStyle(fontSize: 13, height: 1.4)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                if (ai == null || ai.isEmpty)
                  OutlinedButton.icon(
                    onPressed: _loadingAi ? null : _generate,
                    icon: _loadingAi
                        ? const SizedBox(
                            width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.auto_awesome, size: 16),
                    label: Text(_loadingAi ? 'Generando…' : 'Respuesta IA'),
                  ),
                const Spacer(),
                if (a.status == 'active')
                  TextButton(
                      onPressed: () => _setStatus('acknowledged'),
                      child: const Text('Marcar en curso')),
                if (a.status != 'resolved')
                  TextButton(
                      onPressed: () => _setStatus('resolved'),
                      child: const Text('Resolver')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
