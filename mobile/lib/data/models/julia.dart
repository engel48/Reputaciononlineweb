/// Un mensaje del chat con Julia (usuario o asistente).
class JuliaMessage {
  JuliaMessage({
    required this.role,
    required this.content,
    required this.timestamp,
    this.pending = false,
    this.error = false,
  });

  final String role; // 'user' | 'assistant'
  final String content;
  final DateTime timestamp;

  /// True mientras se espera la respuesta del backend (burbuja "escribiendo…").
  final bool pending;

  /// True si esta burbuja representa un error (créditos, red, etc.).
  final bool error;

  bool get isUser => role == 'user';

  factory JuliaMessage.fromJson(Map<String, dynamic> j) {
    return JuliaMessage(
      role: (j['role'] ?? 'assistant').toString(),
      content: (j['content'] ?? '').toString(),
      timestamp: DateTime.tryParse((j['created_at'] ?? '').toString())?.toLocal() ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }

  JuliaMessage copyWith({String? content, bool? pending, bool? error}) {
    return JuliaMessage(
      role: role,
      content: content ?? this.content,
      timestamp: timestamp,
      pending: pending ?? this.pending,
      error: error ?? this.error,
    );
  }
}
