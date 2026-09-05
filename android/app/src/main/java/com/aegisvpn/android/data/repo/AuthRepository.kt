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
import retrofit2.HttpException
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
 *
 * Two helpers because the API interface mixes both result shapes:
 *  - [apiCall] for endpoints that return the parsed DTO directly (non-2xx
 *    raises [HttpException] inside the call);
 *  - [apiCallResponse] for 204-style endpoints (logout, revoke, delete…)
 *    declared as [Response] — Retrofit returns the error response instead of
 *    throwing there, and the success body is legitimately null.
 */
suspend fun <T> apiCall(block: suspend () -> T): T {
    return try {
        block()
    } catch (e: IOException) {
        throw RepoError.Network(e)
    } catch (e: HttpException) {
        throw RepoError.Api(parseHttpError(e.code(), e.response()?.errorBody()?.string()))
    } catch (e: kotlinx.serialization.SerializationException) {
        throw RepoError.Api(VpnApiError("BAD_RESPONSE", "Malformed response body", 0))
    } catch (e: Exception) {
        throw RepoError.Api(VpnApiError("CLIENT_ERROR", e.message ?: "Request failed", 0))
    }
}

/** [Response]-returning endpoints (204/Unit) — never fail on a null body. */
suspend fun <T> apiCallResponse(block: suspend () -> Response<T>): T {
    val response = try {
        block()
    } catch (e: IOException) {
        throw RepoError.Network(e)
    }
    if (response.isSuccessful) {
        val body = response.body()
        @Suppress("UNCHECKED_CAST")
        return body ?: Unit as T
    }
    val raw = try {
        response.errorBody()?.string()
    } catch (_: Exception) {
        null
    }
    throw RepoError.Api(parseHttpError(response.code(), raw))
}

private fun parseHttpError(httpStatus: Int, raw: String?): VpnApiError {
    val envelope = try {
        raw?.let { json().decodeFromString(ErrorEnvelope.serializer(), it) }
    } catch (_: Exception) {
        null
    }
    val code = envelope?.error?.code ?: "HTTP_$httpStatus"
    val message = envelope?.error?.message ?: "Request failed with status $httpStatus"
    return VpnApiError(code, message, httpStatus)
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
                apiCallResponse { api.logout(LogoutRequest(refresh)) }
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
        apiCallResponse { api.passwordChange(PasswordChangeRequest(current, new)) }
        // Backend invalidates every refresh token on password change.
        tokens.clear()
        authEvents.tryEmit(AuthEvent.SessionExpired)
    }

    suspend fun deleteAccount(password: String) {
        apiCallResponse { api.deleteAccount(DeleteAccountRequest(password)) }
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
