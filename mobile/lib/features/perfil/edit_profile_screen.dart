import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/api/api_client.dart';
import '../../data/models/user.dart';
import '../auth/auth_controller.dart';

/// Edición de los datos básicos del perfil (nombre, empresa, teléfono, bio).
/// Persiste con PUT /api/users y refresca el usuario en sesión.
class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _company;
  late final TextEditingController _phone;
  late final TextEditingController _bio;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    _name = TextEditingController(text: user?.name ?? '');
    _company = TextEditingController(text: user?.company ?? '');
    _phone = TextEditingController(text: user?.phone ?? '');
    _bio = TextEditingController(text: user?.bio ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _company.dispose();
    _phone.dispose();
    _bio.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final user = ref.read(authControllerProvider).user;
    if (user == null) return;

    setState(() => _saving = true);
    try {
      final res = await ref.read(apiClientProvider).put('/users', body: {
        'userId': user.id,
        'name': _name.text.trim(),
        'company': _company.text.trim(),
        'phone': _phone.text.trim(),
        'bio': _bio.text.trim(),
      });
      final updated = AppUser.fromJson(
          ((res as Map)['user'] as Map).cast<String, dynamic>());
      await ref.read(authControllerProvider.notifier).setUser(updated);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Perfil actualizado')),
      );
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo guardar. Intentá de nuevo.')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Editar perfil')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Nombre',
                prefixIcon: Icon(Icons.person_outline),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Ingresá tu nombre' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _company,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Empresa (opcional)',
                prefixIcon: Icon(Icons.business_outlined),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Teléfono (opcional)',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _bio,
              minLines: 2,
              maxLines: 4,
              maxLength: 280,
              decoration: const InputDecoration(
                labelText: 'Bio (opcional)',
                prefixIcon: Icon(Icons.notes_outlined),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.check),
              label: Text(_saving ? 'Guardando…' : 'Guardar cambios'),
            ),
          ],
        ),
      ),
    );
  }
}
