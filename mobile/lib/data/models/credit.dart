import '../../shared/format.dart';

int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;

/// Respuesta de GET /api/credits.
class CreditSummary {
  CreditSummary({
    required this.balance,
    required this.totalPurchased,
    required this.totalUsed,
    required this.transactions,
  });

  final int balance, totalPurchased, totalUsed;
  final List<CreditTx> transactions;

  factory CreditSummary.fromResponse(Map<String, dynamic> res) {
    final d = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
    return CreditSummary(
      balance: _i(d['balance']),
      totalPurchased: _i(d['totalPurchased']),
      totalUsed: _i(d['totalUsed']),
      transactions: ((d['transactions'] as List?) ?? [])
          .map((e) => CreditTx.fromJson((e as Map).cast<String, dynamic>()))
          .toList(),
    );
  }
}

class CreditTx {
  CreditTx({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.createdAt,
  });

  final String id, type, description;
  final int amount;
  final DateTime? createdAt;

  bool get isCredit => amount >= 0;

  factory CreditTx.fromJson(Map<String, dynamic> j) => CreditTx(
        id: '${j['id']}',
        type: '${j['type'] ?? ''}',
        amount: _i(j['amount']),
        description: '${j['description'] ?? ''}',
        createdAt: Fmt.parseDate(j['created_at']),
      );
}
