import '../../shared/format.dart';

/// Alerta de crisis de reputación detectada para el usuario.
class CrisisAlert {
  CrisisAlert({
    required this.id,
    required this.type,
    required this.severity,
    required this.description,
    required this.status,
    required this.createdAt,
    this.aiResponse,
  });

  final String id;
  final String type;
  final String severity; // low | medium | high | critical
  final String description;
  final String status; // active | acknowledged | resolved
  final DateTime? createdAt;
  final String? aiResponse;

  factory CrisisAlert.fromJson(Map<String, dynamic> j) {
    final trigger = (j['trigger_data'] as Map?)?.cast<String, dynamic>();
    return CrisisAlert(
      id: (j['id'] ?? '').toString(),
      type: (j['type'] ?? 'media_coverage').toString(),
      severity: (j['severity'] ?? 'medium').toString(),
      description: (j['description'] ?? '').toString(),
      status: (j['status'] ?? 'active').toString(),
      createdAt: Fmt.parseDate(j['created_at']),
      aiResponse: (j['ai_response'] ?? trigger?['ai_response'])?.toString(),
    );
  }

  String get typeLabel {
    switch (type) {
      case 'negative_spike':
        return 'Pico de negatividad';
      case 'sentiment_drop':
        return 'Caída de sentimiento';
      case 'influential_criticism':
        return 'Crítica influyente';
      case 'trending_negative':
        return 'Tendencia negativa';
      case 'media_coverage':
        return 'Cobertura mediática';
      default:
        return type;
    }
  }

  String get severityLabel {
    switch (severity) {
      case 'critical':
        return 'Crítica';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return severity;
    }
  }
}
