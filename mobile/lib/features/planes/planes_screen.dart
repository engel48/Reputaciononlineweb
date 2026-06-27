import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../data/api/api_client.dart';
import '../../data/models/plan.dart';
import '../../shared/format.dart';
import '../../shared/widgets/async_view.dart';
import '../auth/auth_controller.dart';
import 'planes_providers.dart';

class PlanesScreen extends ConsumerWidget {
  const PlanesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(plansProvider);
    final currentPlan = ref.watch(authControllerProvider).user?.plan;

    return Scaffold(
      appBar: AppBar(title: const Text('Planes')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(plansProvider),
        child: AsyncView<List<Plan>>(
          value: async,
          onRetry: () => ref.invalidate(plansProvider),
          data: (plans) => plans.isEmpty
              ? ListView(children: const [
                  SizedBox(height: 110),
                  EmptyState(message: 'No hay planes disponibles por ahora.'),
                ])
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: plans
                      .map((p) => _PlanCard(plan: p, isCurrent: p.code == currentPlan))
                      .toList(),
                ),
        ),
      ),
    );
  }
}

class _PlanCard extends ConsumerStatefulWidget {
  const _PlanCard({required this.plan, required this.isCurrent});
  final Plan plan;
  final bool isCurrent;

  @override
  ConsumerState<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends ConsumerState<_PlanCard> {
  bool _loading = false;

  Future<void> _subscribe() async {
    final p = widget.plan;
    if (p.priceCop <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Este plan es gratuito o se gestiona desde soporte.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await ref.read(apiClientProvider).post('/payments/create-session', body: {
        'type': 'plan',
        'planId': p.code,
        'billingCycle': 'monthly',
        'amount': p.priceCop,
        'currency': 'COP',
      });
      final data = (res['data'] as Map?)?.cast<String, dynamic>();
      final url = data?['wompiCheckoutUrl']?.toString();
      if (url == null || url.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('El checkout no está disponible en este momento.')),
          );
        }
        return;
      }
      if (!mounted) return;
      final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (_) => CheckoutWebView(url: url, planName: p.name),
        ),
      );
      if (ok == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pago registrado. Tu plan se activará al confirmarse.')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.plan;
    final highlight = p.isPopular;
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: highlight
            ? const BorderSide(color: AppColors.cyan, width: 1.5)
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(p.name,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(width: 8),
                if (highlight)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.cyan.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('Popular',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.cyanHover)),
                  ),
                const Spacer(),
                if (widget.isCurrent)
                  const Chip(
                    label: Text('Actual'),
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
            const SizedBox(height: 4),
            if (p.description.isNotEmpty)
              Text(p.description, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(p.priceCop > 0 ? Fmt.cop(p.priceCop) : 'Gratis',
                    style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                if (p.priceCop > 0)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 4, left: 4),
                    child: Text('/mes', style: TextStyle(color: AppColors.muted, fontSize: 13)),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            _feature(Icons.bolt, '${Fmt.number(p.monthlyCredits)} créditos / mes'),
            _feature(Icons.hub_outlined, '${p.maxSocialAccounts} cuentas sociales'),
            ...p.activeFeatures.take(5).map((f) => _feature(Icons.check_circle_outline, f)),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: (_loading || widget.isCurrent) ? null : _subscribe,
                style: FilledButton.styleFrom(
                  backgroundColor: highlight ? AppColors.cyan : null,
                  foregroundColor: highlight ? AppColors.accentNavy : null,
                ),
                child: _loading
                    ? const SizedBox(
                        width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(widget.isCurrent ? 'Plan actual' : 'Suscribirme'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _feature(IconData icon, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          children: [
            Icon(icon, size: 16, color: AppColors.success),
            const SizedBox(width: 8),
            Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
          ],
        ),
      );
}

/// WebView del checkout Wompi. Detecta el retorno al callback de pagos.
class CheckoutWebView extends StatefulWidget {
  const CheckoutWebView({super.key, required this.url, required this.planName});
  final String url;
  final String planName;

  @override
  State<CheckoutWebView> createState() => _CheckoutWebViewState();
}

class _CheckoutWebViewState extends State<CheckoutWebView> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: (_) => setState(() => _loading = false),
          onNavigationRequest: (req) {
            if (req.url.contains('/api/payments/callback')) {
              if (mounted) Navigator.of(context).pop(true);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Pago · ${widget.planName}'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(false),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const LinearProgressIndicator(minHeight: 3),
        ],
      ),
    );
  }
}
