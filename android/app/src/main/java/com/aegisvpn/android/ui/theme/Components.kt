package com.aegisvpn.android.ui.theme

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Warning

/*
 * Shared UI component library. Every interactive element guarantees a
 * >= 48dp touch target; every state is conveyed by more than color alone
 * (label + icon + dot); skeletons preserve list geometry while loading.
 */

/** Minimum touch target mandated by the design system. */
val MinTouchTarget = 48.dp

// ---------------------------------------------------------------------------
// Status ring — the dominant protection indicator / primary action.
// ---------------------------------------------------------------------------

/** Visual state family for the ring; maps 1:1 from [com.aegisvpn.android.domain.VpnState]. */
enum class RingState { RESTING, CONNECTING, PROTECTED, RECOVERING, DISCONNECTING, FAILED, OFFLINE }

@Composable
fun StatusRing(
    state: RingState,
    headline: String,
    hint: String,
    actionLabel: String,
    enabled: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val aegis = LocalAegisColors.current
    val ringColor = when (state) {
        RingState.PROTECTED -> aegis.success
        RingState.CONNECTING, RingState.RECOVERING, RingState.DISCONNECTING -> aegis.warning
        RingState.FAILED -> aegis.danger
        RingState.OFFLINE -> MaterialTheme.colorScheme.onSurfaceVariant
        RingState.RESTING -> MaterialTheme.colorScheme.primary
    }
    val animated = state == RingState.CONNECTING || state == RingState.RECOVERING ||
        state == RingState.DISCONNECTING
    val breathing = state == RingState.PROTECTED

    val transition = rememberInfiniteTransition(label = "ring")
    val sweep by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(1400, easing = LinearEasing)),
        label = "sweep",
    )
    val pulse by transition.animateFloat(
        initialValue = 0.55f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1100), RepeatMode.Reverse),
        label = "pulse",
    )

    val description = "$headline. $hint. $actionLabel"

    Box(
        modifier = modifier.size(228.dp),
        contentAlignment = Alignment.Center,
    ) {
        // Layered glow.
        Canvas(modifier = Modifier.size(228.dp)) {
            val glowAlpha = when {
                animated -> 0.35f
                breathing -> 0.22f * pulse
                else -> 0.12f
            }
            drawCircle(color = ringColor.copy(alpha = glowAlpha), radius = size.minDimension / 1.75f)
        }
        // Progress / static ring.
        Canvas(modifier = Modifier.size(228.dp).clearAndSetSemantics {}) {
            val stroke = Stroke(width = 6.dp.toPx(), cap = StrokeCap.Round)
            val diameter = size.minDimension - stroke.width
            if (animated) {
                val gap = 100f
                val start = sweep
                drawArc(
                    color = ringColor,
                    startAngle = start,
                    sweepAngle = 360f - gap,
                    useCenter = false,
                    style = stroke,
                    topLeft = Offset(stroke.width / 2, stroke.width / 2),
                    size = androidx.compose.ui.geometry.Size(diameter, diameter),
                )
                drawArc(
                    color = ringColor.copy(alpha = 0.15f),
                    startAngle = 0f,
                    sweepAngle = 360f,
                    useCenter = false,
                    style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round),
                    topLeft = Offset(stroke.width / 2, stroke.width / 2),
                    size = androidx.compose.ui.geometry.Size(diameter, diameter),
                )
            } else {
                drawArc(
                    color = ringColor,
                    startAngle = -90f,
                    sweepAngle = if (state == RingState.PROTECTED) 360f else 300f,
                    useCenter = false,
                    style = stroke,
                    topLeft = Offset(stroke.width / 2, stroke.width / 2),
                    size = androidx.compose.ui.geometry.Size(diameter, diameter),
                )
            }
        }
        // Center: icon + headline + hint (icon doubles as non-color cue).
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(28.dp),
        ) {
            StatusGlyph(state, modifier = Modifier.size(30.dp))
            Spacer(Modifier.height(8.dp))
            Text(
                headline,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                hint,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
        // Whole ring is the action — 228dp is far beyond the 48dp minimum.
        Box(
            modifier = Modifier
                .size(228.dp)
                .clip(RoundedCornerShape(50))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    enabled = enabled,
                    role = Role.Button,
                    onClickLabel = actionLabel,
                ) { onClick() }
                .semantics { contentDescription = description },
        )
    }
}

/** State glyph — reinforces the headline so color is never the only cue. */
@Composable
fun StatusGlyph(state: RingState, modifier: Modifier = Modifier) {
    val aegis = LocalAegisColors.current
    val color = when (state) {
        RingState.PROTECTED -> aegis.success
        RingState.CONNECTING, RingState.RECOVERING, RingState.DISCONNECTING -> aegis.warning
        RingState.FAILED -> aegis.danger
        else -> MaterialTheme.colorScheme.primary
    }
    when (state) {
        RingState.PROTECTED -> Icon(Icons.Rounded.Check, null, modifier, tint = color)
        RingState.FAILED -> Icon(Icons.Rounded.Warning, null, modifier, tint = color)
        else -> RingDot(color, modifier)
    }
}

@Composable
private fun RingDot(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        drawCircle(color.copy(alpha = 0.25f), radius = size.minDimension / 2)
        drawCircle(color, radius = size.minDimension / 3.2f)
    }
}

// ---------------------------------------------------------------------------
// State pill — compact status chip (label + dot, not color alone).
// ---------------------------------------------------------------------------

