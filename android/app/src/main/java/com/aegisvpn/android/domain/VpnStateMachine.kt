package com.aegisvpn.android.domain

/**
 * The VPN connection state machine.
 *
 * This file is PURE Kotlin: it must not import anything from Android so that
 * it runs (and is unit tested) on the plain JVM. Android-side orchestrators
 * ([com.aegisvpn.android.vpn.TunnelManager]) translate platform signals into
 * [VpnEvent]s and consume the resulting [VpnState].
 */

/** Every possible state of the VPN subsystem. */
sealed interface VpnState {
    data object Idle : VpnState
    data object Preparing : VpnState
    data object Authorizing : VpnState
    data object Configuring : VpnState
    data object Connecting : VpnState
    data object Handshaking : VpnState
    data object Connected : VpnState
    data object Reconnecting : VpnState
    data object Disconnecting : VpnState
    data object Disconnected : VpnState
    data object Offline : VpnState
    data object AuthRequired : VpnState
    data object VpnPermissionRequired : VpnState
    data object ServerUnavailable : VpnState
    data object ConfigurationError : VpnState
    data class Error(val code: String?, val message: String?) : VpnState
}

/** Events accepted by [VpnStateMachine.transition]. */
sealed interface VpnEvent {
    data object ConnectRequested : VpnEvent
    data object PermissionGranted : VpnEvent
    data object PermissionDenied : VpnEvent
    data object PermissionRevoked : VpnEvent
    data object ConfigReady : VpnEvent
    data object TunnelUp : VpnEvent
    data object HandshakeConfirmed : VpnEvent
    data object HandshakeStale : VpnEvent
    data object TunnelDown : VpnEvent
    data object NetworkLost : VpnEvent
    data object NetworkRestored : VpnEvent
    data object DisconnectRequested : VpnEvent
    data class ApiFailed(val code: String, val message: String?) : VpnEvent
    data object ServerUnavailable : VpnEvent
    data object ConfigInvalid : VpnEvent
    data object AppWentOffline : VpnEvent
    data object AppCameOnline : VpnEvent
}

/** Result of a single transition attempt. */
sealed interface TransitionResult {
    /** The event was legal; [state] is the (possibly unchanged) new state. */
    data class Accepted(override val state: VpnState) : TransitionResult

    /** The event was illegal for [from]; the state machine did not change. */
    data class Rejected(val from: VpnState, val event: VpnEvent) : TransitionResult

    /** The resulting state (rejected attempts return [from] unchanged). */
    val state: VpnState
        get() = when (this) {
            is Accepted -> state
            is Rejected -> from
        }
}

/**
 * Deterministic, thread-safe VPN state machine.
 *
 * Illegal transitions never throw in production paths: they are recorded in
 * [lastRejected] and rejected via [TransitionResult.Rejected], so a stray
 * callback cannot crash the app. Tests assert on [lastRejected].
 */
class VpnStateMachine(initial: VpnState = VpnState.Idle) {

    @Volatile
    private var internalState: VpnState = initial

    /** Current state. */
    val current: VpnState
        get() = internalState

    @Volatile
    private var internalLastRejected: Pair<VpnState, VpnEvent>? = null

    /** Last rejected (state, event) pair, or null. Cleared on [clearLastRejected]. */
    val lastRejected: Pair<VpnState, VpnEvent>?
        get() = internalLastRejected

    /**
     * Attempt to process [event] in the current state.
     * Returns [TransitionResult.Accepted] with the new state (which may equal
     * the old one for self-loops) or [TransitionResult.Rejected].
     */
    @Synchronized
    fun transition(event: VpnEvent): TransitionResult {
        val from = internalState
        val to = next(from, event)
        return if (to == null) {
            internalLastRejected = from to event
            TransitionResult.Rejected(from, event)
        } else {
            internalState = to
            TransitionResult.Accepted(to)
        }
    }

    /** Force-reset the machine (used after the Disconnected rest period). */
    @Synchronized
    fun reset(to: VpnState = VpnState.Idle) {
        internalState = to
    }

    /** Forget the last rejection (used by tests between scenarios). */
    @Synchronized
    fun clearLastRejected() {
        internalLastRejected = null
    }

