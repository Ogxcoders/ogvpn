package com.aegisvpn.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Place
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.aegisvpn.android.data.demo.DemoMode
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.VpnState
import com.aegisvpn.android.ui.theme.AegisCard
import com.aegisvpn.android.ui.theme.AegisIconButton
import com.aegisvpn.android.ui.theme.DemoBanner
import com.aegisvpn.android.ui.theme.ErrorPanel
import com.aegisvpn.android.ui.theme.LocalAegisColors
import com.aegisvpn.android.ui.theme.RingState
import com.aegisvpn.android.ui.theme.Spacing
import com.aegisvpn.android.ui.theme.StatusRing
import com.aegisvpn.android.ui.theme.StatePill
import com.aegisvpn.android.vpn.TunnelManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Home — the protection decision dominates this screen. The state label is
 * rendered VERBATIM from TunnelManager's state machine: the UI never claims
 * "Connected" unless the tunnel actually is. The primary action is the ring
 * itself (228dp), reachable with one thumb; secondary navigation sits at the
 * bottom where the thumb naturally rests.
 */
@Composable
fun HomeScreen(onOpenServers: () -> Unit, onOpenSettings: () -> Unit) {
    val scope = rememberCoroutineScope()
    val aegis = LocalAegisColors.current
    val state by ServiceLocator.tunnelManager.state.collectAsStateWithLifecycle()
    val session by ServiceLocator.tunnelManager.sessionInfo.collectAsStateWithLifecycle()

    var busy by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var selectedServerLabel by remember { mutableStateOf<String?>(null) }
    var selectedServerStatus by remember { mutableStateOf<String?>(null) }

    // Session duration ticker — a single text recomposes per second.
    var nowMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            nowMs = System.currentTimeMillis()
        }
    }

    // Reflect the selected server while no tunnel is up.
    LaunchedEffect(state is VpnState.Idle, state is VpnState.Disconnected) {
        if (state is VpnState.Idle || state is VpnState.Disconnected) {
            val sid = ServiceLocator.vpnRepository.selectedServerId()
            val server = sid?.let { id ->
                runCatching { ServiceLocator.vpnRepository.server(id) }.getOrNull()
            }
            selectedServerLabel = server?.let { "${it.name} · ${it.city}, ${it.country}" }
            selectedServerStatus = server?.status
        }
    }

    val connected = state is VpnState.Connected
    val inFlight = state is VpnState.Connecting || state is VpnState.Handshaking ||
        state is VpnState.Reconnecting || state is VpnState.Preparing ||
        state is VpnState.Authorizing || state is VpnState.Configuring ||
        state is VpnState.Disconnecting
    val failed = state is VpnState.Error || state is VpnState.ServerUnavailable ||
        state is VpnState.ConfigurationError

    val ring: RingState = when (state) {
        is VpnState.Connected -> RingState.PROTECTED
        is VpnState.Reconnecting -> RingState.RECOVERING
        is VpnState.Disconnecting -> RingState.DISCONNECTING
        is VpnState.Offline -> RingState.OFFLINE
        is VpnState.Error, is VpnState.ServerUnavailable, is VpnState.ConfigurationError -> RingState.FAILED
        is VpnState.Preparing, is VpnState.Authorizing, is VpnState.Configuring,
        is VpnState.Connecting, is VpnState.Handshaking,
        -> RingState.CONNECTING
        else -> RingState.RESTING
    }

    val headline = TunnelManager.stateLabel(state)
    val hint = stateHint(state)
    val actionLabel = when {
        connected -> "Disconnect VPN"
        inFlight -> "Connection in progress"
        else -> "Connect VPN"
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    0f to MaterialTheme.colorScheme.background,
                    1f to MaterialTheme.colorScheme.background.copy(alpha = 0.92f),
                ),
            ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = Spacing.xl)
                .padding(top = Spacing.md)
                .statusBarsPadding(),
        ) {
            // ---------- Header: brand + settings ----------
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.weight(1f)) {
                    Text("AegisVPN", style = MaterialTheme.typography.titleLarge)
                    Text(
                        if (DemoMode.enabled) "Offline demo" else "WireGuard tunnel",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                AegisIconButton(
                    icon = Icons.Rounded.Settings,
                    label = "Open settings",
                    onClick = onOpenSettings,
                )
            }

            if (DemoMode.enabled) {
                Spacer(Modifier.height(Spacing.md))
                DemoBanner()
            }

            // ---------- Protection status (dominant) ----------
            Spacer(Modifier.height(Spacing.xl))
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                StatusRing(
                    state = ring,
                    headline = headline,
                    hint = hint,
                    actionLabel = actionLabel,
                    enabled = !busy && !inFlight,
                ) {
                    scope.launch {
                        busy = true
                        errorText = null
                        try {
                            if (connected) {
                                ServiceLocator.tunnelManager.disconnect()
                            } else {
                                val serverId = ServiceLocator.vpnRepository.selectedServerId()
                                    ?: ServiceLocator.vpnRepository.servers()
                                        .filter { it.status == "active" }
                                        .minByOrNull { it.loadPct }
                                        ?.id
                                    ?: throw RepoError.Network(java.io.IOException("No active server available — check your connection and retry."))
                                ServiceLocator.vpnRepository.selectServer(serverId)
                                ServiceLocator.tunnelManager.connect(serverId)?.let { consent ->
                                    // MainActivity observes this via snapshotFlow.
                                    vpnConsentEmitter.value = consent to serverId
                                }
                            }
                        } catch (e: RepoError) {
                            errorText = e.message
                        } catch (e: Exception) {
                            errorText = "Connect failed: ${e.message}. Check your network, then tap Try again."
                        } finally {
                            busy = false
                        }
                    }
                }
            }

            // ---------- Error panel (what happened + next safe action) ----------
            if (failed) {
                Spacer(Modifier.height(Spacing.lg))
                ErrorPanel(
                    message = stateErrorMessage(state),
                    suggestion = stateErrorSuggestion(state),
                    onRetry = {
                        scope.launch {
                            val serverId = ServiceLocator.vpnRepository.selectedServerId() ?: return@launch
                            ServiceLocator.tunnelManager.connect(serverId)?.let { consent ->
                                vpnConsentEmitter.value = consent to serverId
                            }
                        }
                    },
                )
            }

            // ---------- Server card (subordinate to the decision) ----------
            Spacer(Modifier.height(Spacing.lg))
            AegisCard {
                Column(Modifier.padding(Spacing.lg)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Rounded.Place,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(Modifier.size(8.dp))
                        Text(
                            if (connected || inFlight) "Connected server" else "Selected server",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f),
                        )
                        selectedServerStatus?.let { status ->
                            if (!connected && !inFlight) {
                                StatePill(
                                    text = status,
                                    color = when (status) {
                                        "active" -> aegis.success
                                        "maintenance", "drain" -> aegis.warning
                                        else -> aegis.danger
                                    },
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(
                        session?.serverLabel ?: selectedServerLabel ?: "No server selected yet",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Spacer(Modifier.height(Spacing.md))
                    Row(Modifier.fillMaxWidth()) {
                        MetricColumn(
                            label = "Tunnel IP",
                            value = session?.addressV4 ?: "—",
                            modifier = Modifier.weight(1f),
                        )
                        MetricColumn(
                            label = "Session",
                            value = if (connected && session != null) {
                                formatDuration(nowMs - session!!.connectedSinceMs)
                            } else {
                                "—"
                            },
                            modifier = Modifier.weight(1f),
                        )
                        MetricColumn(
                            label = "Protocol",
                            value = "WireGuard",
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            // ---------- Bottom navigation (one-thumb reach) ----------
            Spacer(Modifier.height(Spacing.lg))
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                Button(
                    onClick = onOpenServers,
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 52.dp),
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Icon(Icons.Rounded.Place, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text("Choose server")
                }
                OutlinedButton(
                    onClick = onOpenSettings,
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                    ),
                ) {
                    Icon(Icons.Rounded.Settings, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text("Settings")
                }
            }
            Spacer(Modifier.height(Spacing.md))
            Spacer(Modifier.navigationBarsPadding())
        }
    }
}

@Composable
private fun MetricColumn(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier
            .semantics { contentDescription = "$label: $value" },
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(2.dp))
        Text(
            value,
            style = MaterialTheme.typography.titleSmall,
            maxLines = 1,
        )
    }
}

private fun stateHint(state: VpnState): String = when (state) {
    is VpnState.Connected -> "Your traffic is protected"
    is VpnState.Preparing -> "Preparing the VPN service…"
    is VpnState.Authorizing -> "Verifying your account…"
    is VpnState.Configuring -> "Building the tunnel configuration…"
    is VpnState.Connecting -> "Establishing secure tunnel…"
    is VpnState.Handshaking -> "Exchanging encryption keys…"
    is VpnState.Reconnecting -> "Connection lost — recovering…"
    is VpnState.Disconnecting -> "Closing the tunnel…"
    is VpnState.Idle -> "Tap to connect and protect your traffic"
    is VpnState.Disconnected -> "Tap to connect and protect your traffic"
    is VpnState.Offline -> "No network — reconnect when you are back online"
    is VpnState.AuthRequired -> "Sign in to continue"
    is VpnState.VpnPermissionRequired -> "Allow the VPN permission to connect"
    is VpnState.ServerUnavailable -> "Pick another server to continue"
    is VpnState.ConfigurationError -> "Reconnect to rebuild the configuration"
    is VpnState.Error -> "Tap the ring to try again"
}

private fun stateErrorMessage(state: VpnState): String = when (state) {
    is VpnState.Error -> state.message ?: "The tunnel reported an error."
    is VpnState.ServerUnavailable -> "The selected server is not accepting connections right now."
    is VpnState.ConfigurationError -> "The tunnel configuration could not be applied."
    else -> "An unknown error occurred."
}

private fun stateErrorSuggestion(state: VpnState): String = when (state) {
    is VpnState.ServerUnavailable -> "Choose a different active server, then tap Try again."
    is VpnState.ConfigurationError -> "Tap Try again to rebuild the tunnel configuration."
    is VpnState.Error -> "Check your network connection, then tap Try again."
    else -> "Tap Try again, or pick a different server."
}

private fun formatDuration(ms: Long): String {
    val secs = (ms / 1000).coerceAtLeast(0)
    val h = secs / 3600
    val m = (secs % 3600) / 60
    val s = secs % 60
    return when {
        h > 0 -> "%dh %dm".format(h, m)
        m > 0 -> "%dm %ds".format(m, s)
        else -> "%ds".format(s)
    }
}

/** Bridge to MainActivity for the VPN consent intent (see MainActivity). */
object VpnConsentBridge {
    val pending = androidx.compose.runtime.mutableStateOf<Pair<android.content.Intent, String>?>(null)
}

private val vpnConsentEmitter = VpnConsentBridge.pending
