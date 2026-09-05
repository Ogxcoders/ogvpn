package com.aegisvpn.android.sync

import android.content.Context
import android.util.Log
import com.aegisvpn.android.data.repo.AuthRepository
import com.aegisvpn.android.data.repo.VpnRepository
import com.aegisvpn.android.vpn.TunnelManager
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Control-plane event stream (SSE, GET /events?access_token=…).
 *
 * Events are NOTIFICATIONS, not a source of truth: after every reconnect the
 * app re-fetches state. Reconnect uses exponential backoff (1 s → 30 s).
 */
class EventStreamClient(
    private val context: Context,
    private val tokenStore: com.aegisvpn.android.data.secure.TokenStore,
    private val authRepository: AuthRepository,
    private val vpnRepository: VpnRepository,
    private val tunnelManager: TunnelManager,
) {

    private val running = AtomicBoolean(false)
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS) // stream stays open
        .build()

    private val baseUrl: String
        get() = context.packageManager
            ?.let { null } // no-op to keep constructor cheap
            ?: run { com.aegisvpn.android.BuildConfig.API_BASE_URL }

    /** Blocking loop; call from a dedicated coroutine (Dispatchers.IO). */
    suspend fun run() {
        if (!running.compareAndSet(false, true)) return
        try {
            var backoffMs = 1000L
            while (running.get()) {
                val token = tokenStore.accessToken
                if (token == null) {
                    delay(backoffMs)
                    backoffMs = (backoffMs * 2).coerceAtMost(MAX_BACKOFF_MS)
                    continue
                }
                val request = Request.Builder()
                    .url("${baseUrl.trimEnd('/')}/events?access_token=$token")
                    .header("Accept", "text/event-stream")
                    .build()
                try {
                    client.newCall(request).execute().use { response ->
                        if (!response.isSuccessful) {
                            throw java.io.IOException("event stream HTTP ${response.code}")
                        }
                        backoffMs = 1000L
                        val source = response.body?.source() ?: throw java.io.IOException("empty stream")
                        var eventName = ""
                        val data = StringBuilder()
                        while (running.get()) {
                            val line = source.readUtf8Line() ?: break
                            when {
                                line.startsWith("event:") -> eventName = line.removePrefix("event:").trim()
                                line.startsWith("data:") -> data.append(line.removePrefix("data:").trim())
                                line.isEmpty() -> {
                                    handleEvent(eventName, data.toString())
                                    eventName = ""
                                    data.clear()
                                }
                            }
                        }
                        throw java.io.IOException("stream closed")
                    }
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    Log.w(TAG, "event stream dropped: ${e.message}; retrying in ${backoffMs}ms")
                }
                delay(backoffMs)
                backoffMs = (backoffMs * 2).coerceAtMost(MAX_BACKOFF_MS)
            }
        } finally {
            running.set(false)
        }
    }

    fun stop() {
        running.set(false)
    }

    private suspend fun handleEvent(name: String, dataRaw: String) {
        val data = if (dataRaw.isBlank()) JSONObject() else try {
            JSONObject(dataRaw)
        } catch (e: Exception) {
            JSONObject()
        }
        Log.d(TAG, "event: $name")
        try {
            when (name) {
                "device.revoked", "account.disabled" -> {
                    tunnelManager.disconnect()
                    authRepository.hardLogout()
                }
                "session.force-disconnect" -> {
                    tunnelManager.disconnect()
                }
                "subscription.changed" -> {
                    // Entitlements refresh happens lazily on next UI load.
                }
                "server.changed" -> {
                    val affected = data.optString("serverId")
                    val info = tunnelManager.sessionInfo.value
                    if (info != null && info.serverId == affected) {
                        val servers = vpnRepository.servers()
                        val replacement = servers
                            .filter { it.status == "active" }
                            .minByOrNull { it.loadPct }
                        if (replacement != null) {
                            vpnRepository.selectServer(replacement.id)
                            tunnelManager.onPermissionGranted(replacement.id)
                        } else {
                            tunnelManager.disconnect()
                        }
                    }
                }
                "ping" -> Unit
                else -> Unit
            }
        } catch (e: Exception) {
            Log.w(TAG, "event handling failed for $name", e)
        }
    }

    companion object {
        private const val TAG = "EventStream"
        private const val MAX_BACKOFF_MS = 30_000L
    }
}
