package com.aegisvpn.android.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import com.aegisvpn.android.data.demo.DemoMode
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.PasswordPolicy
import com.aegisvpn.android.ui.theme.ErrorPanel
import com.aegisvpn.android.ui.theme.LocalAegisColors
import com.aegisvpn.android.ui.theme.MinTouchTarget
import com.aegisvpn.android.ui.theme.Spacing
import kotlinx.coroutines.launch

/**
 * Login / register. Brand-first layout with a single accent panel; validation
 * mirrors the backend exactly ([PasswordPolicy]); every failure path shows a
 * clear message plus the next safe action. Demo mode stays honestly labeled.
 */
@Composable
fun LoginScreen(onAuthenticated: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val aegis = LocalAegisColors.current
    var mode by remember { mutableStateOf("login") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var fieldErrors by remember { mutableStateOf(mapOf<String, String>()) }

    fun submit() {
        val errors = buildMap {
            if (!PasswordPolicy.isValidEmail(email)) put("email", "Enter a valid email address")
            val problems = PasswordPolicy.errors(password)
            if (problems.isNotEmpty()) put("password", "Password must contain ${problems.joinToString(", ")}")
            if (mode == "register" && name.isBlank()) put("name", "Name is required")
        }
        fieldErrors = errors
        if (errors.isNotEmpty()) return
        busy = true
        error = null
        scope.launch {
            try {
                if (mode == "login") {
                    ServiceLocator.authRepository.login(email, password)
                } else {
                    ServiceLocator.authRepository.register(email, password, name)
                }
                onAuthenticated()
            } catch (e: RepoError) {
                error = if (e is RepoError.Network && !DemoMode.enabled) {
                    "No backend is reachable from this build. Check your network and retry — " +
                        "or use \"Explore demo mode\" below to try the full interface offline."
                } else {
                    e.message
                }
            } catch (e: Exception) {
                error = "Unexpected error: ${e.message}"
            } finally {
                busy = false
            }
        }
    }

    /**
     * Offline demo mode: flips [DemoMode] on (all API calls are answered
     * locally by [com.aegisvpn.android.data.demo.DemoInterceptor]) and signs
     * in with the documented demo fixture. No real server, no real tunnel.
     */
    fun enterDemo() {
        busy = true
        error = null
        fieldErrors = emptyMap()
        DemoMode.enable(context)
        scope.launch {
            try {
                ServiceLocator.authRepository.login("demo@aegisvpn.local", "DemoPass123")
                onAuthenticated()
            } catch (e: RepoError) {
                error = e.message
            } catch (e: Exception) {
                error = "Unexpected error: ${e.message}"
            } finally {
                busy = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = Spacing.xxl),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(Spacing.huge))

        // ---------- Brand ----------
        BrandMark(Modifier.size(72.dp))
        Spacer(Modifier.height(Spacing.lg))
        Text(
            if (mode == "login") "Welcome back" else "Create your account",
            style = MaterialTheme.typography.headlineMedium,
        )
        Text(
            "Private, fast and honest VPN protection",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(Spacing.xxxl))

        // ---------- Form card ----------
        Column(
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(20.dp))
                .border(1.dp, aegis.outline.copy(alpha = 0.6f), RoundedCornerShape(20.dp))
                .padding(Spacing.xl),
        ) {
            Text(
                if (mode == "login") "Sign in to AegisVPN" else "Sign up for AegisVPN",
                style = MaterialTheme.typography.titleMedium,
            )
            Spacer(Modifier.height(Spacing.lg))

            if (mode == "register") {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    singleLine = true,
                    isError = fieldErrors.containsKey("name"),
                    supportingText = fieldErrors["name"]?.let { { Text(it) } },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(Spacing.md))
            }
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                isError = fieldErrors.containsKey("email"),
                supportingText = fieldErrors["email"]?.let { { Text(it) } },
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(Spacing.md))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                singleLine = true,
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                isError = fieldErrors.containsKey("password"),
                supportingText = fieldErrors["password"]?.let { { Text(it) } },
                shape = RoundedCornerShape(12.dp),
                trailingIcon = {
                    // 48dp visibility toggle — icon doubles as state cue.
                    TextButton(
                        onClick = { passwordVisible = !passwordVisible },
                        modifier = Modifier
                            .heightIn(min = MinTouchTarget)
                            .semantics {
                                contentDescription = if (passwordVisible) "Hide password" else "Show password"
                            },
                    ) {
                        Icon(
                            if (passwordVisible) Icons.Rounded.Close else Icons.Rounded.Check,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(Spacing.lg))

            error?.let {
                ErrorPanel(message = it, suggestion = if (mode == "login") "Check your credentials and retry." else null)
                Spacer(Modifier.height(Spacing.md))
            }

            Button(
                onClick = { submit() },
                enabled = !busy,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp),
            ) {
                if (busy) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                } else {
                    Text(if (mode == "login") "Sign in" else "Create account")
                }
            }
            TextButton(
                onClick = {
                    mode = if (mode == "login") "register" else "login"
                    error = null
                    fieldErrors = emptyMap()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = MinTouchTarget),
            ) {
                Text(
                    if (mode == "login") "No account yet? Create one" else "Already registered? Sign in",
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }

        // ---------- Demo entry (honestly labeled) ----------
        Spacer(Modifier.height(Spacing.lg))
        Column(
            Modifier
                .fillMaxWidth()
                .background(aegis.gold.copy(alpha = 0.10f), RoundedCornerShape(16.dp))
                .border(1.dp, aegis.gold.copy(alpha = 0.45f), RoundedCornerShape(16.dp))
                .padding(Spacing.lg),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "DEMO",
                    style = MaterialTheme.typography.labelSmall,
                    color = aegis.gold,
                    modifier = Modifier
                        .background(aegis.gold.copy(alpha = 0.16f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp),
                )
                Spacer(Modifier.size(8.dp))
                Text("Explore the full interface offline", style = MaterialTheme.typography.titleSmall)
            }
            Spacer(Modifier.height(6.dp))
            Text(
                "Sample servers, devices and VPN states — no account or backend needed. " +
                    "The tunnel is simulated; no traffic is routed.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(Spacing.md))
            Button(
                onClick = { enterDemo() },
                enabled = !busy,
                shape = RoundedCornerShape(12.dp),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.onSurface,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp),
            ) {
                Text("Explore demo mode", color = MaterialTheme.colorScheme.primary)
            }
        }

        Spacer(Modifier.height(Spacing.huge))
    }
}

