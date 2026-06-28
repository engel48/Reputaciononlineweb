import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

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
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Accept': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          options.extra['__t'] = DateTime.now().millisecondsSinceEpoch;
          if (kDebugMode) {
            debugPrint('[api] → ${options.method} ${options.path}');
          }
          final token = await tokenStorage.readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
            // Algunas rutas de la API (julia, news-monitoring, crisis, search,
            // payments) leen el token desde la cookie `auth-token` en lugar del
            // header Bearer. Lo enviamos también como cookie para cubrir ambos
            // estilos sin tocar el backend.
            options.headers['Cookie'] = 'auth-token=$token';
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            debugPrint(
                '[api] ✓ ${response.requestOptions.method} ${response.requestOptions.path} → ${response.statusCode} (${_elapsed(response.requestOptions)}ms)');
          }
          handler.next(response);
        },
        onError: (e, handler) {
          if (kDebugMode) {
            debugPrint(
                '[api] ✗ ${e.requestOptions.method} ${e.requestOptions.path} → ${e.type} ${e.response?.statusCode ?? ''} (${_elapsed(e.requestOptions)}ms): ${e.message}');
          }
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

  static int _elapsed(RequestOptions o) {
    final t = o.extra['__t'];
    return t is int ? DateTime.now().millisecondsSinceEpoch - t : -1;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get(path, queryParameters: query));

  Future<dynamic> post(String path, {Object? body, Map<String, dynamic>? query}) =>
      _send(() => _dio.post(path, data: body, queryParameters: query));

  Future<dynamic> put(String path, {Object? body}) =>
      _send(() => _dio.put(path, data: body));

  Future<dynamic> patch(String path, {Object? body}) =>
      _send(() => _dio.patch(path, data: body));

  Future<dynamic> delete(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.delete(path, queryParameters: query));

  Future<dynamic> _send(Future<Response> Function() run) async {
    // Reintenta SOLO ante errores de gateway 502/503/504 (respuestas rápidas
    // típicas de un cold start, donde el proxy está arriba pero la app aún
    // inicia). NO reintenta timeouts ni conexión caída: en esos casos la red no
    // está y reintentar solo multiplica la espera; mejor fallar rápido y claro.
    DioException? lastError;
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        final res = await run();
        return res.data;
      } on DioException catch (e) {
        lastError = e;
        if (!_isRetriable(e, attempt)) break;
        await Future.delayed(Duration(milliseconds: 600 * (attempt + 1)));
      }
    }
    throw _toApiException(lastError!);
  }

  bool _isRetriable(DioException e, int attempt) {
    if (attempt >= 2) return false; // máx. 3 intentos (0,1,2)
    if (e.type != DioExceptionType.badResponse) return false;
    final c = e.response?.statusCode;
    return c == 502 || c == 503 || c == 504;
  }

  ApiException _toApiException(DioException e) {
    final code = e.response?.statusCode;
    final data = e.response?.data;
    String msg;
    if (data is Map && (data['error'] != null || data['message'] != null)) {
      msg = (data['error'] ?? data['message']).toString();
    } else if (code == 502 || code == 503 || code == 504) {
      msg = 'El servidor está iniciando. Esperá unos segundos e intentá de nuevo.';
    } else if (code != null) {
      msg = 'Error $code';
    } else {
      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          msg = 'La conexión tardó demasiado. Intentá de nuevo.';
          break;
        case DioExceptionType.connectionError:
          msg = 'Sin conexión a internet. Revisá tu red e intentá de nuevo.';
          break;
        default:
          msg = 'Error de conexión. Revisá tu internet e intentá de nuevo.';
      }
    }
    return ApiException(msg, statusCode: code, data: data);
  }
}
