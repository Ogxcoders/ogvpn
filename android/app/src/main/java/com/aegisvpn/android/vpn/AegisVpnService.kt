package com.aegisvpn.android.vpn

import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.ServiceCompat
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.notifications.Notifier

/**
 * The VpnService. Responsibilities:
 *  - run as a foreground service with the persistent status notification,
 *  - hand the GoBackend the running service instance (its creator callback
 *    resolves through this class),
 *  - forward system callbacks (onRevoke) to the TunnelManager.
 *
 * Packet handling itself lives in the wireguard-android GoBackend — this
 * service never fabricates tunnel state.
 */
class AegisVpnService : android.net.VpnService() {

    private lateinit var tunnelManager: TunnelManager
    private lateinit var notifier: Notifier

    override fun onCreate() {
        super.onCreate()
        tunnelManager = ServiceLocator.tunnelManager
        notifier = ServiceLocator.notifier
        promoteToForeground()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        promoteToForeground()
        when (intent?.action) {
            ACTION_DISCONNECT -> {
                tunnelManager.disconnect()
                stopSelf()
            }
            else -> {
                // ACTION_CONNECT (default): bring the tunnel up via GoBackend.
                tunnelManager.onServiceStarted(this)
            }
        }
        return START_NOT_STICKY
    }

    private fun promoteToForeground() {
        val notification = notifier.serviceNotification(
            "Connecting…",
            tunnelManager.sessionInfo.value?.serverLabel,
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceCompat.startForeground(
                this,
                Notifier.SERVICE_NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
            )
        } else {
            startForeground(Notifier.SERVICE_NOTIFICATION_ID, notification)
        }
    }

    /** Another VPN replaced us, or the user revoked consent in system settings. */
    override fun onRevoke() {
        tunnelManager.onVpnRevoked()
        stopSelf()
        super.onRevoke()
    }

    override fun onDestroy() {
        tunnelManager.serviceDisconnected()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = super.onBind(intent)

    companion object {
        private const val TAG = "AegisVpnService"
        const val ACTION_CONNECT = "com.aegisvpn.android.CONNECT"
        const val ACTION_DISCONNECT = "com.aegisvpn.android.DISCONNECT"
    }
}