    private fun next(from: VpnState, event: VpnEvent): VpnState? = when (from) {
        VpnState.Idle -> when (event) {
            VpnEvent.ConnectRequested -> VpnState.Preparing
            VpnEvent.AppWentOffline -> VpnState.Offline
            else -> null
        }

        VpnState.Preparing -> when (event) {
            VpnEvent.PermissionGranted -> VpnState.Authorizing
            VpnEvent.PermissionDenied -> VpnState.VpnPermissionRequired
            is VpnEvent.ApiFailed -> VpnState.Error(event.code, event.message)
            VpnEvent.AppWentOffline -> VpnState.Offline
            VpnEvent.DisconnectRequested -> VpnState.Disconnected
            else -> null
        }

        VpnState.Authorizing -> when (event) {
            VpnEvent.ConfigReady -> VpnState.Configuring
            is VpnEvent.ApiFailed -> when (event.code) {
                CODE_UNAUTHORIZED -> VpnState.AuthRequired
                CODE_SERVER_UNAVAILABLE -> VpnState.ServerUnavailable
                else -> VpnState.Error(event.code, event.message)
            }
            VpnEvent.ServerUnavailable -> VpnState.ServerUnavailable
            VpnEvent.AppWentOffline -> VpnState.Offline
            VpnEvent.DisconnectRequested -> VpnState.Disconnected
            else -> null
        }

        VpnState.Configuring -> when (event) {
            VpnEvent.ConfigReady -> VpnState.Connecting
            VpnEvent.ConfigInvalid -> VpnState.ConfigurationError
            is VpnEvent.ApiFailed -> when (event.code) {
                CODE_UNAUTHORIZED -> VpnState.AuthRequired
                CODE_SERVER_UNAVAILABLE -> VpnState.ServerUnavailable
                else -> VpnState.Error(event.code, event.message)
            }
            VpnEvent.ServerUnavailable -> VpnState.ServerUnavailable
            VpnEvent.AppWentOffline -> VpnState.Offline
            VpnEvent.DisconnectRequested -> VpnState.Disconnected
            else -> null
        }

        VpnState.Connecting -> when (event) {
            VpnEvent.TunnelUp -> VpnState.Handshaking
            VpnEvent.HandshakeConfirmed -> VpnState.Connected
            VpnEvent.PermissionDenied -> VpnState.VpnPermissionRequired
            is VpnEvent.ApiFailed -> VpnState.Error(event.code, event.message)
            VpnEvent.ServerUnavailable -> VpnState.ServerUnavailable
            VpnEvent.NetworkLost -> VpnState.Reconnecting
            VpnEvent.AppWentOffline -> VpnState.Offline
            VpnEvent.DisconnectRequested -> VpnState.Disconnecting
            else -> null
        }

        VpnState.Handshaking -> when (event) {
            VpnEvent.HandshakeConfirmed -> VpnState.Connected
            VpnEvent.HandshakeStale -> VpnState.Reconnecting
            is VpnEvent.ApiFailed -> VpnState.Error(event.code, event.message)
            VpnEvent.NetworkLost -> VpnState.Reconnecting
            VpnEvent.AppWentOffline -> VpnState.Offline
            VpnEvent.DisconnectRequested -> VpnState.Disconnecting
            else -> null
        }

        VpnState.Connected -> when (event) {
            VpnEvent.HandshakeStale -> VpnState.Reconnecting
            VpnEvent.NetworkLost -> VpnState.Reconnecting
            VpnEvent.AppWentOffline -> VpnState.Reconnecting
            VpnEvent.DisconnectRequested -> VpnState.Disconnecting
            VpnEvent.PermissionRevoked -> VpnState.Disconnecting
            VpnEvent.TunnelDown -> VpnState.Error(CODE_TUNNEL_DOWN, null)
            else -> null
        }

        VpnState.Reconnecting -> when (event) {
            VpnEvent.NetworkRestored -> VpnState.Connecting
            VpnEvent.TunnelUp -> VpnState.Handshaking
            VpnEvent.HandshakeConfirmed -> VpnState.Connected
            VpnEvent.AppWentOffline -> VpnState.Reconnecting
            VpnEvent.DisconnectRequested -> VpnState.Disconnecting
            VpnEvent.PermissionRevoked -> VpnState.Disconnecting
            VpnEvent.TunnelDown -> VpnState.Error(CODE_TUNNEL_DOWN, null)
            else -> null
        }

        VpnState.Disconnecting -> when (event) {
            VpnEvent.TunnelDown -> VpnState.Disconnected
            VpnEvent.NetworkLost -> VpnState.Disconnected
            VpnEvent.HandshakeStale -> VpnState.Disconnected
            VpnEvent.PermissionRevoked -> VpnState.Disconnected
            else -> null
        }

        VpnState.Disconnected -> when (event) {
            VpnEvent.ConnectRequested -> VpnState.Preparing
            VpnEvent.AppCameOnline -> VpnState.Idle
            else -> null
        }

        VpnState.Offline -> when (event) {
            VpnEvent.NetworkRestored -> VpnState.Idle
            VpnEvent.AppCameOnline -> VpnState.Idle
            VpnEvent.AppWentOffline -> VpnState.Offline
            else -> null
        }

        VpnState.AuthRequired -> when (event) {
            VpnEvent.ConnectRequested -> VpnState.Preparing
            VpnEvent.AppCameOnline -> VpnState.Idle
            else -> null
        }

        VpnState.VpnPermissionRequired -> when (event) {
            VpnEvent.ConnectRequested -> VpnState.Preparing
            VpnEvent.PermissionGranted -> VpnState.Authorizing
            else -> null
        }

        VpnState.ServerUnavailable -> when (event) {
            VpnEvent.ConnectRequested -> VpnState.Preparing
            else -> null
        }

        VpnState.ConfigurationError -> when (event) {
            VpnEvent.ConnectRequested -> VpnState.Preparing
            else -> null
        }

        is VpnState.Error -> when (event) {
            VpnEvent.ConnectRequested -> VpnState.Preparing
            VpnEvent.AppWentOffline -> VpnState.Offline
            else -> null
        }
    }

