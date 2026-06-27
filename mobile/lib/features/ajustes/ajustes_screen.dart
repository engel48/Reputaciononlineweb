import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/theme_mode_provider.dart';
import '../../data/api/api_client.dart';
import '../auth/auth_controller.dart';

class AjustesScreen extends ConsumerWidget {
  const AjustesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Ajustes')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _section(context, 'Apariencia'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Tema',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  SegmentedButton<ThemeMode>(
                    segments: const [
                      ButtonSegment(
                          value: ThemeMode.light,
                          icon: Icon(Icons.light_mode_outlined),
                          label: Text('Claro')),
                      ButtonSegment(
                          value: ThemeMode.dark,
                          icon: Icon(Icons.dark_mode_outlined),
                          label: Text('Oscuro')),
                      ButtonSegment(
                          value: ThemeMode.system,
                          icon: Icon(Icons.smartphone_outlined),
                          label: Text('Sistema')),
                    ],
                    selected: {mode},
                    onSelectionChanged: (s) => ref
                        .read(themeModeProvider.notifier)
                        .set(s.first),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          _section(context, 'Seguridad'),
          Card(
            child: ListTile(
              leading: const Icon(Icons.lock_outline, color: AppColors.cyanHover),
              title: const Text('Cambiar contraseña'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _openChangePassword(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(BuildContext context, String title) => Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 8),
        child: Text(title,
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(color: AppColors.muted)),
      );

  void _openChangePassword(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _ChangePasswordSheet(),
    );
  }
}

class _ChangePasswordSheet extends ConsumerStatefulWidget {
  const _ChangePasswordSheet();

  @override
  ConsumerState<_ChangePasswordSheet> createState() =>
      _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends ConsumerState<_ChangePasswordSheet> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(authRepositoryProvider).changePassword(
            currentPassword: _current.text,
            newPassword: _next.text,
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Contraseña actualizada')),
      );
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudo cambiar. Intentá de nuevo.');
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 4, 16, 16 + bottom),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Cambiar contraseña',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            TextFormField(
              controller: _current,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Contraseña actual',
                prefixIcon: Icon(Icons.lock_outline),
              ),
              validator: (v) =>
                  (v == null || v.isEmpty) ? 'Ingresá tu contraseña actual' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _next,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Nueva contraseña',
                prefixIcon: Icon(Icons.lock_reset_outlined),
              ),
              validator: (v) => (v == null || v.length < 6)
                  ? 'Mínimo 6 caracteres'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _confirm,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Repetir nueva contraseña',
                prefixIcon: Icon(Icons.lock_reset_outlined),
              ),
              validator: (v) =>
                  v != _next.text ? 'Las contraseñas no coinciden' : null,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!,
                  style: const TextStyle(color: AppColors.danger, fontSize: 13)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _saving ? null : _submit,
              child: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Guardar'),
            ),
          ],
        ),
      ),
    );
  }
}
