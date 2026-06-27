import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../data/api/api_client.dart';
import '../../shared/format.dart';
import '../../shared/widgets/async_view.dart';
import '../../shared/widgets/stat_card.dart';
import 'admin_providers.dart';

class AdminAppScreen extends ConsumerWidget {
  const AdminAppScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Admin · App Móvil'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Analíticas'),
              Tab(text: 'Notificaciones'),
              Tab(text: 'Versión / Mantenimiento'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [_AnalyticsTab(), _PushTab(), _ConfigTab()],
        ),
      ),
    );
  }
}

class _AnalyticsTab extends ConsumerWidget {
  const _AnalyticsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminAnalyticsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(adminAnalyticsProvider),
      child: AsyncView<AdminAnalytics>(
        value: async,
        onRetry: () => ref.invalidate(adminAnalyticsProvider),
        data: (a) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(children: [
              Expanded(child: StatCard(label: 'Dispositivos', value: Fmt.number(a.devicesTotal), icon: Icons.smartphone, color: AppColors.cyan)),
              const SizedBox(width: 12),
              Expanded(child: StatCard(label: 'Activos (7d)', value: Fmt.number(a.active7d), icon: Icons.check_circle_outline, color: AppColors.success)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: StatCard(label: 'Android', value: Fmt.number(a.android), icon: Icons.android, color: AppColors.success)),
              const SizedBox(width: 12),
              Expanded(child: StatCard(label: 'iOS', value: Fmt.number(a.ios), icon: Icons.phone_iphone, color: AppColors.accentNavy)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: StatCard(label: 'Sesiones (7d)', value: Fmt.number(a.sessions7d), icon: Icons.timeline, color: AppColors.cyan)),
              const SizedBox(width: 12),
              Expanded(child: StatCard(label: 'Sesiones (30d)', value: Fmt.number(a.sessions30d), icon: Icons.calendar_month, color: AppColors.cyanHover)),
            ]),
          ],
        ),
      ),
    );
  }
}

class _PushTab extends ConsumerStatefulWidget {
  const _PushTab();
  @override
  ConsumerState<_PushTab> createState() => _PushTabState();
}

class _PushTabState extends ConsumerState<_PushTab> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  final _plan = TextEditingController();
  String _segment = 'all';
  String _platform = 'android';
  bool _sending = false;

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    _plan.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_title.text.trim().isEmpty || _body.text.trim().isEmpty) return;
    setState(() => _sending = true);
    try {
      final (sent, failed, total) = await ref.read(adminAppActionsProvider).sendPush(
            title: _title.text.trim(),
            body: _body.text.trim(),
            segment: _segment,
            plan: _plan.text.trim(),
            platform: _platform,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Enviadas: $sent · Fallidas: $failed · Total: $total')),
        );
        _title.clear();
        _body.clear();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _title,
          maxLength: 64,
          decoration: const InputDecoration(labelText: 'Título'),
        ),
        TextField(
          controller: _body,
          maxLength: 240,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Mensaje'),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _segment,
          decoration: const InputDecoration(labelText: 'Segmento'),
          items: const [
            DropdownMenuItem(value: 'all', child: Text('Todos los dispositivos')),
            DropdownMenuItem(value: 'platform', child: Text('Por plataforma')),
            DropdownMenuItem(value: 'plan', child: Text('Por plan')),
          ],
          onChanged: (v) => setState(() => _segment = v ?? 'all'),
        ),
        if (_segment == 'platform') ...[
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _platform,
            decoration: const InputDecoration(labelText: 'Plataforma'),
            items: const [
              DropdownMenuItem(value: 'android', child: Text('Android')),
              DropdownMenuItem(value: 'ios', child: Text('iOS')),
            ],
            onChanged: (v) => setState(() => _platform = v ?? 'android'),
          ),
        ],
        if (_segment == 'plan') ...[
          const SizedBox(height: 12),
          TextField(
            controller: _plan,
            decoration: const InputDecoration(labelText: 'Código de plan (ej: pro)'),
          ),
        ],
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: _sending ? null : _send,
          icon: _sending
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.send),
          label: Text(_sending ? 'Enviando…' : 'Enviar notificación'),
          style: FilledButton.styleFrom(backgroundColor: AppColors.cyan, foregroundColor: AppColors.accentNavy),
        ),
      ],
    );
  }
}

class _ConfigTab extends ConsumerWidget {
  const _ConfigTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminConfigProvider);
    return AsyncView<AdminAppConfig>(
      value: async,
      onRetry: () => ref.invalidate(adminConfigProvider),
      data: (cfg) => _ConfigForm(cfg),
    );
  }
}

class _ConfigForm extends ConsumerStatefulWidget {
  const _ConfigForm(this.cfg);
  final AdminAppConfig cfg;
  @override
  ConsumerState<_ConfigForm> createState() => _ConfigFormState();
}

class _ConfigFormState extends ConsumerState<_ConfigForm> {
  late final TextEditingController _minV =
      TextEditingController(text: widget.cfg.minSupportedVersion);
  late final TextEditingController _latestV =
      TextEditingController(text: widget.cfg.latestVersion);
  late final TextEditingController _msg =
      TextEditingController(text: widget.cfg.maintenanceMessage);
  late bool _force = widget.cfg.forceUpdate;
  late bool _maintenance = widget.cfg.maintenanceMode;
  bool _saving = false;

  @override
  void dispose() {
    _minV.dispose();
    _latestV.dispose();
    _msg.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final cfg = widget.cfg
      ..minSupportedVersion = _minV.text.trim()
      ..latestVersion = _latestV.text.trim()
      ..maintenanceMessage = _msg.text.trim()
      ..forceUpdate = _force
      ..maintenanceMode = _maintenance;
    try {
      await ref.read(adminAppActionsProvider).saveConfig(cfg);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Configuración guardada.')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(controller: _minV, decoration: const InputDecoration(labelText: 'Versión mínima soportada')),
        const SizedBox(height: 12),
        TextField(controller: _latestV, decoration: const InputDecoration(labelText: 'Última versión')),
        const SizedBox(height: 4),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Forzar actualización'),
          value: _force,
          activeThumbColor: AppColors.cyan,
          onChanged: (v) => setState(() => _force = v),
        ),
        const Divider(),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Modo mantenimiento'),
          subtitle: const Text('Bloquea la app para todos'),
          value: _maintenance,
          activeThumbColor: AppColors.warning,
          onChanged: (v) => setState(() => _maintenance = v),
        ),
        TextField(
          controller: _msg,
          maxLines: 2,
          decoration: const InputDecoration(labelText: 'Mensaje de mantenimiento'),
        ),
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: _saving ? null : _save,
          icon: _saving
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.save),
          label: Text(_saving ? 'Guardando…' : 'Guardar cambios'),
          style: FilledButton.styleFrom(backgroundColor: AppColors.cyan, foregroundColor: AppColors.accentNavy),
        ),
      ],
    );
  }
}
