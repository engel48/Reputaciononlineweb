import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/ajustes/ajustes_screen.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/auth/forgot_password_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/busqueda/busqueda_screen.dart';
import '../../features/crisis/crisis_screen.dart';
import '../../features/noticias/noticias_screen.dart';
import '../../features/notificaciones/notificaciones_screen.dart';
import '../../features/perfil/edit_profile_screen.dart';
import '../../features/perfil/perfil_screen.dart';
import '../../features/planes/planes_screen.dart';
import '../../features/redes/redes_screen.dart';
import '../../features/shell/home_shell.dart';
import '../../features/splash/splash_screen.dart';

const _authRoutes = {'/login', '/register', '/forgot'};

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc = state.matchedLocation;

      if (auth.status == AuthStatus.unknown) {
        return loc == '/splash' ? null : '/splash';
      }
      final onAuthRoute = _authRoutes.contains(loc);
      if (!auth.isAuthenticated) {
        return onAuthRoute ? null : '/login';
      }
      if (onAuthRoute || loc == '/splash') return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(path: '/home', builder: (_, __) => const HomeShell()),
      GoRoute(path: '/noticias', builder: (_, __) => const NoticiasScreen()),
      GoRoute(path: '/crisis', builder: (_, __) => const CrisisScreen()),
      GoRoute(path: '/busqueda', builder: (_, __) => const BusquedaScreen()),
      GoRoute(path: '/redes', builder: (_, __) => const RedesScreen()),
      GoRoute(path: '/planes', builder: (_, __) => const PlanesScreen()),
      GoRoute(path: '/perfil', builder: (_, __) => const PerfilScreen()),
      GoRoute(path: '/perfil/editar', builder: (_, __) => const EditProfileScreen()),
      GoRoute(path: '/configuracion', builder: (_, __) => const AjustesScreen()),
      GoRoute(path: '/notificaciones', builder: (_, __) => const NotificacionesScreen()),
    ],
  );
});
