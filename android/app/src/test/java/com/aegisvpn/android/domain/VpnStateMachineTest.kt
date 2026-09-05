package com.aegisvpn.android.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pure-JVM tests for the VPN state machine — the component that decides what
 * the UI is allowed to display. The invariant under test: the UI can never
 * render "Connected" unless real tunnel statistics confirmed a handshake.
 */
class VpnStateMachineTest {

    /** Drives a machine through the full happy path to Connected. */
    private fun connectedMachine(): VpnStateMachine =
        VpnStateMachine().apply {
            transition(VpnEvent.ConnectRequested) // Idle -> Preparing
            transition(VpnEvent.PermissionGranted) // Preparing -> Authorizing
            transition(VpnEvent.ConfigReady) // Authorizing -> Configuring
            transition(VpnEvent.ConfigReady) // Configuring -> Connecting
            transition(VpnEvent.TunnelUp) // Connecting -> Handshaking
            transition(VpnEvent.HandshakeConfirmed) // Handshaking -> Connected
        }

    @Test
    fun happyPathReachesConnectedOnlyAfterHandshakeConfirmation() {
        val m = VpnStateMachine()
        assertEquals(VpnState.Idle, m.current)

        m.transition(VpnEvent.ConnectRequested)
        assertEquals(VpnState.Preparing, m.current)
        m.transition(VpnEvent.PermissionGranted)
        assertEquals(VpnState.Authorizing, m.current)
        m.transition(VpnEvent.ConfigReady)
        assertEquals(VpnState.Configuring, m.current)
        m.transition(VpnEvent.ConfigReady)
        assertEquals(VpnState.Connecting, m.current)

        // Tunnel interface comes up BEFORE any traffic flows: still not Connected.
        m.transition(VpnEvent.TunnelUp)
        assertEquals(VpnState.Handshaking, m.current)
        assertFalse(VpnStateMachine.isRestingFailure(m.current))

        // Only real statistics (rx/tx observed) confirm the handshake.
        m.transition(VpnEvent.HandshakeConfirmed)
        assertEquals(VpnState.Connected, m.current)
        assertTrue(VpnStateMachine.isTunnelUp(m.current))
        assertFalse(VpnStateMachine.isBusy(m.current))
    }

    @Test
    fun tunnelDropWhileConnectedIsARestingErrorWithTunnelDownCode() {
        val m = connectedMachine()
        m.transition(VpnEvent.TunnelDown)
        val s = m.current
        assertTrue("expected Error but was $s", s is VpnState.Error)
        assertEquals(VpnStateMachine.CODE_TUNNEL_DOWN, (s as VpnState.Error).code)
        assertTrue(VpnStateMachine.isRestingFailure(s))
    }

    @Test
    fun networkLossReconnectsAndHandshakeConfirmationRestoresConnected() {
        val m = connectedMachine()
        m.transition(VpnEvent.NetworkLost)
        assertEquals(VpnState.Reconnecting, m.current)
        assertTrue(VpnStateMachine.isBusy(m.current))
        m.transition(VpnEvent.HandshakeConfirmed)
        assertEquals(VpnState.Connected, m.current)
    }

    @Test
    fun unauthorizedApiFailureParksInAuthRequired() {
        val m = VpnStateMachine()
        m.transition(VpnEvent.ConnectRequested)
        m.transition(VpnEvent.PermissionGranted)
        m.transition(
            VpnEvent.ApiFailed(
                VpnStateMachine.CODE_UNAUTHORIZED,
                "refresh token revoked",
            ),
        )
        assertEquals(VpnState.AuthRequired, m.current)
        assertTrue(VpnStateMachine.isRestingFailure(m.current))
    }

    @Test
    fun serverUnavailableFromAuthorizingIsARestingState() {
        val m = VpnStateMachine()
        m.transition(VpnEvent.ConnectRequested)
        m.transition(VpnEvent.PermissionGranted)
        m.transition(VpnEvent.ApiFailed(VpnStateMachine.CODE_SERVER_UNAVAILABLE, "drained"))
        assertEquals(VpnState.ServerUnavailable, m.current)
        assertTrue(VpnStateMachine.isRestingFailure(m.current))
    }

    @Test
    fun illegalTransitionsNeverThrowAndAreRecorded() {
        val m = VpnStateMachine()
        val result = m.transition(VpnEvent.TunnelUp) // nothing is running
        assertTrue(result is TransitionResult.Rejected)
        assertEquals(VpnState.Idle, result.state)
        assertEquals(VpnState.Idle to VpnEvent.TunnelUp as VpnEvent, m.lastRejected)
        assertEquals(VpnState.Idle, m.current)

        m.clearLastRejected()
        assertNull(m.lastRejected)
    }

    @Test
    fun acceptedResultCarriesTheNewState() {
        val m = VpnStateMachine()
        val result = m.transition(VpnEvent.ConnectRequested)
        assertTrue(result is TransitionResult.Accepted)
        assertEquals(VpnState.Preparing, (result as TransitionResult.Accepted).state)
        assertEquals(VpnState.Preparing, result.state)
    }

    @Test
    fun teardownPathLandsInDisconnectedAndCanRestart() {
        val m = connectedMachine()
        m.transition(VpnEvent.DisconnectRequested)
        assertEquals(VpnState.Disconnecting, m.current)
        m.transition(VpnEvent.TunnelDown)
        assertEquals(VpnState.Disconnected, m.current)
        assertFalse(VpnStateMachine.isTunnelUp(m.current))

        // A restart from the rest state re-enters the connect sequence.
        m.transition(VpnEvent.ConnectRequested)
        assertEquals(VpnState.Preparing, m.current)
    }

    @Test
    fun offlineRestoresToIdleWhenTheNetworkReturns() {
        val m = VpnStateMachine()
        m.transition(VpnEvent.AppWentOffline)
        assertEquals(VpnState.Offline, m.current)
        m.transition(VpnEvent.NetworkRestored)
        assertEquals(VpnState.Idle, m.current)
    }

    @Test
    fun vpnPermissionDeniedIsRecordedAsRestingState() {
        val m = VpnStateMachine()
        m.transition(VpnEvent.ConnectRequested)
        m.transition(VpnEvent.PermissionDenied)
        assertEquals(VpnState.VpnPermissionRequired, m.current)
        assertTrue(VpnStateMachine.isRestingFailure(m.current))

        // Granting later resumes straight into authorizing.
        m.transition(VpnEvent.PermissionGranted)
        assertEquals(VpnState.Authorizing, m.current)
    }

    @Test
    fun statusCodesMatchTheContractLabels() {
        assertEquals("CONNECTED", VpnStateMachine.statusCode(VpnState.Connected))
        assertEquals("RECONNECTING", VpnStateMachine.statusCode(VpnState.Reconnecting))
        assertEquals("AUTH_REQUIRED", VpnStateMachine.statusCode(VpnState.AuthRequired))
        assertEquals("VPN_PERMISSION_REQUIRED", VpnStateMachine.statusCode(VpnState.VpnPermissionRequired))
        assertEquals("ERROR", VpnStateMachine.statusCode(VpnState.Error("X", null)))
    }

    @Test
    fun resetForcesTheMachineIntoTheGivenState() {
        val m = connectedMachine()
        m.reset(VpnState.VpnPermissionRequired)
        assertEquals(VpnState.VpnPermissionRequired, m.current)
    }
}
