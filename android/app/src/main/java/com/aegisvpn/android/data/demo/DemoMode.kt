package com.aegisvpn.android.data.demo

import android.content.Context

/**
 * Global switch for offline DEMO MODE.
 *
 * Demo mode short-circuits every control-plane request in [DemoInterceptor]
 * and simulates the VPN connect sequence in [com.aegisvpn.android.vpn.TunnelManager],
 * so the full UI (login, servers, devices, connect/disconnect, subscription,
 * settings) can be explored with realistic sample data — no backend required.
 *
 * Honest labeling (this project does not fake success silently):
 *  - the UI runs for real, but NO WireGuard tunnel is established and NO
 *    traffic is protected in demo mode;
 *  - Settings shows a permanent "DEMO" badge while the mode is on;
 *  - the flag is persisted, so the app re-enters demo mode after restart
 *    until the user explicitly exits from Settings.
 */
object DemoMode {

    private const val PREFS = "aegis_demo_mode"
    private const val KEY_ENABLED = "enabled"

    @Volatile
    var enabled: Boolean = false
        private set

    /** Called once from ServiceLocator.init before any network can happen. */
    fun load(context: Context) {
        enabled = context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_ENABLED, false)
    }

    fun enable(context: Context) {
        enabled = true
        persist(context, true)
    }

    fun disable(context: Context) {
        enabled = false
        persist(context, false)
    }

    private fun persist(context: Context, value: Boolean) {
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ENABLED, value)
            .apply()
    }
}
