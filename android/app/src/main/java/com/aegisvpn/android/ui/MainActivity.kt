package com.aegisvpn.android.ui

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.app.ActivityCompat
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.AuthEvent
import com.aegisvpn.android.ui.screens.DevicesScreen
import com.aegisvpn.android.ui.screens.HomeScreen
import com.aegisvpn.android.ui.screens.LoginScreen
import com.aegisvpn.android.ui.screens.ServersScreen
import com.aegisvpn.android.ui.screens.SettingsScreen
import com.aegisvpn.android.ui.screens.VpnConsentBridge
import com.aegisvpn.android.ui.theme.AegisTheme
import com.aegisvpn.android.vpn.TunnelManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import android.Manifest
import android.content.pm.PackageManager
import androidx.compose.runtime.snapshotFlow
import androidx.core.content.ContextCompat

/**
 * Single-activity Compose host. Owns the VPN permission flow:
 * TunnelManager.connect() may return the system consent Intent; the result
 * lands here via [vpnPermissionLauncher] and is forwarded back to the
 * manager (granted / denied), which resumes the connect sequence.
 */
class MainActivity : ComponentActivity() {

    private val auth = ServiceLocator.authRepository
    private val tunnelManager: TunnelManager by lazy { ServiceLocator.tunnelManager }

    private val loggedIn = MutableStateFlow<Boolean?>(null)

    private lateinit var vpnPermissionLauncher: ActivityResultLauncher<Intent>
    private var pendingPermissionServerId: String? = null

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestNotificationPermissionIfNeeded()

        vpnPermissionLauncher =
            registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
                val serverId = pendingPermissionServerId
                pendingPermissionServerId = null
                if (result.resultCode == RESULT_OK && serverId != null) {
                    tunnelManager.onPermissionGranted(serverId)
                } else {
                    tunnelManager.onPermissionDenied(serverId)
                }
            }

        lifecycleScope.launch {
            loggedIn.value = if (auth.hasSession) {
                try {
                    auth.me() != null
                } catch (e: Exception) {
                    // 401 → refresh happened in interceptor; treat failure as logged out.
                    false
                }
            } else {
                false
            }
        }

        lifecycleScope.launch {
            auth.events.collect { event ->
                when (event) {
                    is AuthEvent.Authenticated, is AuthEvent.LoggedOut -> {
                        loggedIn.value = event is AuthEvent.Authenticated
                    }
                    is AuthEvent.SessionExpired -> loggedIn.value = false
                }
            }
        }

        // VPN consent bridge: HomeScreen surfaces the system consent Intent.
        lifecycleScope.launch {
            snapshotFlow { VpnConsentBridge.pending.value }.collect { pending ->
                if (pending != null) {
                    VpnConsentBridge.pending.value = null
                    startVpnPermissionFlow(pending.second, pending.first)
                }
            }
        }

        setContent {
            AegisTheme {
                val loggedInState by loggedIn.collectAsState()
                when (loggedInState) {
                    null -> Unit // splash: resolving session
                    else -> {
                        val nav = rememberNavController()
                        NavHost(nav, startDestination = if (loggedInState == true) "home" else "login") {
                            composable("login") {
                                LoginScreen(onAuthenticated = { loggedIn.value = true })
                            }
                            composable("home") {
                                HomeScreen(
                                    onOpenServers = { nav.navigate("servers") },
                                    onOpenSettings = { nav.navigate("settings") },
                                )
                            }
                            composable("servers") {
                                ServersScreen(onClose = { nav.popBackStack() })
                            }
                            composable("devices") {
                                DevicesScreen(onClose = { nav.popBackStack() })
                            }
                            composable("settings") {
                                SettingsScreen(
                                    onLoggedOut = { loggedIn.value = false },
                                    onOpenDevices = { nav.navigate("devices") },
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    fun startVpnPermissionFlow(serverId: String, consentIntent: Intent) {
        pendingPermissionServerId = serverId
        vpnPermissionLauncher.launch(consentIntent)
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS,
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    1001,
                )
            }
        }
    }
}
