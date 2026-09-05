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
 * GoBackend integration follows the wireguard-android README ("GoBackend
 * integration"): the library needs a live VpnService instance when the tunnel
 * goes UP, and [GoBackend.setVpnServiceCreator] lets it start
 * [AegisVpnService] through this Application. If you bump the tunnel library
 * and this creator API has moved, consult that README section — this file is
 * the single place where the library glue lives.
 */
class AegisApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        ServiceLocator.init(this)

        try {
            GoBackend.setVpnServiceCreator { intent ->
                val service = startService(intent)
                service as? AegisVpnService
            }
        } catch (e: NoSuchMethodError) {
            // Older/newer tunnel library without the static creator: GoBackend
            // will fall back to Context.startService internally.
            Log.w("AegisApplication", "GoBackend.setVpnServiceCreator unavailable", e)
        }

        // Keep the SSE control stream alive while the process is alive.
        ServiceLocator.appScope.launch {
            ServiceLocator.eventStream.run()
        }
    }
}
