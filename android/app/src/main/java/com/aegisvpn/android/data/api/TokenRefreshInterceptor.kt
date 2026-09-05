package com.aegisvpn.android.data.api

import com.aegisvpn.android.data.secure.TokenStore
import com.aegisvpn.android.domain.AuthEvent
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Transparent refresh-token rotation on 401.
 *
 * Single-flight: a Mutex guarantees concurrent 401s share exactly one refresh
 * call. The backend ROTATES refresh tokens and enforces reuse detection, so
 * two parallel refreshes with the same token would revoke the whole family.
 */
class TokenRefreshInterceptor(
    private val tokens: TokenStore,
    private val api: AegisApi,
    private val authEvents: kotlinx.coroutines.flow.MutableSharedFlow<AuthEvent>,
    private val json: Json,
) : Interceptor {

    private val lock = Object()

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)

        if (response.code != 401) return response
        if (request.header(RETRY_HEADER) != null) return response
        val path = request.url.encodedPath
        if (AUTH_FREE_PATHS.any { path.endsWith(it) }) return response

        val refreshToken = tokens.refreshToken ?: return response

        val refreshed = synchronized(lock) {
            // Re-check: another thread may have refreshed while we waited.
            val current = tokens.refreshToken ?: return@synchronized false
            try {
                runBlocking {
                    val dto = api.refresh(RefreshRequest(current))
                    tokens.save(dto.accessToken, dto.refreshToken)
                }
                true
            } catch (e: Exception) {
                // Refresh failed → the session is over.
                tokens.clear()
                authEvents.tryEmit(AuthEvent.SessionExpired)
                false
            }
        }
        if (!refreshed) return response

        val newAccess = tokens.accessToken ?: return response
        val retried = request.newBuilder()
            .header("Authorization", "Bearer $newAccess")
            .header(RETRY_HEADER, "1")
            .build()
        return chain.proceed(retried)
    }

    companion object {
        const val RETRY_HEADER = "X-Aegis-Retried"
        private val AUTH_FREE_PATHS = listOf("/auth/refresh", "/auth/login", "/auth/register")
    }
}
