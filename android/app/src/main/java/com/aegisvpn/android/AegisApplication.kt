package com.aegisvpn.android

import android.app.Application
import android.util.Log
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.vpn.AegisVpnService
import com.wireguard.android.backend.GoBackend
import kotlinx.coroutines.launch

/**
 * Application entrypoint: initializes manual DI and the GoBackend.
 *
 * GoBackend integration follows the current wireguard-android README
 * ("GoBackend integration"): the library owns its own VpnService component
 * (declared in the manifest as GoBackend$VpnService) and starts it itself
 * when the tunnel goes UP. [GoBackend.setAlwaysOnCallback] is the hook for
 * the system "Always-on VPN" feature, which starts that service without the
 * app being involved. This file is the single place where the library glue
 * lives.
 */
class AegisApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        ServiceLocator.init(this)

        try {
            GoBackend.setAlwaysOnCallback {
                // The system started GoBackend$VpnService directly; mirror the
                // system-managed tunnel in the app's state machine + notif.
                try {
                    ServiceLocator.tunnelManager.onAlwaysOnStarted()
                } catch (t: Throwable) {
                    Log.w("AegisApplication", "always-on state sync failed", t)
                }
            }
        } catch (e: NoSuchMethodError) {
            // Tunnel library without the always-on hook: purely a state-sync
            // optimization, the tunnel itself does not depend on it.
            Log.w("AegisApplication", "GoBackend.setAlwaysOnCallback unavailable", e)
        }

        // Keep the SSE control stream alive while the process is alive.
        ServiceLocator.appScope.launch {
            ServiceLocator.eventStream.run()
        }
    }
}
