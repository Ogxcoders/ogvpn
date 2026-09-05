package com.aegisvpn.android.vpn

import android.content.Context
import android.content.Intent
import android.net.VpnService

/** Thin helper so the rest of the code does not touch VpnService directly. */
object VpnServiceCompat {
    /** Null when VPN permission is already granted; the consent Intent otherwise. */
    fun prepareCompat(context: Context): Intent? = VpnService.prepare(context)
}
