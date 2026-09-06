package com.aegisvpn.android.ui.screens

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.rounded.List
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import com.aegisvpn.android.ui.theme.AegisCard
import com.aegisvpn.android.ui.theme.DemoBanner
import com.aegisvpn.android.ui.theme.ErrorPanel
import com.aegisvpn.android.ui.theme.LocalAegisColors
import com.aegisvpn.android.ui.theme.MinTouchTarget
import com.aegisvpn.android.ui.theme.SectionLabel
import com.aegisvpn.android.ui.theme.Spacing
import com.aegisvpn.android.vpn.TunnelManager
import kotlinx.coroutines.launch

/**
 * Settings: protection controls, account, app info, logout and account
 * deletion, grouped into scannable sections. Only backend-supported settings
 * are exposed (contract §21). Every row keeps a 48dp+ touch target.
 */
@Composable
fun SettingsScreen(onLoggedOut: () -> Unit, onOpenDevices: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val aegis = LocalAegisColors.current
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
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = Spacing.xl),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        Text(
            "Settings",
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.padding(top = Spacing.md),
        )
        if (DemoMode.enabled) {
            DemoBanner()
        }

        // ---------- Protection ----------
        SectionLabel("Protection")
        AegisCard {
            Column {
                SettingRow(
                    icon = { Icon(Icons.Rounded.Lock, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp)) },
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
                HorizontalDivider()
                SettingRow(
                    icon = { Icon(Icons.Rounded.Settings, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp)) },
                    title = "Auto-connect on launch",
                    subtitle = "Connects to the least-loaded active server when the app starts.",
                    checked = autoConnect,
                ) { checked ->
                    scope.launch {
                        ServiceLocator.tunnelManager.setAutoConnect(checked)
                        autoConnect = checked
                    }
                }
                HorizontalDivider()
                // 48dp+ full-row target into the split tunnel dialog.
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showSplitTunnel = true }
                        .padding(horizontal = Spacing.lg, vertical = Spacing.md)
                        .heightIn(min = MinTouchTarget),
                ) {
                    Icon(
                        Icons.Rounded.List,
                        null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(Modifier.size(Spacing.md))
                    Column(Modifier.weight(1f)) {
                        Text("Split tunneling", style = MaterialTheme.typography.titleSmall)
                        Text(
                            "${excluded.size} apps bypass the VPN",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text(
                        "Edit",
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }
        }

        // ---------- Account ----------
        SectionLabel("Account")
        AegisCard {
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenDevices() }
                        .padding(horizontal = Spacing.lg, vertical = Spacing.md)
                        .heightIn(min = MinTouchTarget),
                ) {
                    Icon(
                        Icons.Rounded.Person,
                        null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(Modifier.size(Spacing.md))
                    Column(Modifier.weight(1f)) {
                        Text("Manage devices", style = MaterialTheme.typography.titleSmall)
                        Text(
                            "Rename or revoke signed-in devices",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text("Open", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
                }
                HorizontalDivider()
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            context.startActivity(
                                Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
                                    .putExtra("app_package", context.packageName),
                            )
                        }
                        .padding(horizontal = Spacing.lg, vertical = Spacing.md)
                        .heightIn(min = MinTouchTarget),
                ) {
                    Icon(
                        Icons.Rounded.Notifications,
                        null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(Modifier.size(Spacing.md))
                    Column(Modifier.weight(1f)) {
                        Text("Notification settings", style = MaterialTheme.typography.titleSmall)
                        Text("System notification channels for this app", style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("Open", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
                }
            }
        }

        // ---------- About ----------
        SectionLabel("About")
        AegisCard {
            Column(Modifier.padding(Spacing.lg), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                InfoRow("Protocol", "WireGuard (wireguard-android GoBackend)")
                InfoRow("API", BuildConfig.API_BASE_URL)
                InfoRow("Version", BuildConfig.VERSION_NAME)
            }
        }

        error?.let {
            ErrorPanel(message = it, suggestion = "Try the action again — nothing was changed.")
        }

        // ---------- Session ----------
        SectionLabel("Session")
        if (DemoMode.enabled) {
            AegisCard {
                Column(Modifier.padding(Spacing.lg)) {
                    Text("Demo session", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "You are browsing with sample data. Exiting returns you to the sign-in screen.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(Spacing.md))
                    Button(
                        onClick = {
                            scope.launch {
                                ServiceLocator.tunnelManager.disconnect()
                                DemoMode.disable(context)
                                ServiceLocator.authRepository.hardLogout()
                                onLoggedOut()
                            }
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp),
                    ) {
                        Text("Exit demo mode")
                    }
                }
            }
        }
        Button(
            onClick = {
                scope.launch {
                    ServiceLocator.tunnelManager.disconnect()
                    ServiceLocator.authRepository.logout()
                    onLoggedOut()
                }
            },
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface,
            ),
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 48.dp),
        ) {
            Text("Log out", color = MaterialTheme.colorScheme.primary)
        }
        TextButton(
            onClick = { showDeleteDialog = true },
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = MinTouchTarget),
        ) {
            Text("Delete account", color = aegis.danger)
        }
        Spacer(Modifier.height(Spacing.xl))

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
                        Spacer(Modifier.height(Spacing.md))
                        packages.forEach { pkg ->
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .heightIn(min = MinTouchTarget),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
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
                        Spacer(Modifier.height(Spacing.md))
                        OutlinedTextField(
                            value = deletePassword,
                            onValueChange = { deletePassword = it },
                            label = { Text("Confirm with your password") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                        )
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
                    ) { Text("Delete permanently", color = aegis.danger) }
                },
                dismissButton = { TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel") } },
            )
        }
    }
}

/** Hairline divider between grouped settings rows. */
@Composable
private fun HorizontalDivider() {
    Box(
        Modifier
            .fillMaxWidth()
            .padding(start = Spacing.lg)
            .height(1.dp)
            .background(LocalAegisColors.current.outline.copy(alpha = 0.5f)),
    )
}

@Composable
private fun SettingRow(
    icon: @Composable () -> Unit,
    title: String,
    subtitle: String,
    checked: Boolean,
    onChange: (Boolean) -> Unit,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.lg, vertical = Spacing.md)
            .heightIn(min = MinTouchTarget),
    ) {
        Box(Modifier.size(24.dp), contentAlignment = Alignment.Center) { icon() }
        Spacer(Modifier.size(Spacing.md))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(
            checked = checked,
            onCheckedChange = onChange,
            colors = SwitchDefaults.colors(checkedTrackColor = MaterialTheme.colorScheme.primary),
        )
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(2.dp))
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}