@Composable
fun StatePill(text: String, color: Color, outlined: Boolean = true) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .background(
                if (outlined) Color.Transparent else color.copy(alpha = 0.14f),
                RoundedCornerShape(50),
            )
            .border(1.dp, color.copy(alpha = 0.55f), RoundedCornerShape(50))
            .padding(horizontal = 12.dp, vertical = 5.dp),
    ) {
        Box(
            Modifier
                .size(7.dp)
                .background(color, RoundedCornerShape(50)),
        )
        Spacer(Modifier.size(7.dp))
        Text(text, style = MaterialTheme.typography.labelMedium, color = color)
    }
}

// ---------------------------------------------------------------------------
// Cards and section scaffolding.
// ---------------------------------------------------------------------------

@Composable
fun AegisCard(
    modifier: Modifier = Modifier,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, LocalAegisColors.current.outline.copy(alpha = 0.6f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        content = content,
    )
}

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier.padding(start = 4.dp, top = 4.dp),
    )
}

// ---------------------------------------------------------------------------
// Skeletons — preserve geometry, communicate progress honestly.
// ---------------------------------------------------------------------------

@Composable
fun SkeletonBox(width: Dp? = null, height: Dp = 16.dp, modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val alpha by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(tween(750), RepeatMode.Reverse),
        label = "alpha",
    )
    val base = MaterialTheme.colorScheme.surfaceVariant
    Box(
        modifier
            .then(if (width != null) Modifier.size(width, height) else Modifier.fillMaxWidth().height(height))
            .background(base.copy(alpha = alpha), RoundedCornerShape(8.dp)),
    )
}

/** Skeleton card matching the server/device list geometry. */
@Composable
fun SkeletonListCard() {
    AegisCard {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                SkeletonBox(width = 44.dp, height = 44.dp, modifier = Modifier)
                Spacer(Modifier.size(12.dp))
                Column(Modifier.weight(1f)) {
                    SkeletonBox(width = 140.dp, height = 15.dp)
                    Spacer(Modifier.height(6.dp))
                    SkeletonBox(width = 200.dp, height = 12.dp)
                }
            }
            Spacer(Modifier.height(12.dp))
            SkeletonBox(height = 6.dp)
        }
    }
}

// ---------------------------------------------------------------------------
// Error panel — what happened + the next safe action.
// ---------------------------------------------------------------------------

@Composable
fun ErrorPanel(
    message: String,
    suggestion: String? = null,
    retryLabel: String = "Try again",
    onRetry: (() -> Unit)? = null,
) {
    val aegis = LocalAegisColors.current
    AegisCard {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Rounded.Warning,
                    contentDescription = null,
                    tint = aegis.danger,
                    modifier = Modifier.size(20.dp),
                )
                Spacer(Modifier.size(8.dp))
                Text(
                    "Something went wrong",
                    style = MaterialTheme.typography.titleSmall,
                    color = aegis.danger,
                )
            }
            Spacer(Modifier.height(6.dp))
            Text(message, style = MaterialTheme.typography.bodyMedium)
            if (suggestion != null) {
                Spacer(Modifier.height(4.dp))
                Text(
                    suggestion,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (onRetry != null) {
                Spacer(Modifier.height(12.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .clickable(onClickLabel = retryLabel) { onRetry() }
                        .padding(horizontal = 4.dp, vertical = 8.dp)
                        .heightIn(min = MinTouchTarget),
                ) {
                    Icon(Icons.Rounded.Refresh, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(6.dp))
                    Text(retryLabel, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// DEMO banner — honest labeling wherever simulated data may be mistaken
// for real VPN behavior.
// ---------------------------------------------------------------------------

@Composable
fun DemoBanner(modifier: Modifier = Modifier) {
    val aegis = LocalAegisColors.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .background(aegis.gold.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
            .border(1.dp, aegis.gold.copy(alpha = 0.45f), RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .semantics { liveRegion = LiveRegionMode.Polite },
    ) {
        Text(
            "DEMO",
            style = MaterialTheme.typography.labelSmall,
            color = aegis.gold,
            modifier = Modifier
                .background(aegis.gold.copy(alpha = 0.16f), RoundedCornerShape(6.dp))
                .padding(horizontal = 6.dp, vertical = 2.dp),
        )
        Spacer(Modifier.size(10.dp))
        Text(
            "Sample data. The tunnel is simulated — no traffic is routed or protected.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

// ---------------------------------------------------------------------------
// Load bar — server utilization with numeric label (never color alone).
// ---------------------------------------------------------------------------

@Composable
fun LoadBar(loadPct: Int, modifier: Modifier = Modifier) {
    val aegis = LocalAegisColors.current
    val color = when {
        loadPct < 60 -> aegis.success
        loadPct < 85 -> aegis.warning
        else -> aegis.danger
    }
    Column(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "Load",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.weight(1f))
            Text(
                "$loadPct%",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(4.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .height(6.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(50)),
        ) {
            Box(
                Modifier
                    .fillMaxWidth(fraction = (loadPct.coerceIn(0, 100)) / 100f)
                    .height(6.dp)
                    .background(color, RoundedCornerShape(50)),
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Icon button with guaranteed 48dp target (favorites, close, etc.).
// ---------------------------------------------------------------------------

@Composable
fun AegisIconButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tint: Color = MaterialTheme.colorScheme.onSurfaceVariant,
    enabled: Boolean = true,
) {
    Box(
        modifier
            .size(MinTouchTarget)
            .clip(RoundedCornerShape(14.dp))
            .clickable(enabled = enabled, role = Role.Button, onClickLabel = label) { onClick() }
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, null, modifier = Modifier.size(22.dp), tint = tint)
    }
}
