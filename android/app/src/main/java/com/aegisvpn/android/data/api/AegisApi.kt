package com.aegisvpn.android.data.api

import com.aegisvpn.android.data.api.DeviceEnvelope
import com.aegisvpn.android.data.api.DevicesEnvelope
import com.aegisvpn.android.data.api.AuthSuccessDto
import com.aegisvpn.android.data.api.CreatePeerRequest
import com.aegisvpn.android.data.api.CreatePeerResponse
import com.aegisvpn.android.data.api.DeleteAccountRequest
import com.aegisvpn.android.data.api.LoginRequest
import com.aegisvpn.android.data.api.LogoutRequest
import com.aegisvpn.android.data.api.MeDto
import com.aegisvpn.android.data.api.PatchDeviceRequest
import com.aegisvpn.android.data.api.PlansEnvelope
import com.aegisvpn.android.data.api.RefreshDto
import com.aegisvpn.android.data.api.RefreshRequest
import com.aegisvpn.android.data.api.RotatePeerRequest
import com.aegisvpn.android.data.api.RotatePeerResponse
import com.aegisvpn.android.data.api.ServersEnvelope
import com.aegisvpn.android.data.api.ServerEnvelope
import com.aegisvpn.android.data.api.SessionsEnvelope
import com.aegisvpn.android.data.api.SubscriptionEnvelope
import com.aegisvpn.android.data.api.TunnelsEnvelope
import com.aegisvpn.android.data.api.TunnelEnvelope
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * AegisVPN backend API (docs/API-CONTRACT.md v1).
 *
 * All paths are relative to BuildConfig.API_BASE_URL which already includes
 * the /api/v1 prefix. Every function is a suspend fun — no callbacks.
 */
interface AegisApi {

    // ---- auth ----

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthSuccessDto

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthSuccessDto

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): RefreshDto

    @POST("auth/logout")
    suspend fun logout(@Body body: LogoutRequest): retrofit2.Response<Unit>

    @GET("auth/me")
    suspend fun me(): MeDto

    @POST("auth/password-change")
    suspend fun passwordChange(@Body body: PasswordChangeRequest): retrofit2.Response<Unit>

    @DELETE("auth/account")
    suspend fun deleteAccount(@Body body: DeleteAccountRequest): retrofit2.Response<Unit>

    // ---- devices ----

    @GET("devices")
    suspend fun devices(): DevicesEnvelope

    @PATCH("devices/{id}")
    suspend fun renameDevice(@Path("id") id: String, @Body body: PatchDeviceRequest): DeviceEnvelope

    @DELETE("devices/{id}")
    suspend fun revokeDevice(@Path("id") id: String): retrofit2.Response<Unit>

    // ---- servers ----

    @GET("servers")
    suspend fun servers(): ServersEnvelope

    @GET("servers/{id}")
    suspend fun server(@Path("id") id: String): ServerEnvelope

    // ---- vpn ----

    @POST("vpn/peers")
    suspend fun createPeer(
        @Header("Idempotency-Key") idempotencyKey: String,
        @Body body: CreatePeerRequest,
    ): CreatePeerResponse

    @GET("vpn/peers")
    suspend fun peers(): TunnelsEnvelope

    @GET("vpn/peers/{id}")
    suspend fun peer(@Path("id") id: String): TunnelEnvelope

    @DELETE("vpn/peers/{id}")
    suspend fun deletePeer(@Path("id") id: String): retrofit2.Response<Unit>

    @POST("vpn/peers/{id}/rotate")
    suspend fun rotatePeer(@Path("id") id: String, @Body body: RotatePeerRequest): RotatePeerResponse

    // ---- sessions ----

    @GET("sessions")
    suspend fun sessions(): SessionsEnvelope

    @DELETE("sessions/{id}")
    suspend fun forceDisconnect(@Path("id") id: String): retrofit2.Response<Unit>

    // ---- subscription ----

    @GET("subscription")
    suspend fun subscription(): SubscriptionEnvelope

    @GET("subscription/plans")
    suspend fun plans(): PlansEnvelope

    @POST("subscription/checkout")
    suspend fun checkout(@Body body: CheckoutRequest): SubscriptionEnvelope

    @POST("subscription/cancel")
    suspend fun cancelSubscription(): SubscriptionEnvelope
}

data class PasswordChangeRequest(val currentPassword: String, val newPassword: String)
