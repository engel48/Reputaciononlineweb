import 'package:flutter/material.dart';

import '../mentions/mentions_screen.dart';
import '../noticias/noticias_screen.dart';

/// Monitoreo unificado: menciones sociales + noticias + palabras clave.
/// Espeja la unificación de la web (Monitoreo y Análisis). Reemplaza la
/// pestaña "Menciones" del bottom nav y absorbe la sección "Noticias".
class MonitoreoScreen extends StatelessWidget {
  const MonitoreoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Monitoreo'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Menciones'),
              Tab(text: 'Noticias'),
              Tab(text: 'Palabras clave'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            MentionsView(),
            NewsMentionsTab(),
            KeywordsTab(),
          ],
        ),
      ),
    );
  }
}
