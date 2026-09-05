package com.aegisvpn.android.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
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
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.DeviceSummary
import kotlinx.coroutines.launch

/** Device management: list, rename, revoke (mirrors web control plane state). */
@Composable
fun DevicesScreen(onClose: () -> Unit) {
    val scope = rememberCoroutineScope()
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

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Your devices", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(10.dp))

        when {
            error != null -> {
                Text(error!!, color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(8.dp))
                Button(onClick = { error = null; load() }) { Text("Retry") }
            }
            devices == null -> CircularProgressIndicator()
            devices!!.isEmpty() -> Text("No devices registered yet.")
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(devices!!, key = { it.id }) { device ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(device.name, style = MaterialTheme.typography.titleSmall)
                                    Text(
                                        "${device.platform} · last active ${device.lastActiveAt ?: "never"}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                val sessionState = device.session?.state
                                if (sessionState != null) {
                                    Text(
                                        sessionState,
                                        color = if (sessionState == "connected") {
                                            MaterialTheme.colorScheme.tertiary
                                        } else {
                                            MaterialTheme.colorScheme.secondary
                                        },
                                        style = MaterialTheme.typography.labelMedium,
                                    )
                                } else {
                                    Text(
                                        "offline",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                TextButton(onClick = { renaming = device; renameValue = device.name }) {
                                    Text("Rename")
                                }
                                TextButton(onClick = { revoking = device }) {
                                    Text("Revoke", color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        TextButton(onClick = onClose, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text("Done")
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
                ) { Text("Revoke device", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { revoking = null }) { Text("Cancel") } },
        )
    }
}
