import 'package:dio/dio.dart';

import '../../core/env.dart';
import 'token_storage.dart';

/// Error normalizado de la API.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.data});
  final String message;
  final int? statusCode;
  final dynamic data;

  bool get isUnauthorized => statusCode == 401;
  bool get isPaymentRequired => statusCode == 402; // créditos insuficientes

  @override
  String toString() => message;
}

/// Cliente HTTP central. Apunta a la API Next.js existente y agrega el JWT en cada request.
class ApiClient {
  ApiClient({required this.tokenStorage, this.onUnauthorized}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: '${Env.apiBaseUrl}/api',
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 40),
        headers: {'Accept': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenStorage.readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (e, handler) {
          if (e.response?.statusCode == 401) {
            onUnauthorized?.call();
          }
          handler.next(e);
        },
      ),
    );
  }

  final TokenStorage tokenStorage;
  final void Function()? onUnauthorized;
  late final Dio _dio;

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get(path, queryParameters: query));

  Future<dynamic> post(String path, {Object? body, Map<String, dynamic>? query}) =>
      _send(() => _dio.post(path, data: body, queryParameters: query));

  Future<dynamic> patch(String path, {Object? body}) =>
      _send(() => _dio.patch(path, data: body));

  Future<dynamic> delete(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.delete(path, queryParameters: query));

  Future<dynamic> _send(Future<Response> Function() run) async {
    try {
      final res = await run();
      return res.data;
    } on DioException catch (e) {
      final code = e.response?.statusCode;
      final data = e.response?.data;
      String msg = 'Error de conexión. Revisá tu internet e intentá de nuevo.';
      if (data is Map && (data['error'] != null || data['message'] != null)) {
        msg = (data['error'] ?? data['message']).toString();
      } else if (code != null) {
        msg = 'Error $code';
      }
      throw ApiException(msg, statusCode: code, data: data);
    }
  }
}
