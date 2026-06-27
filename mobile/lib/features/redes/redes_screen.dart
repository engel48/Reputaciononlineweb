import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/env.dart';
import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/dashboard.dart';
import '../../shared/format.dart';
import '../../shared/platform_ui.dart';
import '../../shared/widgets/async_view.dart';
import 'redes_providers.dart';

class RedesScreen extends ConsumerWidget {
  const RedesScreen({super.key});

  // provider OAuth key → plataforma del backend (/api/auth/{key})
  static const _platforms = [
    ['youtube', 'YouTube'],
    ['facebook', 'Facebook'],
    ['instagram', 'Instagram'],
    ['twitter', 'X (Twitter)'],
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(redesStatusProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Redes sociales')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(redesStatusProvider),
        child: AsyncView<Map<String, PlatformStat>>(
          value: async,
          onRetry: () => ref.invalidate(redesStatusProvider),
          data: (status) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text(
                'Conectá tus cuentas para monitorear menciones, seguidores y engagement en tiempo real.',
                style: TextStyle(color: AppColors.muted, fontSize: 13),
              ),
              const SizedBox(height: 16),
              ..._platforms.map((p) {
                // El backend usa 'x' como clave de plataforma para Twitter.
                final statusKey = p[0] == 'twitter' ? 'x' : p[0];
                final stat = status[statusKey];
                return _PlatformCard(
                  oauthKey: p[0],
                  label: p[1],
                  iconKey: statusKey,
                  stat: stat,
                  onChanged: () => ref.invalidate(redesStatusProvider),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlatformCard extends ConsumerWidget {
  const _PlatformCard({
    required this.oauthKey,
    required this.label,
    required this.iconKey,
    required this.stat,
    required this.onChanged,
  });

  final String oauthKey;
  final String label;
  final String iconKey;
  final PlatformStat? stat;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connected = stat?.connected == true;
    final color = PlatformUi.color(iconKey);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: color.withValues(alpha: 0.15),
              child: Icon(PlatformUi.icon(iconKey), color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(
                    connected
                        ? '${Fmt.compact(stat?.followers ?? 0)} seguidores · conectada'
                        : 'No conectada',
                    style: TextStyle(
                      fontSize: 12,
                      color: connected ? AppColors.success : AppColors.muted,
                    ),
                  ),
                ],
              ),
            ),
            connected
                ? const Icon(Icons.check_circle, color: AppColors.success)
                : FilledButton(
                    onPressed: () => _connect(context, ref),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.cyan,
                      foregroundColor: AppColors.accentNavy,
                    ),
                    child: const Text('Conectar'),
                  ),
          ],
        ),
      ),
    );
  }

  Future<void> _connect(BuildContext context, WidgetRef ref) async {
    final token = await ref.read(tokenStorageProvider).readToken();
    if (token == null || token.isEmpty) return;
    if (!context.mounted) return;
    // Resultado: 'ok' = conectada, null = cancelado, cualquier otra cosa = error.
    final result = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (_) => OAuthWebView(provider: oauthKey, label: label, token: token),
      ),
    );
    if (!context.mounted) return;
    if (result == 'ok') {
      onChanged();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$label conectada correctamente.')),
      );
    } else if (result != null && result.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo conectar $label: $result')),
      );
    }
  }
}

/// WebView que ejecuta el flujo OAuth del backend, inyectando el JWT como
/// cookie `auth-token` para que la conexión se asocie al usuario de la app.
/// Detecta el retorno al dashboard como éxito.
class OAuthWebView extends StatefulWidget {
  const OAuthWebView({
    super.key,
    required this.provider,
    required this.label,
    required this.token,
  });

  final String provider;
  final String label;
  final String token;

  @override
  State<OAuthWebView> createState() => _OAuthWebViewState();
}

class _OAuthWebViewState extends State<OAuthWebView> {
  WebViewController? _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final host = Uri.parse(Env.apiBaseUrl).host;
    final cookieManager = WebViewCookieManager();
    await cookieManager.setCookie(
      WebViewCookie(name: 'auth-token', value: widget.token, domain: host, path: '/'),
    );

    final startUrl = '${Env.apiBaseUrl}/api/auth/${widget.provider}?redirect=/oauth-app-success';

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _loading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onNavigationRequest: (req) {
            // Ruta terminal del flujo app: leer ?platform (éxito) o ?error (fallo).
            if (req.url.contains('/oauth-app-success')) {
              final err = Uri.tryParse(req.url)?.queryParameters['error'];
              if (mounted) {
                Navigator.of(context).pop((err != null && err.isNotEmpty) ? err : 'ok');
              }
              return NavigationDecision.prevent;
            }
            // Compatibilidad: si el backend redirige al dashboard, lo tomamos como éxito.
            if (req.url.contains('/dashboard')) {
              if (mounted) Navigator.of(context).pop('ok');
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(startUrl));
    if (mounted) setState(() => _controller = controller);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Conectar ${widget.label}'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _controller == null
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                WebViewWidget(controller: _controller!),
                if (_loading) const LinearProgressIndicator(minHeight: 3),
              ],
            ),
    );
  }
}
