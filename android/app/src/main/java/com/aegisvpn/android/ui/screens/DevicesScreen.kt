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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.aegisvpn.android.data.demo.DemoMode
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.DeviceSummary
import com.aegisvpn.android.ui.theme.AegisCard
import com.aegisvpn.android.ui.theme.AegisIconButton
import com.aegisvpn.android.ui.theme.DemoBanner
import com.aegisvpn.android.ui.theme.ErrorPanel
import com.aegisvpn.android.ui.theme.LocalAegisColors
import com.aegisvpn.android.ui.theme.SkeletonListCard
import com.aegisvpn.android.ui.theme.Spacing
import com.aegisvpn.android.ui.theme.StatePill
import kotlinx.coroutines.launch

/**
 * Device management: list, rename, revoke (mirrors web control plane state).
 * Destructive actions are confirmed with clear consequence text; session
 * state is conveyed by pill + text, never color alone.
 */
@Composable
fun DevicesScreen(onClose: () -> Unit) {
    val scope = rememberCoroutineScope()
    val aegis = LocalAegisColors.current
    var devices by remember { mutableStateOf<List<DeviceSummary>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var renaming by remember { mutableStateOf<DeviceSummary?>(null) }
    var renameValue by remember { mutableStateOf("") }
    var revoking by remember { mutableStateOf<DeviceSummary?>(null) }
    var busy by remember { mutableStateOf(false) }

    fun load() {
        scope.launch {
            try {
                devices = ServiceLocator.vpnRepository.devices()
            } catch (e: RepoError) {
                error = e.message
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    Column(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = Spacing.xl),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Spacing.md),
        ) {
            Column(Modifier.weight(1f)) {
                Text("Devices", style = MaterialTheme.typography.headlineSmall)
                Text(
                    "Revoke anything you don't recognize — it disconnects immediately",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            AegisIconButton(icon = Icons.Rounded.Check, label = "Done — back to settings", onClick = onClose)
        }
        if (DemoMode.enabled) {
            Spacer(Modifier.height(Spacing.md))
            DemoBanner()
        }
        Spacer(Modifier.height(Spacing.lg))

        when {
            error != null -> {
                ErrorPanel(
                    message = error!!,
                    suggestion = "Check your connection, then reload your devices.",
                    onRetry = { error = null; load() },
                )
            }
            devices == null -> {
                Column(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    repeat(3) { SkeletonListCard() }
                }
            }
            devices!!.isEmpty() -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = Spacing.xxxl),
                ) {
                    Text("No devices yet", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(Spacing.sm))
                    Text(
                        "This device will appear here automatically after your first connection.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            else -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    items(devices!!, key = { it.id }) { device ->
                        DeviceRow(
                            device = device,
                            onRename = { renaming = device; renameValue = device.name },
                            onRevoke = { revoking = device },
                        )
                    }
                    item { Spacer(Modifier.height(Spacing.xl)) }
                }
            }
        }
    }

    renaming?.let { target ->
        AlertDialog(
            onDismissRequest = { renaming = null },
            title = { Text("Rename \"${target.name}\"") },
            text = {
                OutlinedTextField(
                    value = renameValue,
                    onValueChange = { renameValue = it },
                    label = { Text("Device name") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                )
            },
            confirmButton = {
                TextButton(
                    enabled = !busy && renameValue.isNotBlank(),
                    onClick = {
                        scope.launch {
                            busy = true
                            try {
                                ServiceLocator.vpnRepository.renameDevice(target.id, renameValue.trim())
                                renaming = null
                                load()
                            } catch (e: RepoError) {
                                error = e.message
                            } finally {
                                busy = false
                            }
                        }
                    },
                ) { Text("Save") }
            },
            dismissButton = { TextButton(onClick = { renaming = null }) { Text("Cancel") } },
        )
    }

    revoking?.let { target ->
        AlertDialog(
            onDismissRequest = { revoking = null },
            title = { Text("Revoke \"${target.name}\"?") },
            text = {
                Text(
                    "The device will be disconnected immediately, its VPN peer removed " +
                        "and its sessions closed. This cannot be undone.",
                )
            },
            confirmButton = {
                TextButton(
                    enabled = !busy,
                    onClick = {
                        scope.launch {
                            busy = true
                            try {
                                ServiceLocator.vpnRepository.revokeDevice(target.id)
                                revoking = null
                                load()
                            } catch (e: RepoError) {
                                error = e.message
                            } finally {
                                busy = false
                            }
                        }
                    },
                ) { Text("Revoke device", color = aegis.danger) }
            },
            dismissButton = { TextButton(onClick = { revoking = null }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun DeviceRow(
    device: DeviceSummary,
    onRename: () -> Unit,
    onRevoke: () -> Unit,
) {
    val aegis = LocalAegisColors.current
    val sessionState = device.session?.state
    AegisCard {
        Column(Modifier.padding(Spacing.lg)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(44.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Rounded.Person,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(22.dp),
                    )
                }
                Spacer(Modifier.size(Spacing.md))
                Column(Modifier.weight(1f)) {
                    Text(device.name, style = MaterialTheme.typography.titleSmall)
                    Text(
                        "${device.platform} · last active ${device.lastActiveAt ?: "never"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                when (sessionState) {
                    null -> StatePill("offline", MaterialTheme.colorScheme.onSurfaceVariant)
                    "connected" -> StatePill("connected", aegis.success)
                    else -> StatePill(sessionState, aegis.warning)
                }
            }
            Spacer(Modifier.height(Spacing.md))
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                // 48dp-labeled text actions.
                TextButton(
                    onClick = onRename,
                    modifier = Modifier.heightIn(min = 44.dp),
                ) {
                    Icon(Icons.Rounded.Edit, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.size(6.dp))
                    Text("Rename")
                }
                TextButton(
                    onClick = onRevoke,
                    modifier = Modifier.heightIn(min = 44.dp),
                ) {
                    Icon(Icons.Rounded.Delete, null, tint = aegis.danger, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.size(6.dp))
                    Text("Revoke", color = aegis.danger)
                }
            }
        }
    }
}
