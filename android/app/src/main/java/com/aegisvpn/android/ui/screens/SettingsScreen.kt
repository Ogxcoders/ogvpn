package com.aegisvpn.android.ui.screens

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.aegisvpn.android.BuildConfig
import com.aegisvpn.android.data.demo.DemoMode
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.vpn.TunnelManager
import kotlinx.coroutines.launch

/**
 * Settings: kill switch, auto-connect, split tunneling (per-app), protocol
 * info, about, logout and account deletion. Only backend-supported settings
 * are exposed (contract §21).
 */
@Composable
fun SettingsScreen(onLoggedOut: () -> Unit, onOpenDevices: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var killSwitch by remember { mutableStateOf(true) }
    var autoConnect by remember { mutableStateOf(false) }
    var excluded by remember { mutableStateOf(emptySet<String>()) }
    var showSplitTunnel by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var deletePassword by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        killSwitch = ServiceLocator.tunnelManager.killSwitchEnabled()
        autoConnect = ServiceLocator.tunnelManager.autoConnect()
        excluded = ServiceLocator.tunnelManager.excludedPackages()
    }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Settings", style = MaterialTheme.typography.titleLarge)
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        SettingRow(
            title = "Kill switch",
            subtitle = "On tunnel loss the app keeps retrying and clearly labels traffic as unprotected. " +
                "For OS-level enforcement use Android Settings → VPN → Always-on.",
            checked = killSwitch,
        ) { checked ->
            scope.launch {
                ServiceLocator.tunnelManager.setKillSwitch(checked)
                killSwitch = checked
            }
        }

        SettingRow(
            title = "Auto-connect on launch",
            subtitle = "Connects to the least-loaded active server when the app starts.",
            checked = autoConnect,
        ) { checked ->
            scope.launch {
                ServiceLocator.tunnelManager.setAutoConnect(checked)
                autoConnect = checked
            }
        }

        Button(onClick = { showSplitTunnel = true }, modifier = Modifier.fillMaxWidth()) {
            Text("Split tunneling (excluded apps: ${excluded.size})")
        }

        Button(onClick = onOpenDevices, modifier = Modifier.fillMaxWidth()) {
            Text("Manage devices")
        }

        Button(
            onClick = { context.startActivity(Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).putExtra("app_package", context.packageName)) },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Notification settings") }

        Column {
            Text("Protocol", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("WireGuard (wireguard-android GoBackend)", style = MaterialTheme.typography.bodyMedium)
        }
        if (DemoMode.enabled) {
            Column {
                Text("Mode", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    "DEMO — offline sample data. The VPN tunnel is simulated; no traffic is routed or protected.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.tertiary,
                )
            }
        }
        Column {
            Text("API", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(BuildConfig.API_BASE_URL, style = MaterialTheme.typography.bodySmall)
        }
        Column {
            Text("Version", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(BuildConfig.VERSION_NAME, style = MaterialTheme.typography.bodyMedium)
        }

        if (DemoMode.enabled) {
            TextButton(onClick = {
                scope.launch {
                    ServiceLocator.tunnelManager.disconnect()
                    DemoMode.disable(context)
                    ServiceLocator.authRepository.hardLogout()
                    onLoggedOut()
                }
            }, modifier = Modifier.fillMaxWidth()) {
                Text("Exit demo mode")
            }
        }
        Spacer(Modifier.height(6.dp))
        Button(onClick = {
            scope.launch {
                ServiceLocator.tunnelManager.disconnect()
                ServiceLocator.authRepository.logout()
                onLoggedOut()
            }
        }, modifier = Modifier.fillMaxWidth()) {
            Text("Log out")
        }
        TextButton(onClick = { showDeleteDialog = true }, modifier = Modifier.fillMaxWidth()) {
            Text("Delete account", color = MaterialTheme.colorScheme.error)
        }
    }

    if (showSplitTunnel) {
        val pm = context.packageManager
        val launchables = pm.queryIntentActivities(
            Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0,
        )
        val packages = launchables.mapNotNull { it.activityInfo?.applicationInfo?.packageName }.distinct().sorted()
        AlertDialog(
            onDismissRequest = { showSplitTunnel = false },
            title = { Text("Excluded apps") },
            text = {
                Column(Modifier.verticalScroll(rememberScrollState())) {
                    Text(
                        "Excluded apps use the normal network and do not go through the VPN.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(Modifier.height(8.dp))
                    packages.forEach { pkg ->
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            Text(pkg, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                            Switch(
                                checked = pkg in excluded,
                                onCheckedChange = { on ->
                                    scope.launch {
                                        val next = if (on) excluded + pkg else excluded - pkg
                                        ServiceLocator.tunnelManager.setExcludedPackages(next)
                                        excluded = next
                                    }
                                },
                            )
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { showSplitTunnel = false }) { Text("Done") } },
        )
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete account?") },
            text = {
                Column {
                    Text("This permanently deletes your account, devices and tunnels.")
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = deletePassword,
                        onValueChange = { deletePassword = it },
                        label = { Text("Confirm with your password") },
                        singleLine = true,
                    )
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                }
            },
            confirmButton = {
                TextButton(
                    enabled = deletePassword.isNotBlank(),
                    onClick = {
                        scope.launch {
                            try {
                                ServiceLocator.tunnelManager.disconnect()
                                ServiceLocator.authRepository.deleteAccount(deletePassword)
                                onLoggedOut()
                            } catch (e: RepoError) {
                                error = e.message
                            }
                        }
                    },
                ) { Text("Delete permanently", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun SettingRow(title: String, subtitle: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(checked = checked, onCheckedChange = onChange)
    }
}
