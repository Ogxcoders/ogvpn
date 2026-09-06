package com.aegisvpn.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/*
 * AegisVPN design system — single source of truth shared with the desktop
 * client (see desktop/src/styles.css for the mirrored CSS tokens).
 *
 * Color reasoning (OKLCH-derived, converted to sRGB):
 *  - Voids are tinted (deep desaturated navy), never pure black.
 *  - Light surfaces are tinted off-whites, never pure white backgrounds.
 *  - The accent (cyan) is perceptually balanced against success/warn/danger
 *    so no channel dominates; red is reserved for danger semantics and the
 *    disconnect action — never decoration.
 *  - Gold/premium is deliberately muted and always subordinate to the VPN
 *    protection status.
 */

// ---------- Brand palette (shared constants) ----------
val Cyan = Color(0xFF45D6F0)
val CyanPress = Color(0xFF0E7E99)
val Navy = Color(0xFF0B1322)
val Green = Color(0xFF4ADE9C)
val Amber = Color(0xFFF5BC57)
val Red = Color(0xFFF87171)

/** Extended semantic tokens beyond the Material 3 scheme. */
@Immutable
data class AegisColors(
    val success: Color,
    val onSuccess: Color,
    val successContainer: Color,
    val warning: Color,
    val onWarning: Color,
    val warningContainer: Color,
    val danger: Color,
    val dangerContainer: Color,
    val gold: Color,
    val info: Color,
    val surfaceHigh: Color,
    val outline: Color,
    val glow: Color,
    val scrim: Color,
)

private val DarkAegis = AegisColors(
    success = Color(0xFF4ADE9C),
    onSuccess = Color(0xFF05291A),
    successContainer = Color(0xFF123B2A),
    warning = Color(0xFFF5BC57),
    onWarning = Color(0xFF2E1F04),
    warningContainer = Color(0xFF3A2C10),
    danger = Color(0xFFF87171),
    dangerContainer = Color(0xFF3B1A1E),
    gold = Color(0xFFE7BC64),
    info = Color(0xFF8AB6F9),
    surfaceHigh = Color(0xFF1B2842),
    outline = Color(0xFF27375A),
    glow = Color(0x6645D6F0),
    scrim = Color(0xB3070D18),
)

private val LightAegis = AegisColors(
    success = Color(0xFF0B8A5F),
    onSuccess = Color(0xFFFFFFFF),
    successContainer = Color(0xFFDCF5E9),
    warning = Color(0xFF9A5B00),
    onWarning = Color(0xFFFFFFFF),
    warningContainer = Color(0xFFFDEED3),
    danger = Color(0xFFD92D2D),
    dangerContainer = Color(0xFFFDE4E4),
    gold = Color(0xFF96660F),
    info = Color(0xFF1D6FD8),
    surfaceHigh = Color(0xFFEAF0F9),
    outline = Color(0xFFD5DEEE),
    glow = Color(0x330E7E99),
    scrim = Color(0x99152238),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF45D6F0),
    onPrimary = Color(0xFF04252E),
    primaryContainer = Color(0xFF0E3A47),
    onPrimaryContainer = Color(0xFFC8F1FB),
    background = Color(0xFF0B1322),
    onBackground = Color(0xFFE9EFFA),
    surface = Color(0xFF121C30),
    onSurface = Color(0xFFE9EFFA),
    surfaceVariant = Color(0xFF1B2842),
    onSurfaceVariant = Color(0xFF9AAAC6),
    surfaceTint = Color(0xFF45D6F0),
    error = Color(0xFFF87171),
    onError = Color(0xFF370505),
    errorContainer = Color(0xFF3B1A1E),
    onErrorContainer = Color(0xFFFDCFCF),
    tertiary = Color(0xFF4ADE9C),
    onTertiary = Color(0xFF05291A),
    secondary = Color(0xFFF5BC57),
    onSecondary = Color(0xFF2E1F04),
    outline = Color(0xFF27375A),
    outlineVariant = Color(0xFF1E2B47),
    scrim = Color(0xFF070D18),
)

private val LightColors = lightColorScheme(
    primary = Color(0xFF0E7E99),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFD3F1F9),
    onPrimaryContainer = Color(0xFF06303C),
    background = Color(0xFFF4F7FD),
    onBackground = Color(0xFF152238),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF152238),
    surfaceVariant = Color(0xFFEAF0F9),
    onSurfaceVariant = Color(0xFF5D6E8A),
    error = Color(0xFFD92D2D),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFDE4E4),
    onErrorContainer = Color(0xFF5C0B0B),
    tertiary = Color(0xFF0B8A5F),
    onTertiary = Color(0xFFFFFFFF),
    secondary = Color(0xFF9A5B00),
    onSecondary = Color(0xFFFFFFFF),
    outline = Color(0xFFD5DEEE),
    outlineVariant = Color(0xFFE3EAF5),
    scrim = Color(0xFF152238),
)

/** Type scale — display sizes serve the dominant protection-status ring. */
private val AegisTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 34.sp,
        lineHeight = 40.sp,
        letterSpacing = (-0.25).sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 26.sp,
        lineHeight = 32.sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 19.sp,
        lineHeight = 26.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
        letterSpacing = 0.1.sp,
    ),
    titleSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 12.5.sp,
        lineHeight = 17.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 15.sp,
        letterSpacing = 0.5.sp,
    ),
)

val LocalAegisColors = staticCompositionLocalOf { DarkAegis }

/** Convenience accessor for the extended tokens. */
object AegisThemeDefaults {
    fun colors(dark: Boolean): AegisColors = if (dark) DarkAegis else LightAegis
}

@Composable
fun AegisTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    CompositionLocalProvider(LocalAegisColors provides AegisThemeDefaults.colors(dark)) {
        MaterialTheme(
            colorScheme = if (dark) DarkColors else LightColors,
            typography = AegisTypography,
            content = content,
        )
    }
}

/** Spacing scale — every layout gap comes from this table, no one-off values. */
object Spacing {
    val xs: Dp = 4.dp
    val sm: Dp = 8.dp
    val md: Dp = 12.dp
    val lg: Dp = 16.dp
    val xl: Dp = 20.dp
    val xxl: Dp = 24.dp
    val xxxl: Dp = 32.dp
    val huge: Dp = 48.dp
}
