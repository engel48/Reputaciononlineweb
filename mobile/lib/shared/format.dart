/// Formateo de números y fechas (sin dependencia de locale para evitar init).
class Fmt {
  static String number(num v) {
    final s = v.toStringAsFixed(0);
    final buf = StringBuffer();
    final neg = s.startsWith('-');
    final digits = neg ? s.substring(1) : s;
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) buf.write('.');
      buf.write(digits[i]);
    }
    return (neg ? '-' : '') + buf.toString();
  }

  static String compact(num v) {
    if (v.abs() >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
    if (v.abs() >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return number(v);
  }

  static String relative(DateTime? d) {
    if (d == null) return '';
    final diff = DateTime.now().difference(d);
    if (diff.inSeconds < 60) return 'ahora';
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes}m';
    if (diff.inHours < 24) return 'hace ${diff.inHours}h';
    if (diff.inDays < 7) return 'hace ${diff.inDays}d';
    return date(d);
  }

  /// Moneda colombiana, p. ej. "$ 49.900".
  static String cop(num v) => '\$ ${number(v)}';

  static String date(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  static DateTime? parseDate(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    return DateTime.tryParse('$v')?.toLocal();
  }
}