/** Abstract shield glyph drawn with Canvas — brand mark, no asset needed. */
@Composable
fun BrandMark(modifier: Modifier = Modifier) {
    val primary = MaterialTheme.colorScheme.primary
    val aegis = LocalAegisColors.current
    Canvas(modifier.semantics { contentDescription = "AegisVPN" }) {
        val w = size.width
        val h = size.height
        val path = androidx.compose.ui.graphics.Path().apply {
            moveTo(w / 2f, h * 0.04f)
            // Shield outline
            cubicTo(w * 0.78f, h * 0.10f, w * 0.92f, h * 0.16f, w * 0.94f, h * 0.18f)
            lineTo(w * 0.94f, h * 0.52f)
            cubicTo(w * 0.94f, h * 0.76f, w * 0.72f, h * 0.92f, w / 2f, h * 0.97f)
            cubicTo(w * 0.28f, h * 0.92f, w * 0.06f, h * 0.76f, w * 0.06f, h * 0.52f)
            lineTo(w * 0.06f, h * 0.18f)
            cubicTo(w * 0.08f, h * 0.16f, w * 0.22f, h * 0.10f, w / 2f, h * 0.04f)
            close()
        }
        drawPath(path, brush = androidx.compose.ui.graphics.Brush.verticalGradient(
            listOf(primary.copy(alpha = 0.9f), primary.copy(alpha = 0.45f)),
        ))
        // Checkmark inside the shield
        val check = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.32f, h * 0.50f)
            lineTo(w * 0.45f, h * 0.64f)
            lineTo(w * 0.70f, h * 0.36f)
        }
        drawPath(
            check,
            color = Color(0xFF04252E),
            style = androidx.compose.ui.graphics.drawscope.Stroke(
                width = w * 0.07f,
                cap = androidx.compose.ui.graphics.StrokeCap.Round,
            ),
        )
    }
}
