# AegisVPN Android — release shrink/obfuscation rules.
# minifyEnabled is on for release; these rules keep reflection-dependent code intact.

# --- WireGuard tunnel library -------------------------------------------------
# The GoBackend loads native libraries and is reached through the manifest
# service com.wireguard.android.backend.GoBackend$VpnService; keep everything.
-keep class com.wireguard.** { *; }
-keepclassmembers class com.wireguard.android.backend.GoBackend$VpnService { *; }
-dontwarn com.wireguard.**

# --- kotlinx.serialization ----------------------------------------------------
# Official serialization rules: keep generated serializers and the
# serializer() lookup path used by the converter.
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keep,includedescriptorclasses class com.aegisvpn.android.**$$serializer { *; }
-keepclassmembers class com.aegisvpn.android.** {
    *** Companion;
}
-keepclasseswithmembers class com.aegisvpn.android.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# --- Retrofit -----------------------------------------------------------------
-keepattributes Signature, Exceptions
# Retain service method annotations for the reflected interface proxy.
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface <1>

# --- OkHttp / OkIO ------------------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# --- Google Tink (pulled in by androidx.security:security-crypto) -------------
# Tink's bytecode references errorprone annotations that exist only at compile
# time; they are never resolved at runtime on Android.
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.lang.model.**
-dontwarn com.google.api.client.**
-dontwarn org.joda.time.**

# --- Coroutines ---------------------------------------------------------------
-dontwarn kotlinx.coroutines.debug.**
