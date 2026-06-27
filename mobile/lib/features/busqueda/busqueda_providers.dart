import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/api/api_client.dart';
import '../../data/models/search_result.dart';

/// Estado de la búsqueda de reputación/persona.
class SearchState {
  const SearchState({this.result, this.query = '', this.error});
  final SearchResult? result;
  final String query;
  final String? error;
}

class SearchController extends AsyncNotifier<SearchState> {
  ApiClient get _api => ref.read(apiClientProvider);

  @override
  Future<SearchState> build() async => const SearchState();

  Future<void> search(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    state = const AsyncLoading();
    try {
      final res = await _api.post('/search', body: {'query': q});
      final map = (res as Map).cast<String, dynamic>();
      state = AsyncData(SearchState(result: SearchResult.fromResponse(map), query: q));
    } on ApiException catch (e) {
      final msg = e.isPaymentRequired
          ? 'No tenés créditos suficientes para este análisis.'
          : e.message;
      state = AsyncData(SearchState(query: q, error: msg));
    } catch (e) {
      state = AsyncData(SearchState(query: q, error: 'No se pudo completar la búsqueda.'));
    }
  }
}

final searchControllerProvider =
    AsyncNotifierProvider<SearchController, SearchState>(SearchController.new);
