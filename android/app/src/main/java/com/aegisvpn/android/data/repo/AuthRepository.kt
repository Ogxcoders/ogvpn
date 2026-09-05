package com.aegisvpn.android.data.repo

import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.Preferences
import com.aegisvpn.android.data.api.AegisApi
import com.aegisvpn.android.data.api.DeleteAccountRequest
import com.aegisvpn.android.data.api.ErrorEnvelope
import com.aegisvpn.android.data.api.LoginRequest
import com.aegisvpn.android.data.api.LogoutRequest
import com.aegisvpn.android.data.api.PasswordChangeRequest
import com.aegisvpn.android.data.api.RegisterRequest
import com.aegisvpn.android.data.secure.TokenStore
import com.aegisvpn.android.domain.AuthEvent
import com.aegisvpn.android.domain.Me
import com.aegisvpn.android.domain.PasswordPolicy
import com.aegisvpn.android.domain.VpnApiError
import com.aegisvpn.android.domain.toDomain
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.first
import retrofit2.Response
import java.io.IOException
import java.util.UUID

/** Errors surfaced from the repository layer. */
sealed class RepoError : Exception() {
    class Api(val apiError: VpnApiError) : RepoError() {
        override val message: String get() = apiError.message
    }
    class Network(cause: IOException) : RepoError() {
        override val message: String = "Network unavailable — check your connection and retry"
        init { initCause(cause) }
    }
    class Validation(val problems: List<String>) : RepoError() {
        override val message: String get() = "Password must contain ${problems.joinToString(", ")}"
    }
}

/**
 * Maps retrofit failures to [VpnApiError] using the contract error envelope:
 * {"error": {"code": "...", "message": "..."}}.
 */
suspend fun <T> apiCall(block: suspend () -> Response<T>): T {
    val response = try {
        block()
    } catch (e: IOException) {
        throw RepoError.Network(e)
    } catch (e: Exception) {
        // Retrofit throws HttpException only for non-2xx without suspend Response;
        // all our endpoints declare Response<T> or DTO so this path is rare.
        throw RepoError.Api(VpnApiError("CLIENT_ERROR", e.message ?: "Request failed", 0))
    }
    if (response.isSuccessful) {
        return response.body() ?: throw RepoError.Api(VpnApiError("EMPTY_BODY", "Empty response body", response.code()))
    }
    val envelope = try {
        val raw = response.errorBody()?.string()
        if (raw != null) json().decodeFromString(ErrorEnvelope.serializer(), raw) else null
    } catch (e: Exception) {
        null
    }
    val code = envelope?.error?.code ?: "HTTP_${response.code()}"
    val message = envelope?.error?.message ?: "Request failed with status ${response.code()}"
    throw RepoError.Api(VpnApiError(code, message, response.code()))
}

/** Lazily shared Json for error-envelope parsing (kept out of DI on purpose). */
private var sharedJson: kotlinx.serialization.json.Json? = null
private fun json(): kotlinx.serialization.json.Json =
    sharedJson ?: kotlinx.serialization.json.Json {
        ignoreUnknownKeys = true
    }.also { sharedJson = it }

/**
 * Authentication repository: register / login / logout / me / password flows.
 * Persists the deviceUid once so re-logins reuse the same device row.
 */
class AuthRepository(
    private val api: AegisApi,
    private val tokens: TokenStore,
    private val dataStore: androidx.datastore.core.DataStore<Preferences>,
    private val authEvents: MutableSharedFlow<AuthEvent>,
) {

    val events: SharedFlow<AuthEvent> = authEvents

    private suspend fun deviceUid(): String {
        val existing = dataStore.data.first()[KEY_DEVICE_UID]
        if (existing != null) return existing
        val uid = UUID.randomUUID().toString()
        dataStore.edit { it[KEY_DEVICE_UID] = uid }
        return uid
    }

    suspend fun deviceName(): String =
        "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}".replace(Regex("\\s+"), " ").trim()

    suspend fun register(email: String, password: String, name: String, platform: String = "android"): Me {
        if (!PasswordPolicy.isValidEmail(email)) throw RepoError.Validation(listOf("a valid email address"))
        val problems = PasswordPolicy.errors(password)
        if (problems.isNotEmpty()) throw RepoError.Validation(problems)
        val dto = apiCall {
            api.register(
                RegisterRequest(
                    email = email.trim(),
                    password = password,
                    name = name.trim(),
                    deviceName = deviceName(),
                    platform = platform,
                    deviceUid = deviceUid(),
                ),
            )
        }
        tokens.save(dto.accessToken, dto.refreshToken)
        val me = me()
        authEvents.tryEmit(AuthEvent.Authenticated(me.user))
        return me
    }

    suspend fun login(email: String, password: String, platform: String = "android"): Me {
        if (!PasswordPolicy.isValidEmail(email)) throw RepoError.Validation(listOf("a valid email address"))
        if (password.isBlank()) throw RepoError.Validation(listOf("a password"))
        val dto = apiCall {
            api.login(
                LoginRequest(
                    email = email.trim(),
                    password = password,
                    deviceName = deviceName(),
                    platform = platform,
                    deviceUid = deviceUid(),
                ),
            )
        }
        tokens.save(dto.accessToken, dto.refreshToken)
        val me = me()
        authEvents.tryEmit(AuthEvent.Authenticated(me.user))
        return me
    }

    suspend fun me(): Me {
        val dto = apiCall { api.me() }
        return Me(dto.user.toDomain(), dto.subscription.toDomain(), dto.device.toDomain())
    }

    suspend fun logout() {
        val refresh = tokens.refreshToken
        if (refresh != null) {
            try {
                apiCall { api.logout(LogoutRequest(refresh)) }
            } catch (e: Exception) {
                // Logout is best-effort: clear local state regardless.
                Log.w(TAG, "logout call failed; clearing local session anyway")
            }
        }
        tokens.clear()
        authEvents.tryEmit(AuthEvent.LoggedOut)
    }

    /** Hard logout used when the server revokes the device: no network call. */
    fun hardLogout() {
        tokens.clear()
        authEvents.tryEmit(AuthEvent.LoggedOut)
    }

    suspend fun changePassword(current: String, new: String) {
        val problems = PasswordPolicy.errors(new)
        if (problems.isNotEmpty()) throw RepoError.Validation(problems)
        apiCall { api.passwordChange(PasswordChangeRequest(current, new)) }
        // Backend invalidates every refresh token on password change.
        tokens.clear()
        authEvents.tryEmit(AuthEvent.SessionExpired)
    }

    suspend fun deleteAccount(password: String) {
        apiCall { api.deleteAccount(DeleteAccountRequest(password)) }
        tokens.clear()
        authEvents.tryEmit(AuthEvent.LoggedOut)
    }

    val hasSession: Boolean
        get() = tokens.hasTokens

    companion object {
        private const val TAG = "AuthRepository"
        val KEY_DEVICE_UID = stringPreferencesKey("device_uid")
    }
}
