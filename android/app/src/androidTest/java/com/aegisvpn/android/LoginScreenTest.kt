package com.aegisvpn.android

import android.content.Intent
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.aegisvpn.android.ui.screens.LoginScreen
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented UI test for the login flow. REQUIRES AN EMULATOR/DEVICE —
 * it is documented as NOT EXECUTED in docs/TESTING.md (no emulator in CI).
 */
@RunWith(AndroidJUnit4::class)
class LoginScreenTest {

    @get:Rule
    val compose = createComposeRule()

    @Test
    fun invalidEmailShowsClientSideError() {
        compose.setContent {
            com.aegisvpn.android.ui.theme.AegisTheme {
                LoginScreen(onAuthenticated = { })
            }
        }
        compose.onNodeWithText("Email").performTextInput("not-an-email")
        compose.onNodeWithText("Password").performTextInput("Sup3rSecurePass")
        compose.onNodeWithText("Sign in").performClick()
        compose.onNodeWithText("Enter a valid email address").assertIsDisplayed()
    }

    @Test
    fun weakPasswordShowsPolicyError() {
        compose.setContent {
            com.aegisvpn.android.ui.theme.AegisTheme {
                LoginScreen(onAuthenticated = { })
            }
        }
        compose.onNodeWithText("Email").performTextInput("a@b.c")
        compose.onNodeWithText("Password").performTextInput("short1")
        compose.onNodeWithText("Sign in").performClick()
        compose.onNodeWithText("Password must contain at least 10 characters", substring = true).assertIsDisplayed()
    }
}
