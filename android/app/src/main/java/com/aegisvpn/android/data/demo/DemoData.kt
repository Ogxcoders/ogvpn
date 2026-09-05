package com.aegisvpn.android.data.demo

import com.aegisvpn.android.data.api.AuthSuccessDto
import com.aegisvpn.android.data.api.CheckoutRequest
import com.aegisvpn.android.data.api.CreatePeerRequest
import com.aegisvpn.android.data.api.CreatePeerResponse
import com.aegisvpn.android.data.api.DeviceDto
import com.aegisvpn.android.data.api.DeviceEnvelope
import com.aegisvpn.android.data.api.DeviceSummaryDto
import com.aegisvpn.android.data.api.DevicesEnvelope
import com.aegisvpn.android.data.api.ErrorBody
import com.aegisvpn.android.data.api.ErrorEnvelope
import com.aegisvpn.android.data.api.LoginRequest
import com.aegisvpn.android.data.api.MeDto
import com.aegisvpn.android.data.api.PatchDeviceRequest
import com.aegisvpn.android.data.api.PlanDto
import com.aegisvpn.android.data.api.PlansEnvelope
import com.aegisvpn.android.data.api.RefreshDto
import com.aegisvpn.android.data.api.RegisterRequest
import com.aegisvpn.android.data.api.RotatePeerRequest
import com.aegisvpn.android.data.api.RotatePeerResponse
import com.aegisvpn.android.data.api.ServerDto
import com.aegisvpn.android.data.api.ServerEnvelope
import com.aegisvpn.android.data.api.ServersEnvelope
import com.aegisvpn.android.data.api.SessionDto
import com.aegisvpn.android.data.api.SessionRefDto
import com.aegisvpn.android.data.api.SessionsEnvelope
import com.aegisvpn.android.data.api.SubscriptionDto
import com.aegisvpn.android.data.api.SubscriptionEnvelope
import com.aegisvpn.android.data.api.TunnelDto
import com.aegisvpn.android.data.api.TunnelEnvelope
import com.aegisvpn.android.data.api.TunnelsEnvelope
import com.aegisvpn.android.data.api.UserDto
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.Instant
import java.util.UUID
import java.util.concurrent.atomic.AtomicInteger

/**
 * In-memory demo dataset mirroring the backend fixture (backend/seed/demo.ts):
 * the same 7-server matrix (active/maintenance/offline/drain/IPv4-only), the
 * same plan catalog and session shapes. Responses are built by serializing
 * the REAL contract DTOs, so field names and envelopes cannot drift from
 * docs/API-CONTRACT.md.
 *
 * State is MUTABLE and thread-safe: renaming devices, revoking them, creating
 * tunnels, upgrading the plan and disconnecting sessions all mutate this
 * object, exactly like a tiny backend. Failure paths are preserved honestly —
 * connecting to a maintenance/offline server returns the same SERVER_UNAVAILABLE
 * error the production control plane returns.
 */
object DemoData {

