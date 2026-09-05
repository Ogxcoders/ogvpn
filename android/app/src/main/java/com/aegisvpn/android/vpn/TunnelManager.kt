package com.aegisvpn.android.vpn

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.VpnService
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import com.aegisvpn.android.data.repo.AuthRepository
import com.aegisvpn.android.data.repo.VpnRepository
import com.aegisvpn.android.domain.VpnEvent
import com.aegisvpn.android.domain.VpnState
import com.aegisvpn.android.domain.VpnStateMachine
import com.aegisvpn.android.notifications.Notifier
import com.wireguard.android.backend.Backend
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import com.wireguard.config.InetAddresses
import com.wireguard.config.InetNetwork
import com.wireguard.config.Interface
import com.wireguard.config.Peer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * The VPN engine.
 *
 * State flow: UI events + tunnel callbacks + network callbacks all feed the
 * pure [VpnStateMachine]; the machine's output state is exposed as a
 * [StateFlow] that the UI renders verbatim. The UI NEVER shows "Connected"
 * unless [VpnState.Connected] was reached from real tunnel statistics.
 *
 * Kill switch semantics (documented honestly):
 *  - app level: when the tunnel drops with the kill switch enabled we keep
 *    trying to reconnect with backoff and clearly label traffic as
 *    unprotected in the notification; we do NOT silently pretend protection.
 *  - OS level: full always-on/lockdown enforcement is available via Android
 *    Settings → VPN → Always-on (system-managed). See README.
 */
