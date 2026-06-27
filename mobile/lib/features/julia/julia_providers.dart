import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/api/api_client.dart';
import '../../data/models/julia.dart';

/// Estado del chat con Julia: lista de mensajes + saldo de créditos conocido.
class JuliaState {
  const JuliaState({this.messages = const [], this.balance});
  final List<JuliaMessage> messages;
  final int? balance;

  JuliaState copyWith({List<JuliaMessage>? messages, int? balance}) =>
      JuliaState(messages: messages ?? this.messages, balance: balance ?? this.balance);
}

/// Costo en créditos de un mensaje de chat (alineado con CREDIT_COSTS.julia_chat = 1).
const int kJuliaChatCost = 1;

class JuliaController extends AsyncNotifier<JuliaState> {
  ApiClient get _api => ref.read(apiClientProvider);

  @override
  Future<JuliaState> build() async {
    // Carga el hilo activo del usuario (la conversación más reciente).
    try {
      final res = await _api.get('/julia', query: {'history': 1});
      final list = (res['data'] as List?) ?? const [];
      if (list.isEmpty) return const JuliaState();
      final active = (list.first as Map).cast<String, dynamic>();
      final msgs = ((active['messages'] as List?) ?? const [])
          .map((e) => JuliaMessage.fromJson((e as Map).cast<String, dynamic>()))
          .toList();
      return JuliaState(messages: msgs);
    } catch (_) {
      // Sin historial (o error de red): arrancamos con chat vacío.
      return const JuliaState();
    }
  }

  /// Envía un mensaje del usuario y agrega la respuesta de Julia.
  Future<void> send(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    final current = state.asData?.value ?? const JuliaState();

    final now = DateTime.now();
    final userMsg = JuliaMessage(role: 'user', content: trimmed, timestamp: now);
    final typing = JuliaMessage(
      role: 'assistant',
      content: '',
      timestamp: now,
      pending: true,
    );
    final base = [...current.messages, userMsg, typing];
    state = AsyncData(current.copyWith(messages: base));

    try {
      final res = await _api.post('/julia', body: {
        'action': 'chat',
        'message': trimmed,
      });
      final response = (res['response'] ?? '').toString();
      final credits = (res['credits'] as Map?)?.cast<String, dynamic>();
      final newBalance = (credits?['newBalance'] as num?)?.toInt();

      final reply = JuliaMessage(
        role: 'assistant',
        content: response.isEmpty
            ? 'No recibí respuesta. Intentá de nuevo en un momento.'
            : response,
        timestamp: DateTime.now(),
      );
      final updated = [...current.messages, userMsg, reply];
      state = AsyncData(JuliaState(messages: updated, balance: newBalance ?? current.balance));
    } on ApiException catch (e) {
      final msg = e.isPaymentRequired
          ? (e.data is Map && (e.data as Map)['response'] != null
              ? (e.data as Map)['response'].toString()
              : 'No tenés créditos suficientes para chatear con Julia.')
          : 'Julia tuvo un problema: ${e.message}';
      final errMsg = JuliaMessage(
        role: 'assistant',
        content: msg,
        timestamp: DateTime.now(),
        error: true,
      );
      final updated = [...current.messages, userMsg, errMsg];
      state = AsyncData(current.copyWith(messages: updated));
    }
  }

  void clear() => state = const AsyncData(JuliaState());
}

final juliaControllerProvider =
    AsyncNotifierProvider<JuliaController, JuliaState>(JuliaController.new);
