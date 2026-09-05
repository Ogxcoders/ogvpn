package com.aegisvpn.android.data.api

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Wire DTOs for the AegisVPN control plane (API contract v1).
 *
 * Field names MUST match the frozen contract in docs/API-CONTRACT.md exactly
 * (camelCase: accessToken, refreshToken, currentPeriodEnd, maxDevices, loadPct,
 * addressV4, addressV6, serverPublicKey, endpointHost, endpointPort,
 * allowedIps, dns, mtu, keepalive, lastActiveAt, ...). No @SerialName aliases
 * are used because the contract and the implemented backend are camelCase.
 *
 * Nullable fields with defaults exist for values the backend omits in some
 * responses (e.g. `createdAt` is not part of the public user payload,
 * `closedAt` is absent for open sessions, checkout omits `maxDevices`).
 */

// ---------------------------------------------------------------------------
// Core payloads
// ---------------------------------------------------------------------------

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val name: String,
    val role: String,
    val status: String,
    val createdAt: String? = null,
)

@Serializable
data class DeviceDto(
    val id: String,
    val name: String,
    val platform: String,
    val status: String,
    val lastActiveAt: String? = null,
)

/** Session summary embedded in device rows from GET /devices. */
@Serializable
data class DeviceSessionRefDto(
    val id: String,
    val state: String,
    val tunnelId: String? = null,
    val serverId: String? = null,
)

/** Device row as returned by GET /devices (includes optional active session). */
@Serializable
data class DeviceSummaryDto(
    val id: String,
    val name: String,
    val platform: String,
    val status: String,
    val lastActiveAt: String? = null,
    val createdAt: String? = null,
    val session: DeviceSessionRefDto? = null,
)

/** Response of POST /auth/register and POST /auth/login. */
@Serializable
data class AuthSuccessDto(
    val user: UserDto,
    val device: DeviceDto,
    val accessToken: String,
    val refreshToken: String,
)

/** Response of POST /auth/refresh (rotated token pair). */
@Serializable
data class RefreshDto(
    val accessToken: String,
    val refreshToken: String,
)

@Serializable
data class SubscriptionDto(
    val plan: String,
    val status: String,
    val currentPeriodEnd: String? = null,
    val maxDevices: Int = 0,
)

/** Response of GET /auth/me: user + subscription + current device. */
@Serializable
data class MeDto(
    val user: UserDto,
    val subscription: SubscriptionDto,
    val device: DeviceDto,
)

@Serializable
data class PlanDto(
    val code: String,
    val name: String,
    val priceCents: Long,
    val interval: String,
    val maxDevices: Int,
    val features: List<String> = emptyList(),
)

@Serializable
data class ServerDto(
    val id: String,
    val code: String,
    val name: String,
    val country: String,
    val city: String,
    val host: String,
    val port: Int,
    val publicKey: String,
    val dns: String,
    val status: String,
    val capacity: Int,
    val tunnelCount: Int = 0,
    val loadPct: Int,
    val ipv4Prefix: String,
    val ipv6Prefix: String,
    val supportsDualStack: Boolean,
    val lastHeartbeatAt: String? = null,
)

@Serializable
data class TunnelDto(
    val id: String,
    val serverId: String,
    val addressV4: String,
    val addressV6: String? = null,
    val serverPublicKey: String,
    val endpointHost: String,
    val endpointPort: Int,
    val allowedIps: List<String> = emptyList(),
    val dns: String,
    val mtu: Int,
    val keepalive: Int,
    val status: String? = null,
)

/** Session reference inside provisioning responses ({id, state}). */
@Serializable
data class SessionRefDto(
    val id: String,
    val state: String,
)

/** Full session row as returned by GET /sessions. */
@Serializable
data class SessionDto(
    val id: String,
    val state: String,
    val deviceId: String,
    val deviceName: String,
    val serverId: String,
    val serverName: String,
    val connectedAt: String? = null,
    val closedAt: String? = null,
    val bytesIn: Long = 0,
    val bytesOut: Long = 0,
)

// ---------------------------------------------------------------------------
// Error envelope: { "error": { "code", "message", "details"? } }
// ---------------------------------------------------------------------------

@Serializable
data class ErrorBody(
    val code: String,
    val message: String,
    val details: JsonElement? = null,
)

@Serializable
data class ErrorEnvelope(
    val error: ErrorBody,
)

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val deviceName: String,
    val platform: String,
    val deviceUid: String,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val deviceName: String,
    val platform: String,
    val deviceUid: String,
)

@Serializable
data class RefreshRequest(
    val refreshToken: String,
)

@Serializable
data class LogoutRequest(
    val refreshToken: String,
)

@Serializable
data class DeleteAccountRequest(
    val password: String,
)

@Serializable
data class PatchDeviceRequest(
    val name: String,
)

@Serializable
data class CreatePeerRequest(
    val deviceId: String,
    val serverId: String,
    val publicKey: String,
)

@Serializable
data class RotatePeerRequest(
    val newPublicKey: String,
)

@Serializable
data class CheckoutRequest(
    val planCode: String,
)

// ---------------------------------------------------------------------------
// Collection envelopes
// ---------------------------------------------------------------------------

@Serializable
data class DevicesEnvelope(
    val devices: List<DeviceSummaryDto>,
)

@Serializable
data class ServersEnvelope(
    val servers: List<ServerDto>,
)

@Serializable
data class ServerEnvelope(
    val server: ServerDto,
)

@Serializable
data class TunnelsEnvelope(
    val tunnels: List<TunnelDto>,
)

/** Response of POST /vpn/peers (201). */
@Serializable
data class CreatePeerResponse(
    val tunnel: TunnelDto,
    val session: SessionRefDto,
)

/** Response of POST /vpn/peers/:id/rotate. */
@Serializable
data class RotatePeerResponse(
    val tunnel: TunnelDto,
)

/** Response of GET /vpn/peers/:id. */
@Serializable
data class TunnelEnvelope(
    val tunnel: TunnelDto,
    val session: SessionRefDto? = null,
)

@Serializable
data class SessionsEnvelope(
    val sessions: List<SessionDto>,
)

@Serializable
data class PlansEnvelope(
    val plans: List<PlanDto>,
)

@Serializable
data class SubscriptionEnvelope(
    val subscription: SubscriptionDto,
)

@Serializable
data class DeviceEnvelope(
    val device: DeviceDto,
)
