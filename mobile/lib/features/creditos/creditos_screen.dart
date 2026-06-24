import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/credit.dart';
import '../../shared/format.dart';
import '../../shared/widgets/async_view.dart';
import '../../shared/widgets/stat_card.dart';
import 'creditos_providers.dart';

class CreditosScreen extends ConsumerWidget {
  const CreditosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(creditsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Créditos')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(creditsProvider),
        child: AsyncView<CreditSummary>(
          value: async,
          onRetry: () => ref.invalidate(creditsProvider),
          data: (c) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _BalanceCard(c.balance),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      label: 'Comprados',
                      value: Fmt.number(c.totalPurchased),
                      icon: Icons.add_circle_outline,
                      color: AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      label: 'Usados',
                      value: Fmt.number(c.totalUsed),
                      icon: Icons.remove_circle_outline,
                      color: AppColors.warning,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('La compra de créditos llega en la próxima fase.')),
                ),
                icon: const Icon(Icons.bolt),
                label: const Text('Recargar créditos'),
              ),
              const SizedBox(height: 24),
              Text('Historial', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (c.transactions.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: EmptyState(message: 'Sin movimientos todavía'),
                )
              else
                ...c.transactions.map((t) => _TxTile(t)),
            ],
          ),
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard(this.balance);
  final int balance;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Container(
        decoration: BoxDecoration(
          gradient: AppColors.brandGradient,
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(22),
        width: double.infinity,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Saldo disponible',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Icon(Icons.bolt, color: AppColors.cyan, size: 30),
                const SizedBox(width: 6),
                Text(Fmt.number(balance),
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 38,
                        fontWeight: FontWeight.w800)),
                const SizedBox(width: 8),
                const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Text('créditos',
                      style: TextStyle(color: Colors.white70, fontSize: 13)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TxTile extends StatelessWidget {
  const _TxTile(this.t);
  final CreditTx t;

  @override
  Widget build(BuildContext context) {
    final color = t.isCredit ? AppColors.success : AppColors.danger;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.14),
          child: Icon(t.isCredit ? Icons.south_west : Icons.north_east,
              color: color, size: 18),
        ),
        title: Text(
          t.description.isEmpty ? _typeLabel(t.type) : t.description,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14),
        ),
        subtitle: Text(Fmt.relative(t.createdAt)),
        trailing: Text(
          '${t.isCredit ? '+' : ''}${Fmt.number(t.amount)}',
          style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
    );
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'purchase':
        return 'Compra de créditos';
      case 'bonus':
        return 'Bono';
      case 'usage':
        return 'Uso';
      case 'refund':
        return 'Reembolso';
      default:
        return type;
    }
  }
}
