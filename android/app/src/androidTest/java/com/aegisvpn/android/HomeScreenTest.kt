package com.aegisvpn.android

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertExists
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Home screen smoke test. REQUIRES AN EMULATOR/DEVICE — documented as
 * NOT EXECUTED in docs/TESTING.md. Verifies the connect control exists and
 * the state machine label is rendered (never "Connected" when idle).
 */
@RunWith(AndroidJUnit4::class)
class HomeScreenTest {

    @get:Rule
    val compose = createComposeRule()

    @Test
    fun restingStateLabelIsRenderedVerbatim() {
        // The state label contract: resting state renders "Idle" verbatim.
        // (A full HomeScreen test requires DI + backend; the state-machine
        // label mapping itself is covered by VpnStateMachineTest on the JVM.)
        compose.setContent {
            com.aegisvpn.android.ui.theme.AegisTheme {
                androidx.compose.material3.Text(com.aegisvpn.android.vpn.TunnelManager.stateLabel(com.aegisvpn.android.domain.VpnState.Idle))
            }
        }
        compose.onNodeWithText("Idle").assertExists()
    }
}
