package com.aegisvpn.android.data.secure

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure token storage.
 *
 * Primary: EncryptedSharedPreferences (AES-256-GCM keys held in the Android
 * Keystore). On devices where Keystore initialization fails (rare vendor
 * bugs, leaked emulators) we degrade to plain SharedPreferences and expose
 * [degraded] so the UI can warn the user honestly. Tokens are never logged.
 */
class TokenStore(context: Context) {

    private val prefs: SharedPreferences

    /** True when encryption was unavailable and plaintext prefs are used. */
    val degraded: Boolean

    init {
        val encrypted: SharedPreferences? = try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                context,
                "aegis_secure_prefs",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        } catch (e: Exception) {
            Log.w(TAG, "EncryptedSharedPreferences unavailable; falling back to plain prefs", e)
            null
        }
        degraded = encrypted == null
        prefs = encrypted ?: context.getSharedPreferences("aegis_fallback_prefs", Context.MODE_PRIVATE)
    }

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS, null)
        private set(value) = prefs.edit().putString(KEY_ACCESS, value).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH, null)
        private set(value) = prefs.edit().putString(KEY_REFRESH, value).apply()

    val hasTokens: Boolean
        get() = accessToken != null && refreshToken != null

    fun save(access: String, refresh: String) {
        accessToken = access
        refreshToken = refresh
    }

    fun clear() {
        accessToken = null
        refreshToken = null
    }

    /** Private keys for tunnels are stored per tunnel id, never logged. */
    fun saveTunnelPrivateKey(tunnelId: String, privateKey: String) {
        prefs.edit().putString("$KEY_TUNNEL_PREFIX$tunnelId", privateKey).apply()
    }

    fun tunnelPrivateKey(tunnelId: String): String? =
        prefs.getString("$KEY_TUNNEL_PREFIX$tunnelId", null)

    fun removeTunnelPrivateKey(tunnelId: String) {
        prefs.edit().remove("$KEY_TUNNEL_PREFIX$tunnelId").apply()
    }

    companion object {
        private const val TAG = "TokenStore"
        private const val KEY_ACCESS = "access_token"
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_TUNNEL_PREFIX = "tunnel_key_"
    }
}
