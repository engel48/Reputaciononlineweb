/// Plan de suscripción disponible.
class Plan {
  Plan({
    required this.code,
    required this.name,
    required this.description,
    required this.priceCop,
    required this.monthlyCredits,
    required this.maxSocialAccounts,
    required this.features,
    required this.isPopular,
    required this.displayOrder,
  });

  final String code;
  final String name;
  final String description;
  final int priceCop;
  final int monthlyCredits;
  final int maxSocialAccounts;
  final Map<String, bool> features;
  final bool isPopular;
  final int displayOrder;

  factory Plan.fromJson(Map<String, dynamic> j) => Plan(
        code: (j['code'] ?? '').toString(),
        name: (j['name'] ?? '').toString(),
        description: (j['description'] ?? '').toString(),
        priceCop: (j['priceCop'] as num?)?.toInt() ?? 0,
        monthlyCredits: (j['monthlyCredits'] as num?)?.toInt() ?? 0,
        maxSocialAccounts: (j['maxSocialAccounts'] as num?)?.toInt() ?? 0,
        features: ((j['features'] as Map?) ?? const {})
            .map((k, v) => MapEntry(k.toString(), v == true)),
        isPopular: j['isPopular'] == true,
        displayOrder: (j['displayOrder'] as num?)?.toInt() ?? 0,
      );

  /// Lista de features activas, legibles.
  List<String> get activeFeatures =>
      features.entries.where((e) => e.value).map((e) => _label(e.key)).toList();

  static String _label(String key) {
    final words = key.replaceAll('_', ' ');
    return words.isEmpty ? key : '${words[0].toUpperCase()}${words.substring(1)}';
  }
}
