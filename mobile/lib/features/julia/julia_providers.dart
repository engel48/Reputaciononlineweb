import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/api/api_client.dart';
import '../../data/models/julia.dart';
import '../auth/auth_controller.dart';

/// Refresca el saldo de créditos en sesión a partir de la respuesta de /julia.
void _applyCredits(Ref ref, dynamic res) {
  final credits = (res is Map ? res['credits'] as Map? : null)?.cast<String, dynamic>();
  final newBalance = (credits?['newBalance'] as num?)?.toInt();
  if (newBalance == null) return;
  final user = ref.read(authControllerProvider).user;
  if (user != null) {
    ref.read(authControllerProvider.notifier).setUser(user.copyWith(credits: newBalance));
  }
}

/// Mensaje de error limpio para Julia: NUNCA expone errores crudos del backend
/// ni del proveedor de IA. Detecta créditos (402) y saturación/límite diario.
String _juliaError(ApiException e) {
  if (e.isPaymentRequired) {
    return 'No te alcanzan los créditos para esta acción. Recargá desde Créditos.';
  }
  final raw = '${e.message} ${e.data ?? ''}'.toLowerCase();
  if (raw.contains('rate_limit') ||
      raw.contains('rate limit') ||
      raw.contains('limit reached') ||
      raw.contains('429') ||
      raw.contains('límite') ||
      raw.contains('limite') ||
      raw.contains('demasiad') ||
      raw.contains('try again')) {
    return 'Julia está con mucha demanda en este momento 🤖. Probá de nuevo en unos minutos.';
  }
  return 'Julia no pudo responder ahora. Probá de nuevo en un momento.';
}

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
      final errMsg = JuliaMessage(
        role: 'assistant',
        content: _juliaError(e),
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

/// ── Análisis de sentimiento de un texto (pestaña "Análisis") ──────────────
class JuliaAnalysisController extends Notifier<AsyncValue<SentimentResult?>> {
  @override
  AsyncValue<SentimentResult?> build() => const AsyncData(null);

  Future<void> analyze(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    state = const AsyncLoading();
    try {
      final res = await ref.read(apiClientProvider).post('/julia', body: {
        'action': 'analyze',
        'message': trimmed,
      });
      _applyCredits(ref, res);
      state = AsyncData(SentimentResult.fromResponse((res as Map)['response']));
    } on ApiException catch (e) {
      state = AsyncError(_juliaError(e), StackTrace.current);
    }
  }

  void reset() => state = const AsyncData(null);
}

final juliaAnalysisProvider =
    NotifierProvider<JuliaAnalysisController, AsyncValue<SentimentResult?>>(
        JuliaAnalysisController.new);

/// ── Informe de reputación (pestaña "Reportes") ────────────────────────────
class JuliaReportController extends Notifier<AsyncValue<ReputationReport?>> {
  @override
  AsyncValue<ReputationReport?> build() => const AsyncData(null);

  Future<void> generate(String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return;
    state = const AsyncLoading();
    try {
      final res = await ref.read(apiClientProvider).post('/julia', body: {
        'action': 'reputation',
        'message': trimmed,
      });
      _applyCredits(ref, res);
      state = AsyncData(ReputationReport.fromResponse((res as Map)['response']));
    } on ApiException catch (e) {
      state = AsyncError(_juliaError(e), StackTrace.current);
    }
  }

  void reset() => state = const AsyncData(null);
}

final juliaReportProvider =
    NotifierProvider<JuliaReportController, AsyncValue<ReputationReport?>>(
        JuliaReportController.new);
