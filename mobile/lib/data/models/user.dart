/// Usuario autenticado (shape devuelto por /api/auth/login|register).
class AppUser {
  AppUser({
    required this.id,
    required this.email,
    this.name,
    this.company,
    this.phone,
    this.plan = 'free',
    this.credits = 0,
    this.role = 'user',
    this.profileType,
    this.avatarUrl,
    this.onboardingCompleted = false,
    this.emailVerified = false,
    this.raw = const {},
  });

  final String id;
  final String email;
  final String? name;
  final String? company;
  final String? phone;
  final String plan;
  final int credits;
  final String role;
  final String? profileType;
  final String? avatarUrl;
  final bool onboardingCompleted;
  final bool emailVerified;
  final Map<String, dynamic> raw;

  bool get isAdmin => role == 'admin';
  String get displayName => (name != null && name!.trim().isNotEmpty) ? name! : email;
  String get initials {
    final n = displayName.trim();
    if (n.isEmpty) return '?';
    final parts = n.split(RegExp(r'\s+'));
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 1).toUpperCase();
  }

  static int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse('$v') ?? 0;
  }

  static bool _toBool(dynamic v) => v == true || v == 'true' || v == 1;

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: '${j['id']}',
        email: '${j['email'] ?? ''}',
        name: j['name'] as String?,
        company: j['company'] as String?,
        phone: j['phone'] as String?,
        plan: '${j['plan'] ?? 'free'}',
        credits: _toInt(j['credits']),
        role: '${j['role'] ?? 'user'}',
        profileType: j['profileType'] as String? ?? j['profile_type'] as String?,
        avatarUrl: j['avatar'] as String? ??
            j['profileImage'] as String? ??
            j['profile_image'] as String?,
        onboardingCompleted:
            _toBool(j['onboardingCompleted'] ?? j['onboarding_completed']),
        emailVerified: _toBool(j['emailVerified'] ?? j['email_verified']),
        raw: j,
      );

  Map<String, dynamic> toJson() => raw.isNotEmpty
      ? raw
      : {
          'id': id,
          'email': email,
          'name': name,
          'plan': plan,
          'credits': credits,
          'role': role,
        };

  AppUser copyWith({int? credits, String? plan, String? name}) => AppUser(
        id: id,
        email: email,
        name: name ?? this.name,
        company: company,
        phone: phone,
        plan: plan ?? this.plan,
        credits: credits ?? this.credits,
        role: role,
        profileType: profileType,
        avatarUrl: avatarUrl,
        onboardingCompleted: onboardingCompleted,
        emailVerified: emailVerified,
        raw: raw,
      );
}