    companion object {
        const val CODE_UNAUTHORIZED = "UNAUTHORIZED"
        const val CODE_SERVER_UNAVAILABLE = "SERVER_UNAVAILABLE"
        const val CODE_TUNNEL_DOWN = "TUNNEL_DOWN"

        /** Canonical status code for UI display, exactly matching the state constants. */
        fun statusCode(state: VpnState): String = when (state) {
            VpnState.Idle -> "IDLE"
            VpnState.Preparing -> "PREPARING"
            VpnState.Authorizing -> "AUTHORIZING"
            VpnState.Configuring -> "CONFIGURING"
            VpnState.Connecting -> "CONNECTING"
            VpnState.Handshaking -> "HANDSHAKING"
            VpnState.Connected -> "CONNECTED"
            VpnState.Reconnecting -> "RECONNECTING"
            VpnState.Disconnecting -> "DISCONNECTING"
            VpnState.Disconnected -> "DISCONNECTED"
            VpnState.Offline -> "OFFLINE"
            VpnState.AuthRequired -> "AUTH_REQUIRED"
            VpnState.VpnPermissionRequired -> "VPN_PERMISSION_REQUIRED"
            VpnState.ServerUnavailable -> "SERVER_UNAVAILABLE"
            VpnState.ConfigurationError -> "CONFIGURATION_ERROR"
            is VpnState.Error -> "ERROR"
        }

        /** True while a connect, re-establish or teardown sequence is in flight. */
        fun isBusy(state: VpnState): Boolean = when (state) {
            VpnState.Preparing,
            VpnState.Authorizing,
            VpnState.Configuring,
            VpnState.Connecting,
            VpnState.Handshaking,
            VpnState.Reconnecting,
            VpnState.Disconnecting,
            -> true

            else -> false
        }

        /** True when the WireGuard tunnel itself should be up. */
        fun isTunnelUp(state: VpnState): Boolean = when (state) {
            VpnState.Handshaking,
            VpnState.Connected,
            VpnState.Reconnecting,
            -> true

            else -> false
        }

        /** True for resting failure states that require user action to leave. */
        fun isRestingFailure(state: VpnState): Boolean = when (state) {
            is VpnState.Error,
            VpnState.AuthRequired,
            VpnState.VpnPermissionRequired,
            VpnState.ServerUnavailable,
            VpnState.ConfigurationError,
            VpnState.Offline,
            -> true

            else -> false
        }
    }
}
