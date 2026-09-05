package com.aegisvpn.android.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.PasswordPolicy
import kotlinx.coroutines.launch

/**
 * Login / register screen. Validation mirrors the backend exactly
 * ([PasswordPolicy]); every failure path shows a clear message.
 */
@Composable
fun LoginScreen(onAuthenticated: () -> Unit) {
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    var mode by remember { mutableStateOf("login") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var fieldErrors by remember {
        mutableStateOf(mapOf<String, String>())
    }

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
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            if (mode == "login") "Sign in to AegisVPN" else "Create your account",
            style = MaterialTheme.typography.headlineSmall,
        )
        Spacer(Modifier.height(20.dp))

        if (mode == "register") {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                singleLine = true,
                isError = fieldErrors.containsKey("name"),
                supportingText = fieldErrors["name"]?.let { { Text(it) } },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(10.dp))
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            isError = fieldErrors.containsKey("email"),
            supportingText = fieldErrors["email"]?.let { { Text(it) } },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            isError = fieldErrors.containsKey("password"),
            supportingText = fieldErrors["password"]?.let { { Text(it) } },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(16.dp))

        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(10.dp))
        }

        Button(
            onClick = { submit() },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (busy) {
                CircularProgressIndicator(modifier = Modifier.height(18.dp))
            } else {
                Text(if (mode == "login") "Sign in" else "Create account")
            }
        }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = {
            mode = if (mode == "login") "register" else "login"
            error = null
            fieldErrors = emptyMap()
        }) {
            Text(
                if (mode == "login") "No account yet? Create one"
                else "Already registered? Sign in",
            )
        }
    }
}
