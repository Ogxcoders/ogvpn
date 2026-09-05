package com.aegisvpn.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// AegisVPN palette (shared with desktop + web control plane).
val Cyan = Color(0xFF22D3EE)
val CyanPress = Color(0xFF0EA5C9)
val Navy = Color(0xFF0B1220)
val Surface = Color(0xFF111A2E)
val SurfaceVariant = Color(0xFF1A2440)
val Border = Color(0xFF223050)
val TextPrimary = Color(0xFFE6EDF7)
val TextMuted = Color(0xFF8CA0BF)
val Green = Color(0xFF34D399)
val Amber = Color(0xFFFBBF24)
val Red = Color(0xFFF87171)

private val DarkColors = darkColorScheme(
    primary = Cyan,
    onPrimary = Color(0xFF04222B),
    background = Navy,
    onBackground = TextPrimary,
    surface = Surface,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceVariant,
    onSurfaceVariant = TextMuted,
    error = Red,
    tertiary = Green,
    secondary = Amber,
)

private val LightColors = lightColorScheme(
    primary = CyanPress,
    onPrimary = Color(0xFFFFFFFF),
    background = Color(0xFFF4F7FB),
    onBackground = Color(0xFF16233B),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF16233B),
    surfaceVariant = Color(0xFFEEF2F9),
    onSurfaceVariant = Color(0xFF5B6B85),
    error = Color(0xFFDC2626),
    tertiary = Color(0xFF059669),
    secondary = Color(0xFFB45309),
)

@Composable
fun AegisTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    MaterialTheme(
        colorScheme = if (dark) DarkColors else LightColors,
        content = content,
    )
}
