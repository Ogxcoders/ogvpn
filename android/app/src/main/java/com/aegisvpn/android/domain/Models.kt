package com.aegisvpn.android.domain

import com.aegisvpn.android.data.api.DeviceDto
import com.aegisvpn.android.data.api.DeviceSessionRefDto
import com.aegisvpn.android.data.api.DeviceSummaryDto
import com.aegisvpn.android.data.api.PlanDto
import com.aegisvpn.android.data.api.ServerDto
import com.aegisvpn.android.data.api.SessionDto
import com.aegisvpn.android.data.api.SubscriptionDto
import com.aegisvpn.android.data.api.TunnelDto
import com.aegisvpn.android.data.api.UserDto

/**
 * Domain models for the AegisVPN client. These are the types the UI and the
 * VPN layer operate on; they are mapped from the wire DTOs defined in
 * [com.aegisvpn.android.data.api] so that transport concerns never leak into
 * business logic.
 */

data class User(
    val id: String,
    val email: String,
    val name: String,
    val role: String,
    val status: String,
    val createdAt: String?,
)

data class Device(
    val id: String,
    val name: String,
    val platform: String,
    val status: String,
    val lastActiveAt: String?,
)

/** Active session reference embedded in a device row from `GET /devices`. */
data class DeviceSessionRef(
    val id: String,
    val state: String,
    val tunnelId: String?,
    val serverId: String?,
)

/** Device row with its optional active session, exactly as `GET /devices` returns it. */
data class DeviceSummary(
    val device: Device,
    val createdAt: String?,
    val session: DeviceSessionRef?,
)

data class Server(
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
    val tunnelCount: Int,
    val loadPct: Int,
    val ipv4Prefix: String,
    val ipv6Prefix: String,
    val supportsDualStack: Boolean,
    val lastHeartbeatAt: String?,
)

/**
 * Client-side view of a provisioned WireGuard tunnel. Field names mirror the
 * API contract one-to-one (addressV4, addressV6, serverPublicKey, endpointHost,
 * endpointPort, allowedIps, dns, mtu, keepalive).
 */
data class TunnelConfig(
    val id: String,
    val serverId: String,
    val addressV4: String,
    val addressV6: String?,
    val serverPublicKey: String,
    val endpointHost: String,
    val endpointPort: Int,
    val allowedIps: List<String>,
    val dns: String,
    val mtu: Int,
    val keepalive: Int,
    val status: String?,
)

data class Session(
    val id: String,
    val state: String,
    val deviceId: String,
    val deviceName: String,
    val serverId: String,
    val serverName: String,
    val connectedAt: String?,
    val closedAt: String?,
    val bytesIn: Long,
    val bytesOut: Long,
)

data class Plan(
    val code: String,
    val name: String,
    val priceCents: Long,
    val interval: String,
    val maxDevices: Int,
    val features: List<String>,
)

data class Subscription(
    val plan: String,
    val status: String,
    val currentPeriodEnd: String?,
    val maxDevices: Int,
)

/** Aggregate returned by `GET /auth/me`. */
data class Me(
    val user: User,
    val subscription: Subscription,
    val device: Device,
)

/** Machine-readable API failure surfaced to callers (UI maps it to text). */
data class VpnApiError(
    val code: String,
    val message: String,
    val httpStatus: Int,
)

/** Application-wide authentication lifecycle events. */
sealed interface AuthEvent {
    data object SessionExpired : AuthEvent
    data object LoggedOut : AuthEvent
    data class Authenticated(val user: User) : AuthEvent
}

/**
 * Validation rules mirrored from the backend (`passwordPolicyErrors`):
 * at least 10 characters, at least one letter, at least one digit.
 */
object PasswordPolicy {
    private const val MIN_LENGTH = 10

    fun errors(password: String): List<String> {
        val problems = mutableListOf<String>()
        if (password.length < MIN_LENGTH) problems += "at least $MIN_LENGTH characters"
        if (!password.any { it.isLetter() }) problems += "at least one letter"
        if (!password.any { it.isDigit() }) problems += "at least one digit"
        return problems
    }

    fun isValidPassword(password: String): Boolean = errors(password).isEmpty()

    /**
     * Same envelope as the backend's zod email check: one '@', non-empty local
     * part, dotted domain, no whitespace, at most 254 characters.
     */
    fun isValidEmail(email: String): Boolean {
        if (email.isBlank() || email.length > 254) return false
        if (email.any { it.isWhitespace() }) return false
        val at = email.indexOf('@')
        if (at <= 0 || at != email.lastIndexOf('@')) return false
        val domain = email.substring(at + 1)
        if (domain.isBlank() || !domain.contains('.') || domain.startsWith('.') || domain.endsWith('.')) {
            return false
        }
        return true
    }
}

// ---------------------------------------------------------------------------
// Mappers (DTO -> domain)
// ---------------------------------------------------------------------------

fun UserDto.toDomain(): User = User(
    id = id,
    email = email,
    name = name,
    role = role,
    status = status,
    createdAt = createdAt,
)

fun DeviceDto.toDomain(): Device = Device(
    id = id,
    name = name,
    platform = platform,
    status = status,
    lastActiveAt = lastActiveAt,
)

fun DeviceSessionRefDto.toDomain(): DeviceSessionRef = DeviceSessionRef(
    id = id,
    state = state,
    tunnelId = tunnelId,
    serverId = serverId,
)

fun DeviceSummaryDto.toDomain(): DeviceSummary = DeviceSummary(
    device = Device(id, name, platform, status, lastActiveAt),
    createdAt = createdAt,
    session = session?.toDomain(),
)

fun ServerDto.toDomain(): Server = Server(
    id = id,
    code = code,
    name = name,
    country = country,
    city = city,
    host = host,
    port = port,
    publicKey = publicKey,
    dns = dns,
    status = status,
    capacity = capacity,
    tunnelCount = tunnelCount,
    loadPct = loadPct,
    ipv4Prefix = ipv4Prefix,
    ipv6Prefix = ipv6Prefix,
    supportsDualStack = supportsDualStack,
    lastHeartbeatAt = lastHeartbeatAt,
)

fun TunnelDto.toDomain(): TunnelConfig = TunnelConfig(
    id = id,
    serverId = serverId,
    addressV4 = addressV4,
    addressV6 = addressV6?.takeIf { it.isNotBlank() && it != "::" },
    serverPublicKey = serverPublicKey,
    endpointHost = endpointHost,
    endpointPort = endpointPort,
    allowedIps = allowedIps,
    dns = dns,
    mtu = mtu,
    keepalive = keepalive,
    status = status,
)

fun SessionDto.toDomain(): Session = Session(
    id = id,
    state = state,
    deviceId = deviceId,
    deviceName = deviceName,
    serverId = serverId,
    serverName = serverName,
    connectedAt = connectedAt,
    closedAt = closedAt,
    bytesIn = bytesIn,
    bytesOut = bytesOut,
)

fun PlanDto.toDomain(): Plan = Plan(
    code = code,
    name = name,
    priceCents = priceCents,
    interval = interval,
    maxDevices = maxDevices,
    features = features,
)

fun SubscriptionDto.toDomain(): Subscription = Subscription(
    plan = plan,
    status = status,
    currentPeriodEnd = currentPeriodEnd,
    maxDevices = maxDevices,
)
