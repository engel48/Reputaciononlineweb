# Flutter / motor
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# Firebase Cloud Messaging
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# WebView (flutter_web_auth_2 / webview_flutter / checkout Wompi)
-keep class * extends android.webkit.WebChromeClient { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Modelos serializados vía reflexión (defensivo)
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