    val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    }

    // ---- identity ----

    private const val USER_ID = "usr-demo-0001"
    private const val CURRENT_DEVICE_ID = "dev-demo-current"

    private var userEmail = "demo@aegisvpn.local"
    private var userName = "Demo User"

    private var currentDevice = DeviceDto(
        id = CURRENT_DEVICE_ID,
        name = "This device",
        platform = "android",
        status = "active",
        lastActiveAt = nowIso(),
    )

    private val devices = mutableListOf(
        DeviceSummaryDto(
            id = CURRENT_DEVICE_ID,
            name = "This device",
            platform = "android",
            status = "active",
            lastActiveAt = nowIso(),
            createdAt = nowIso(),
        ),
        DeviceSummaryDto(
            id = "dev-demo-pixel8",
            name = "Pixel 8",
            platform = "android",
            status = "active",
            lastActiveAt = minutesAgoIso(150),
            createdAt = daysAgoIso(30),
        ),
        DeviceSummaryDto(
            id = "dev-demo-mbp",
            name = "MacBook Pro",
            platform = "macos",
            status = "active",
            lastActiveAt = daysAgoIso(40),
            createdAt = daysAgoIso(120),
        ),
    )

    // ---- server matrix (mirrors backend/seed/demo.ts §37) ----

    private val servers: List<ServerDto> = listOf(
        ServerDto(
            id = "srv-nl-ams-01", code = "nl-ams-01", name = "Amsterdam-1",
            country = "Netherlands", city = "Amsterdam",
            host = "ams01.demo.aegisvpn.local", port = 51820,
            publicKey = "1Xk2qL8vRtY4mN7cB3zX9wP6aS5dF0gH2jK4lQ8eIo=",
            dns = "10.13.0.1", status = "active", capacity = 250, tunnelCount = 42,
            loadPct = 23, ipv4Prefix = "10.13.0.0/24", ipv6Prefix = "fd00:0a11::/64",
            supportsDualStack = true, lastHeartbeatAt = secondsAgoIso(20),
        ),
        ServerDto(
            id = "srv-de-fra-01", code = "de-fra-01", name = "Frankfurt-1",
            country = "Germany", city = "Frankfurt",
            host = "fra01.demo.aegisvpn.local", port = 51820,
            publicKey = "7Rt2wZ8kQ5mC3nV9bX4yL6pJ0hF1sD8gN2vT5aW7eU=",
            dns = "10.13.0.1", status = "active", capacity = 250, tunnelCount = 61,
            loadPct = 41, ipv4Prefix = "10.13.1.0/24", ipv6Prefix = "fd00:0a12::/64",
            supportsDualStack = true, lastHeartbeatAt = secondsAgoIso(18),
        ),
        ServerDto(
            id = "srv-us-nyc-01", code = "us-nyc-01", name = "NewYork-1",
            country = "United States", city = "New York",
            host = "nyc01.demo.aegisvpn.local", port = 51820,
            publicKey = "3Yh8nK2mQ6vB4xZ1cL9tR5wJ7pD0fG3sH6aE8uM4iO=",
            dns = "10.13.0.1", status = "active", capacity = 250, tunnelCount = 88,
            loadPct = 58, ipv4Prefix = "10.13.2.0/24", ipv6Prefix = "fd00:0a13::/64",
            supportsDualStack = true, lastHeartbeatAt = secondsAgoIso(22),
        ),
        ServerDto(
            id = "srv-sg-sin-01", code = "sg-sin-01", name = "Singapore-1",
            country = "Singapore", city = "Singapore",
            host = "sin01.demo.aegisvpn.local", port = 51820,
            publicKey = "9Ws4tH7yB2kX5mQ1nV8cZ3lR6pJ0dF4gA7sE2uT9oI=",
            dns = "10.13.0.1", status = "maintenance", capacity = 250, tunnelCount = 0,
            loadPct = 0, ipv4Prefix = "10.13.3.0/24", ipv6Prefix = "fd00:0a14::/64",
            supportsDualStack = true, lastHeartbeatAt = secondsAgoIso(410),
        ),
        ServerDto(
            id = "srv-jp-tyo-01", code = "jp-tyo-01", name = "Tokyo-1",
            country = "Japan", city = "Tokyo",
            host = "tyo01.demo.aegisvpn.local", port = 51820,
            publicKey = "5Mn8qK3wX7zB1vC4tL9hR2yJ6pD0sF8gE5aU3iO7eQ=",
            dns = "10.13.0.1", status = "offline", capacity = 250, tunnelCount = 0,
            loadPct = 0, ipv4Prefix = "10.13.4.0/24", ipv6Prefix = "fd00:0a15::/64",
            supportsDualStack = true, lastHeartbeatAt = daysAgoIso(2),
        ),
        ServerDto(
            id = "srv-uk-lon-01", code = "uk-lon-01", name = "London-1",
            country = "United Kingdom", city = "London",
            host = "lon01.demo.aegisvpn.local", port = 51820,
            publicKey = "8Jc3vB6nX2mQ9wZ5kL1tR7yH4pD0fS6gA8uE3iT5oM=",
            dns = "10.13.0.1", status = "drain", capacity = 250, tunnelCount = 12,
            loadPct = 77, ipv4Prefix = "10.13.5.0/24", ipv6Prefix = "fd00:0a16::/64",
            supportsDualStack = true, lastHeartbeatAt = secondsAgoIso(25),
        ),
        ServerDto(
            id = "srv-fi-hel-01", code = "fi-hel-01", name = "Helsinki-1",
            country = "Finland", city = "Helsinki",
            host = "hel01.demo.aegisvpn.local", port = 51820,
            publicKey = "2Fd7sH4kQ8nX3wZ6mB9vL1cR5tJ0pG7yA4uE8iS2oW=",
            dns = "10.13.0.1", status = "active", capacity = 60, tunnelCount = 7,
            loadPct = 12, ipv4Prefix = "10.13.6.0/24", ipv6Prefix = "::/0",
            supportsDualStack = false, lastHeartbeatAt = secondsAgoIso(19),
        ),
    )

    // ---- tunnels / sessions / subscription ----

    private val tunnels = mutableListOf<TunnelDto>()

    private val sessions = mutableListOf(
        SessionDto(
            id = "ses-demo-seed",
            state = "connected",
            deviceId = "dev-demo-pixel8",
            deviceName = "Pixel 8",
            serverId = "srv-nl-ams-01",
            serverName = "Amsterdam-1",
            connectedAt = minutesAgoIso(12),
            closedAt = null,
            bytesIn = 1_284_996_112,
            bytesOut = 96_402_113,
        ),
    )

    private var subscription = SubscriptionDto(
        plan = "free",
        status = "active",
        currentPeriodEnd = null,
        maxDevices = 2,
    )

    private val plans = listOf(
        PlanDto(
            code = "free", name = "Free", priceCents = 0, interval = "month",
            maxDevices = 2,
            features = listOf("2 devices", "All server regions", "Kill switch", "Unlimited data"),
        ),
        PlanDto(
            code = "premium", name = "Premium", priceCents = 700, interval = "month",
            maxDevices = 10,
            features = listOf("10 devices", "Priority routing", "Dedicated IPv6", "Kill switch"),
        ),
    )

    private val counter = AtomicInteger(0)

    // ---- time helpers ----

    private fun nowIso(): String = Instant.now().toString()
    private fun secondsAgoIso(s: Long): String = Instant.now().minusSeconds(s).toString()
    private fun minutesAgoIso(m: Long): String = Instant.now().minusSeconds(m * 60).toString()
    private fun daysAgoIso(d: Long): String = Instant.now().minusSeconds(d * 86_400).toString()
    private fun daysFromNowIso(d: Long): String = Instant.now().plusSeconds(d * 86_400).toString()

    private fun nextId(prefix: String): String = "$prefix-demo-${counter.incrementAndGet()}"

    private fun err(code: String, message: String): String =
        json.encodeToString(ErrorEnvelope(ErrorBody(code = code, message = message)))

    // ---- routing ----

    /**
     * Handles one control-plane request. Returns HTTP status + JSON body
     * (null body = empty response, used for 204s).
     */
    fun handle(method: String, path: String, body: String?): Pair<Int, String?> =
        synchronized(this) { route(method, path, body) }

    private fun route(method: String, path: String, body: String?): Pair<Int, String?> {
        val segs = path.split('/').filter { it.isNotBlank() }
        if (segs.isEmpty()) return 404 to err("NOT_FOUND", "No demo handler for '$path'")

        return when (segs[0]) {
            "auth" -> authRoute(method, segs.getOrNull(1), body)
            "devices" -> devicesRoute(method, segs.getOrNull(1), body)
            "servers" -> serversRoute(method, segs.getOrNull(1))
            "vpn" -> vpnRoute(method, segs.getOrNull(1), segs.getOrNull(2), segs.getOrNull(3), body)
            "sessions" -> sessionsRoute(method, segs.getOrNull(1))
            "subscription" -> subscriptionRoute(method, segs.getOrNull(1), body)
            else -> 404 to err("NOT_FOUND", "No demo handler for '$path'")
        }
    }

    // ---- auth ----

    private fun authRoute(method: String, action: String?, body: String?): Pair<Int, String?> {
        return when {
            method == "POST" && action == "login" -> {
                val req = decode<LoginRequest>(body)
                    ?: return 400 to err("BAD_REQUEST", "Unreadable login body")
                userEmail = req.email.trim()
                currentDevice = currentDevice.copy(
                    name = req.deviceName.ifBlank { currentDevice.name },
                    lastActiveAt = nowIso(),
                )
                touchCurrentDeviceRow()
                200 to json.encodeToString(authSuccess())
            }

            method == "POST" && action == "register" -> {
                val req = decode<RegisterRequest>(body)
                    ?: return 400 to err("BAD_REQUEST", "Unreadable register body")
                userEmail = req.email.trim()
                userName = req.name.trim().ifBlank { "Demo User" }
                currentDevice = currentDevice.copy(
                    name = req.deviceName.ifBlank { currentDevice.name },
                    lastActiveAt = nowIso(),
                )
                touchCurrentDeviceRow()
                200 to json.encodeToString(authSuccess())
            }

            method == "POST" && action == "refresh" -> 200 to json.encodeToString(
                RefreshDto(
                    accessToken = "demo-access-${UUID.randomUUID()}",
                    refreshToken = "demo-refresh-${UUID.randomUUID()}",
                ),
            )

            method == "POST" && action == "logout" -> 204 to null
            method == "POST" && action == "password-change" -> 204 to null
            method == "DELETE" && action == "account" -> 204 to null

            method == "GET" && action == "me" -> 200 to json.encodeToString(me())

            else -> 404 to err("NOT_FOUND", "No demo handler for auth/$action")
        }
    }

    private fun authSuccess(): AuthSuccessDto = AuthSuccessDto(
        user = userDto(),
        device = currentDevice,
        accessToken = "demo-access-${UUID.randomUUID()}",
        refreshToken = "demo-refresh-${UUID.randomUUID()}",
    )

    private fun userDto(): UserDto = UserDto(
        id = USER_ID,
        email = userEmail,
        name = userName,
        role = "user",
        status = "active",
        createdAt = daysAgoIso(60),
    )

    private fun me(): MeDto = MeDto(
        user = userDto(),
        subscription = subscription,
        device = currentDevice,
    )

    /** Keep the device list in sync with the current device row. */
    private fun touchCurrentDeviceRow() {
        val idx = devices.indexOfFirst { it.id == CURRENT_DEVICE_ID }
        val row = DeviceSummaryDto(
            id = currentDevice.id,
            name = currentDevice.name,
            platform = currentDevice.platform,
            status = currentDevice.status,
            lastActiveAt = currentDevice.lastActiveAt,
            createdAt = devices.getOrNull(idx)?.createdAt ?: nowIso(),
            session = devices.getOrNull(idx)?.session,
        )
        if (idx >= 0) devices[idx] = row else devices.add(0, row)
    }

    // ---- devices ----

    private fun devicesRoute(method: String, id: String?, body: String?): Pair<Int, String?> {
        return when {
            method == "GET" && id == null -> 200 to json.encodeToString(DevicesEnvelope(devices.toList()))

            method == "PATCH" && id != null -> {
                val req = decode<PatchDeviceRequest>(body)
                    ?: return 400 to err("BAD_REQUEST", "Unreadable rename body")
                val idx = devices.indexOfFirst { it.id == id }
                    .takeIf { it >= 0 }
                    ?: return 404 to err("NOT_FOUND", "No device '$id' in demo data")
                val updated = devices[idx].copy(name = req.name.trim(), lastActiveAt = nowIso())
                devices[idx] = updated
                if (id == CURRENT_DEVICE_ID) currentDevice = currentDevice.copy(name = req.name.trim())
                200 to json.encodeToString(
                    DeviceEnvelope(
                        DeviceDto(
                            id = updated.id, name = updated.name, platform = updated.platform,
                            status = updated.status, lastActiveAt = updated.lastActiveAt,
                        ),
                    ),
                )
            }

            method == "DELETE" && id != null -> {
                if (id == CURRENT_DEVICE_ID) {
                    409 to err("VALIDATION_ERROR", "Cannot revoke the device you are using")
                } else {
                    devices.removeAll { it.id == id }
                    204 to null
                }
            }

            else -> 404 to err("NOT_FOUND", "No demo handler for devices/$id")
        }
    }

    // ---- servers ----

    private fun serversRoute(method: String, id: String?): Pair<Int, String?> = when {
        method == "GET" && id == null -> 200 to json.encodeToString(ServersEnvelope(servers))
        method == "GET" && id != null -> servers.find { it.id == id || it.code == id }
            ?.let { 200 to json.encodeToString(ServerEnvelope(it)) }
            ?: (404 to err("NOT_FOUND", "No server '$id' in demo data"))

        else -> 404 to err("NOT_FOUND", "No demo handler for servers")
    }

    // ---- vpn peers (provisioning) ----

    private fun vpnRoute(
        method: String,
        resource: String?,
        id: String?,
        subAction: String?,
        body: String?,
    ): Pair<Int, String?> {
        if (resource != "peers") return 404 to err("NOT_FOUND", "No demo handler for vpn/$resource")

        return when {
            method == "POST" && id == null -> {
                val req = decode<CreatePeerRequest>(body)
                    ?: return 400 to err("BAD_REQUEST", "Unreadable peer body")
                val server = servers.find { it.id == req.serverId }
                    ?: return 404 to err("NOT_FOUND", "No server '${req.serverId}' in demo data")
                if (server.status != "active") {
                    return 409 to err(
                        "SERVER_UNAVAILABLE",
                        "Server ${server.name} is ${server.status} — pick another server",
                    )
                }
                val tunnel = TunnelDto(
                    id = nextId("tun"),
                    serverId = server.id,
                    addressV4 = server.ipv4Prefix.removeSuffix(".0/24") + ".2",
                    addressV6 = if (server.supportsDualStack) {
                        server.ipv6Prefix.replace("::/64", "::2")
                    } else {
                        null
                    },
                    serverPublicKey = server.publicKey,
                    endpointHost = server.host,
                    endpointPort = server.port,
                    allowedIps = listOf("0.0.0.0/0", "::/0"),
                    dns = server.dns,
                    mtu = 1420,
                    keepalive = 25,
                    status = "active",
                )
                tunnels.add(tunnel)
                val session = SessionDto(
                    id = nextId("ses"),
                    state = "connected",
                    deviceId = req.deviceId,
                    deviceName = currentDevice.name,
                    serverId = server.id,
                    serverName = server.name,
                    connectedAt = nowIso(),
                    closedAt = null,
                    bytesIn = 0,
                    bytesOut = 0,
                )
                sessions.add(session)
                201 to json.encodeToString(
                    CreatePeerResponse(tunnel = tunnel, session = SessionRefDto(session.id, session.state)),
                )
            }

            method == "GET" && id == null -> 200 to json.encodeToString(TunnelsEnvelope(tunnels.toList()))

            method == "GET" && id != null -> tunnels.find { it.id == id }
                ?.let { 200 to json.encodeToString(TunnelEnvelope(tunnel = it)) }
                ?: (404 to err("NOT_FOUND", "No tunnel '$id' in demo data"))

            method == "DELETE" && id != null -> {
                val tunnel = tunnels.find { it.id == id }
                tunnels.removeAll { it.id == id }
                if (tunnel != null) {
                    closeSessions { it.deviceId == currentDevice.id && it.serverId == tunnel.serverId && it.state != "closed" }
                }
                204 to null
            }

            method == "POST" && id != null && subAction == "rotate" -> {
                decode<RotatePeerRequest>(body)
                    ?: return 400 to err("BAD_REQUEST", "Unreadable rotate body")
                val idx = tunnels.indexOfFirst { it.id == id }
                    .takeIf { it >= 0 }
                    ?: return 404 to err("NOT_FOUND", "No tunnel '$id' in demo data")
                200 to json.encodeToString(RotatePeerResponse(tunnel = tunnels[idx]))
            }

            else -> 404 to err("NOT_FOUND", "No demo handler for vpn/peers")
        }
    }

    // ---- sessions ----

    private fun sessionsRoute(method: String, id: String?): Pair<Int, String?> = when {
        method == "GET" && id == null -> 200 to json.encodeToString(SessionsEnvelope(sessions.toList()))

        method == "DELETE" && id != null -> {
            closeSessions { it.id == id && it.state != "closed" }
            204 to null
        }

        else -> 404 to err("NOT_FOUND", "No demo handler for sessions")
    }

    private fun closeSessions(predicate: (SessionDto) -> Boolean) {
        for (i in sessions.indices) {
            val s = sessions[i]
            if (predicate(s)) sessions[i] = s.copy(state = "closed", closedAt = nowIso())
        }
    }

    // ---- subscription ----

    private fun subscriptionRoute(method: String, action: String?, body: String?): Pair<Int, String?> {
        return when {
            method == "GET" && action == null -> 200 to json.encodeToString(SubscriptionEnvelope(subscription))

            method == "GET" && action == "plans" -> 200 to json.encodeToString(PlansEnvelope(plans))

            method == "POST" && action == "checkout" -> {
                val req = decode<CheckoutRequest>(body)
                    ?: return 400 to err("BAD_REQUEST", "Unreadable checkout body")
                val plan = plans.find { it.code == req.planCode }
                    ?: return 404 to err("NOT_FOUND", "No plan '${req.planCode}' in demo data")
                subscription = SubscriptionDto(
                    plan = plan.code,
                    status = "active",
                    currentPeriodEnd = daysFromNowIso(30),
                    maxDevices = plan.maxDevices,
                )
                200 to json.encodeToString(SubscriptionEnvelope(subscription))
            }

            method == "POST" && action == "cancel" -> {
                subscription = subscription.copy(
                    plan = "free",
                    currentPeriodEnd = null,
                    maxDevices = 2,
                )
                200 to json.encodeToString(SubscriptionEnvelope(subscription))
            }

            else -> 404 to err("NOT_FOUND", "No demo handler for subscription/$action")
        }
    }

    // ---- decode helper ----

    private inline fun <reified T> decode(body: String?): T? = try {
        body?.let { json.decodeFromString<T>(it) }
    } catch (_: Exception) {
        null
    }
}