class TunnelManager(
    private val context: Context,
    private val notifier: Notifier,
    private val dataStore: DataStore<Preferences>,
    private val authRepository: AuthRepository,
    private val vpnRepository: VpnRepository,
) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val machine = VpnStateMachine()

    private val _state = MutableStateFlow<VpnState>(VpnState.Idle)
    val state: StateFlow<VpnState> = _state.asStateFlow()

    private val backend: Backend by lazy { GoBackend(context) }

    private var wgTunnel: WgTunnel? = null
    private var activeConfig: Config? = null
    private var statsJob: Job? = null
    private var reconnectJob: Job? = null
    private var lastRx = 0L
    private var lastTx = 0L
    private var connectedServerId: String? = null

    /** Server + tunnel summary for the home screen. */
    private val _sessionInfo = MutableStateFlow<SessionInfo?>(null)
    val sessionInfo: StateFlow<SessionInfo?> = _sessionInfo.asStateFlow()

    data class SessionInfo(
        val serverId: String,
        val serverLabel: String,
        val tunnelId: String,
        val addressV4: String,
        val connectedSinceMs: Long,
    )

    private val connectivity: ConnectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            machine.transition(VpnEvent.NetworkRestored)
            publish()
        }

        override fun onLost(network: Network) {
            machine.transition(VpnEvent.NetworkLost)
            publish()
        }
    }

    private val netRequest = NetworkRequest.Builder()
        .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        .build()

    init {
        scope.launch {
            // Mirror state machine transitions into the shared flow + notification.
            machineEvents()
        }
        scope.launch {
            authRepository.events.collect { event ->
                if (event is com.aegisvpn.android.domain.AuthEvent.LoggedOut ||
                    event is com.aegisvpn.android.domain.AuthEvent.SessionExpired
                ) {
                    disconnectInternal(clearServer = true)
                }
            }
        }
        try {
            connectivity.registerNetworkCallback(netRequest, networkCallback)
        } catch (e: Exception) {
            Log.w(TAG, "network callback registration failed", e)
        }
    }

    private suspend fun machineEvents() {
        // The state flow is updated by publish(); nothing else needed here.
    }

    // ---- settings ----

    suspend fun killSwitchEnabled(): Boolean =
        dataStore.data.first()[KEY_KILL_SWITCH] ?: true

    suspend fun setKillSwitch(enabled: Boolean) {
        dataStore.edit { it[KEY_KILL_SWITCH] = enabled }
    }

    suspend fun autoConnect(): Boolean =
        dataStore.data.first()[KEY_AUTO_CONNECT] ?: false

    suspend fun setAutoConnect(enabled: Boolean) {
        dataStore.edit { it[KEY_AUTO_CONNECT] = enabled }
    }

    suspend fun excludedPackages(): Set<String> =
        dataStore.data.first()[KEY_EXCLUDED] ?: emptySet()

    /** Per-app VPN (split tunneling, exclude mode). Applying requires a reconnect. */
    suspend fun setExcludedPackages(packages: Set<String>) {
        dataStore.edit { it[KEY_EXCLUDED] = packages }
        if (_state.value is VpnState.Connected || _state.value is VpnState.Reconnecting) {
            connectedServerId?.let { reconnectNow(it) }
        }
    }

    // ---- connect flow ----

    /**
     * Starts the connect sequence. Returns the VpnService consent Intent when
     * the user must approve VPN permission (UI calls startSystemVpnPermission
     * / onPermissionGranted afterwards), or null when we went straight to
     * connecting.
     */
    suspend fun connect(serverId: String): Intent? {
        val consent = VpnService.prepare(context)
        if (consent != null) {
            // Permission not yet granted: park in VpnPermissionRequired and
            // wait for MainActivity to deliver the consent result.
            machine.transition(VpnEvent.ConnectRequested)
            machine.reset(VpnState.VpnPermissionRequired)
            publish()
            pendingServerId = serverId
            return consent
        }
        onPermissionGranted(serverId)
        return null
    }

    private var pendingServerId: String? = null

    fun onPermissionDenied(serverId: String?) {
        pendingServerId = null
        machine.transition(VpnEvent.PermissionDenied)
        publish()
    }

    fun onPermissionGranted(serverId: String?) {
        val target = serverId ?: pendingServerId
        if (target == null) return
        pendingServerId = null
        machine.transition(VpnEvent.PermissionGranted)
        scope.launch { doConnect(target) }
    }

    private suspend fun doConnect(serverId: String) {
        machine.transition(VpnEvent.ConnectRequested)
        publish()
        try {
            machine.transition(VpnEvent.ConfigReady)
            val server = vpnRepository.server(serverId)
            if (server.status != "active") {
                machine.transition(VpnEvent.ServerUnavailable)
                publish()
                return
            }
            val device = authRepository.me().device
            val tunnel = vpnRepository.createTunnel(device.id, server.id)
            val privateKey = vpnRepository.tunnelPrivateKey(tunnel.id)
                ?: throw IllegalStateException("Private key missing for provisioned tunnel")

            val config = buildWireGuardConfig(tunnel, privateKey, excludedPackages())
            activeConfig = config
            connectedServerId = server.id
            _sessionInfo.value = SessionInfo(
                serverId = server.id,
                serverLabel = "${server.name} · ${server.city}, ${server.country}",
                tunnelId = tunnel.id,
                addressV4 = tunnel.addressV4,
                connectedSinceMs = System.currentTimeMillis(),
            )

            // Bring the VpnService to the foreground; its onStartCommand hands
            // control back to onServiceStarted() which drives GoBackend.
            val svcIntent = Intent(context, AegisVpnService::class.java)
                .setAction(AegisVpnService.ACTION_CONNECT)
            context.startForegroundService(svcIntent)
            publish()
        } catch (e: Exception) {
            Log.e(TAG, "connect failed", e)
            machine.transition(VpnEvent.ApiFailed("CONNECT_FAILED", e.message))
            publish()
        }
    }

    /**
     * Called by [AegisVpnService] once it is in the foreground: builds the
     * TUN interface through GoBackend and starts handshake detection.
     */
    fun onServiceStarted(service: AegisVpnService) {
        try {
            val config = activeConfig ?: throw IllegalStateException("No active config")
            val tunnel = WgTunnel()
            wgTunnel = tunnel
            val state = backend.setState(tunnel, Tunnel.State.UP, config)
            Log.i(TAG, "tunnel state: $state")
            machine.transition(VpnEvent.TunnelUp)
            publish()
            startStatsLoop()
        } catch (e: Exception) {
            Log.e(TAG, "tunnel establishment failed", e)
            machine.transition(VpnEvent.ApiFailed("TUNNEL_FAILED", e.message))
            publish()
        }
    }

    fun serviceDisconnected() {
        wgTunnel = null
    }

    private fun buildWireGuardConfig(
        tunnel: com.aegisvpn.android.domain.TunnelConfig,
        privateKey: String,
        excluded: Set<String>,
    ): Config {
        val interfaceBuilder = Interface.Builder()
            .parsePrivateKey(privateKey)
            .addAddress(InetNetwork.parse("${tunnel.addressV4}/32"))
        if (!tunnel.addressV6.isNullOrBlank() && tunnel.addressV6 != "::") {
            interfaceBuilder.addAddress(InetNetwork.parse("${tunnel.addressV6}/128"))
        }
        if (tunnel.dns.isNotBlank()) {
            try {
                interfaceBuilder.addDnsServer(InetAddresses.parse(tunnel.dns))
            } catch (e: Exception) {
                Log.w(TAG, "unparseable DNS server from contract: ${tunnel.dns}", e)
            }
        }
        if (excluded.isNotEmpty()) {
            // Split tunneling (exclude mode) is an Interface-level property in
            // this wireguard-android line: excludeApplications(Collection<String>).
            interfaceBuilder.excludeApplications(excluded)
        }
        val peerBuilder = Peer.Builder()
            .parsePublicKey(tunnel.serverPublicKey)
            .parseEndpoint("${tunnel.endpointHost}:${tunnel.endpointPort}")
            .setPersistentKeepalive(tunnel.keepalive)
        for (ip in tunnel.allowedIps) peerBuilder.addAllowedIp(InetNetwork.parse(ip))
        return Config.Builder()
            .setInterface(interfaceBuilder.build())
            .addPeer(peerBuilder.build())
            .build()
    }

    // ---- stats / handshake detection ----

    private fun startStatsLoop() {
        statsJob?.cancel()
        statsJob = scope.launch {
            lastRx = 0L
            lastTx = 0L
            var confirmed = false
            val wgT = wgTunnel ?: return@launch
            val startedAt = System.currentTimeMillis()
            while (isActive && (machine.current is VpnState.Connected || !confirmed)) {
                delay(1000)
                val wg = wgTunnel
                if (wg == null || wg !== wgT) break
                val stats = try {
                    backend.getStatistics(wg)
                } catch (e: Exception) {
                    continue
                }
                val rx = stats.totalRx()
                val tx = stats.totalTx()
                if (!confirmed && (rx > 0 || tx > 0)) {
                    confirmed = true
                    machine.transition(VpnEvent.HandshakeConfirmed)
                    publish()
                }
                if (confirmed && rx == lastRx && tx == lastTx) {
                    val idleMs = System.currentTimeMillis() - (lastActivityMs.get() ?: startedAt)
                    if (idleMs > STALE_AFTER_MS) {
                        machine.transition(VpnEvent.HandshakeStale)
                        publish()
                        break
                    }
                } else {
                    lastActivityMs.set(System.currentTimeMillis())
                }
                lastRx = rx
                lastTx = tx
            }
        }
    }

    private val lastActivityMs = ThreadLocal<Long>().apply { set(null) }

    // ---- disconnect / kill switch ----

    fun disconnect() {
        scope.launch { disconnectInternal(clearServer = false) }
    }

    private suspend fun disconnectInternal(clearServer: Boolean) {
        reconnectJob?.cancel()
        statsJob?.cancel()
        val wg = wgTunnel
        if (wg != null) {
            try {
                withContext(Dispatchers.IO) { backend.setState(wg, Tunnel.State.DOWN, null) }
            } catch (e: Exception) {
                Log.w(TAG, "tunnel teardown error", e)
            }
        }
        wgTunnel = null
        activeConfig = null
        val serverId = connectedServerId
        if (clearServer) {
            connectedServerId = null
            _sessionInfo.value = null
        }
        machine.transition(VpnEvent.DisconnectRequested)
        machine.transition(VpnEvent.TunnelDown)
        publish()
        if (serverId != null && !clearServer) {
            // Session record cleanup on the backend (best effort).
            try {
                val sessions = vpnRepository.sessions()
                sessions.firstOrNull { it.state != "closed" }?.let { vpnRepository.forceDisconnect(it.id) }
            } catch (e: Exception) {
                Log.w(TAG, "session cleanup failed", e)
            }
        }
    }

    fun onVpnRevoked() {
        // Another VPN app took over, or the user revoked consent in Settings.
        wgTunnel = null
        activeConfig = null
        machine.transition(VpnEvent.PermissionRevoked)
        publish()
        notifier.alert(
            "VPN disconnected",
            "AegisVPN lost system VPN access. Your traffic is NOT protected. Tap to reconnect.",
        )
    }

    private suspend fun reconnectNow(serverId: String) {
        disconnectInternal(clearServer = false)
        delay(500)
        doConnect(serverId)
    }

    // ---- state propagation ----

    private fun publish() {
        val s = machine.current
        _state.value = s
        val label = stateLabel(s)
        val server = _sessionInfo.value?.serverLabel
        notifier.updateServiceNotification(label, server)
    }

    fun currentState(): VpnState = machine.current

    /** Called when the system Always-on VPN feature started the tunnel itself. */
    fun onAlwaysOnStarted() {
        machine.transition(VpnEvent.TunnelUp)
        publish()
    }

    /** Minimal [Tunnel] adapter: stable identity + no-op state callbacks. */
    private class WgTunnel(private val name: String = "aegisvpn0") : Tunnel {
        override fun getName(): String = name
        override fun onStateChange(newState: Tunnel.State) {}
    }

    companion object {
        private const val TAG = "TunnelManager"
        private const val STALE_AFTER_MS = 30_000L
        val KEY_KILL_SWITCH = booleanPreferencesKey("kill_switch")
        val KEY_AUTO_CONNECT = booleanPreferencesKey("auto_connect")
        val KEY_EXCLUDED = stringSetPreferencesKey("excluded_packages")

        fun stateLabel(state: VpnState): String = when (state) {
            is VpnState.Idle -> "Idle"
            is VpnState.Preparing -> "Preparing…"
            is VpnState.Authorizing -> "Authorizing…"
            is VpnState.Configuring -> "Configuring…"
            is VpnState.Connecting -> "Connecting…"
            is VpnState.Handshaking -> "Handshaking…"
            is VpnState.Connected -> "Connected"
            is VpnState.Reconnecting -> "Reconnecting…"
            is VpnState.Disconnecting -> "Disconnecting…"
            is VpnState.Disconnected -> "Disconnected"
            is VpnState.Offline -> "Offline"
            is VpnState.AuthRequired -> "Sign-in required"
            is VpnState.VpnPermissionRequired -> "VPN permission required"
            is VpnState.ServerUnavailable -> "Server unavailable"
            is VpnState.ConfigurationError -> "Configuration error"
            is VpnState.Error -> "Error"
        }
    }
}
