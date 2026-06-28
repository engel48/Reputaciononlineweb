package com.reputaciononline.reputacion_online

import io.flutter.embedding.android.FlutterFragmentActivity

// FlutterFragmentActivity (en vez de FlutterActivity) es requerido por local_auth
// para mostrar el prompt biométrico nativo en Android.
class MainActivity : FlutterFragmentActivity()
