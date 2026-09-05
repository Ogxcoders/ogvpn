package com.aegisvpn.android.notifications

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.aegisvpn.android.R
import com.aegisvpn.android.ui.MainActivity

/**
 * Notification infrastructure: persistent VPN service notification plus
 * state-change alerts. Handles the POST_NOTIFICATIONS runtime permission
 * (API 33+) and user-disabled channels without crashing.
 */
class Notifier(private val context: Context) {

    init {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_VPN,
                "VPN status",
                NotificationManager.IMPORTANCE_LOW,
            ).apply { description = "Persistent notification while the VPN service runs" },
        )
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ALERTS,
                "VPN alerts",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply { description = "Connection changes and errors" },
        )
    }

    private fun canNotify(): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    fun contentIntent(): PendingIntent = PendingIntent.getActivity(
        context,
        0,
        Intent(context, MainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    /** Pushes the latest state into the persistent service notification. */
    fun updateServiceNotification(stateLabel: String, serverLabel: String?) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        try {
            manager.notify(Notifier.SERVICE_NOTIFICATION_ID, serviceNotification(stateLabel, serverLabel))
        } catch (e: SecurityException) {
            // ignore: notifications disabled
        }
    }

    /** The persistent foreground-service notification (state + server). */
    fun serviceNotification(stateLabel: String, serverLabel: String?): Notification =
        NotificationCompat.Builder(context, CHANNEL_VPN)
            .setSmallIcon(android.R.drawable.stat_notify_sync_noanim)
            .setContentTitle("AegisVPN — $stateLabel")
            .setContentText(serverLabel ?: "Not connected")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(contentIntent())
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()

    fun alert(title: String, body: String) {
        if (!canNotify()) return
        val notification = NotificationCompat.Builder(context, CHANNEL_ALERTS)
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(contentIntent())
            .build()
        try {
            NotificationManagerCompat.from(context).notify(ALERT_ID, notification)
        } catch (e: SecurityException) {
            // Permission revoked between check and notify — ignore.
        }
    }

    companion object {
        const val CHANNEL_VPN = "vpn"
        const val CHANNEL_ALERTS = "alerts"
        const val SERVICE_NOTIFICATION_ID = 1
        const val ALERT_ID = 2
    }
}
