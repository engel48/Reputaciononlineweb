import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/widgets/coming_soon.dart';
import '../creditos/creditos_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../mentions/mentions_screen.dart';
import '../perfil/perfil_screen.dart';

/// Contenedor principal con navegación inferior (bottom nav).
class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  static const _tabs = <Widget>[
    DashboardScreen(),
    MentionsScreen(),
    _TabScaffold(title: 'Julia IA', child: ComingSoon(title: 'Asistente Julia', icon: Icons.auto_awesome)),
    CreditosScreen(),
    PerfilScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard),
              label: 'Inicio'),
          NavigationDestination(
              icon: Icon(Icons.hearing_outlined),
              selectedIcon: Icon(Icons.hearing),
              label: 'Menciones'),
          NavigationDestination(
              icon: Icon(Icons.auto_awesome_outlined),
              selectedIcon: Icon(Icons.auto_awesome),
              label: 'Julia'),
          NavigationDestination(
              icon: Icon(Icons.bolt_outlined),
              selectedIcon: Icon(Icons.bolt),
              label: 'Créditos'),
          NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Perfil'),
        ],
      ),
    );
  }
}

class _TabScaffold extends StatelessWidget {
  const _TabScaffold({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: child,
    );
  }
}
