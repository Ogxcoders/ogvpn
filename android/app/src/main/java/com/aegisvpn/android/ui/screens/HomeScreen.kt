package com.aegisvpn.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.VpnState
import com.aegisvpn.android.ui.theme.Amber
import com.aegisvpn.android.ui.theme.Cyan
import com.aegisvpn.android.ui.theme.Green
import com.aegisvpn.android.ui.theme.Red
import com.aegisvpn.android.ui.theme.TextMuted
import com.aegisvpn.android.vpn.TunnelManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Home screen. The state label comes VERBATIM from TunnelManager's state
 * machine — the UI never renders "Connected" unless the tunnel actually is.
 */
@Composable
fun HomeScreen(onOpenServers: () -> Unit, onOpenSettings: () -> Unit) {
    val scope = rememberCoroutineScope()
    val state by ServiceLocator.tunnelManager.state.collectAsStateWithLifecycle()
    val session by ServiceLocator.tunnelManager.sessionInfo.collectAsStateWithLifecycle()

    var busy by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var selectedServerLabel by remember { mutableStateOf<String?>(null) }

    // Session duration ticker.
    var nowMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            nowMs = System.currentTimeMillis()
        }
    }

    // Reflect the selected server when idle.
    LaunchedEffect(state is VpnState.Idle, state is VpnState.Disconnected) {
        if (state is VpnState.Idle || state is VpnState.Disconnected) {
            val sid = ServiceLocator.vpnRepository.selectedServerId()
            selectedServerLabel = if (sid != null) {
                runCatching {
                    val s = ServiceLocator.vpnRepository.server(sid)
                    "${s.name} · ${s.city}, ${s.country}"
                }.getOrNull()
            } else null
        }
    }

    val connected = state is VpnState.Connected
    val inFlight = state is VpnState.Connecting || state is VpnState.Handshaking ||
        state is VpnState.Reconnecting || state is VpnState.Preparing ||
        state is VpnState.Authorizing || state is VpnState.Configuring ||
        state is VpnState.Disconnecting
    val failed = state is VpnState.Error || state is VpnState.ServerUnavailable ||
        state is VpnState.ConfigurationError

    val ringColor = when {
        connected -> Green
        inFlight -> Amber
        failed -> Red
        else -> TextMuted
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(12.dp))
        StateBadge(state)
        Spacer(Modifier.height(24.dp))

        val label = when {
            connected -> "Disconnect"
            inFlight -> "…"
            else -> "Connect"
        }
        Box(
            modifier = Modifier
                .size(170.dp)
                .background(Color.Transparent, RoundedCornerShape(50))
                .border(4.dp, ringColor, RoundedCornerShape(50))
                .semantics { contentDescription = if (connected) "Disconnect VPN" else "Connect VPN" },
            contentAlignment = Alignment.Center,
        ) {
            Button(
                onClick = {
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
                                    ?: throw RepoError.Network(java.io.IOException("no servers"))
                                ServiceLocator.vpnRepository.selectServer(serverId)
                                ServiceLocator.tunnelManager.connect(serverId)?.let { consent ->
                                    // MainActivity receives this via the callback below.
                                    vpnConsentEmitter.emit(consent to serverId)
                                }
                            }
                        } catch (e: RepoError) {
                            errorText = e.message
                        } catch (e: Exception) {
                            errorText = "Connect failed: ${e.message}"
                        } finally {
                            busy = false
                        }
                    }
                },
                enabled = !busy && !inFlight,
            ) {
                Text(label, fontSize = 18.sp)
            }
        }

        Spacer(Modifier.height(24.dp))
        errorText?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(8.dp))
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("Server", style = MaterialTheme.typography.labelMedium, color = TextMuted)
                Text(
                    session?.serverLabel ?: selectedServerLabel ?: "—",
                    style = MaterialTheme.typography.titleMedium,
                )
                Spacer(Modifier.height(8.dp))
                Text("IP (tunnel)", style = MaterialTheme.typography.labelMedium, color = TextMuted)
                Text(session?.addressV4 ?: "—", style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(8.dp))
                Text("Duration", style = MaterialTheme.typography.labelMedium, color = TextMuted)
                Text(
                    if (connected && session != null) formatDuration(nowMs - session!!.connectedSinceMs) else "—",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }

        Spacer(Modifier.height(14.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Button(onClick = onOpenServers, modifier = Modifier.weight(1f)) { Text("Choose server") }
            Button(onClick = onOpenSettings, modifier = Modifier.weight(1f)) { Text("Settings") }
        }
    }
}

@Composable
private fun StateBadge(state: VpnState) {
    val label = TunnelManager.stateLabel(state)
    val color = when (state) {
        is VpnState.Connected -> Green
        is VpnState.Error, is VpnState.ServerUnavailable, is VpnState.ConfigurationError -> Red
        is VpnState.Reconnecting, is VpnState.Connecting, is VpnState.Handshaking,
        is VpnState.Preparing, is VpnState.Authorizing, is VpnState.Configuring,
        is VpnState.Disconnecting, is VpnState.Offline,
        -> Amber
        else -> TextMuted
    }
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(50))
            .border(1.dp, color, RoundedCornerShape(50))
            .padding(horizontal = 14.dp, vertical = 6.dp),
    ) {
        Text(label, color = color, fontSize = 13.sp)
    }
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
