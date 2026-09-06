package com.aegisvpn.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.aegisvpn.android.data.demo.DemoMode
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.Server
import com.aegisvpn.android.ui.theme.AegisCard
import com.aegisvpn.android.ui.theme.AegisIconButton
import com.aegisvpn.android.ui.theme.DemoBanner
import com.aegisvpn.android.ui.theme.ErrorPanel
import com.aegisvpn.android.ui.theme.LocalAegisColors
import com.aegisvpn.android.ui.theme.LoadBar
import com.aegisvpn.android.ui.theme.SkeletonListCard
import com.aegisvpn.android.ui.theme.Spacing
import com.aegisvpn.android.ui.theme.StatePill
import kotlinx.coroutines.launch

/**
 * Server browser: search, sort, favorites, honest availability badges and
 * load bars with numeric labels. Skeletons preserve the exact list geometry
 * while loading; errors always carry the next safe action (retry).
 */
@Composable
fun ServersScreen(onClose: () -> Unit) {
    val scope = rememberCoroutineScope()
    val aegis = LocalAegisColors.current
    var servers by remember { mutableStateOf<List<Server>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var query by remember { mutableStateOf("") }
    var sortByLoad by remember { mutableStateOf(true) }
    var favorites by remember { mutableStateOf(emptySet<String>()) }
    var selectedId by remember { mutableStateOf<String?>(null) }

    fun load() {
        scope.launch {
            try {
                servers = ServiceLocator.vpnRepository.servers()
                favorites = ServiceLocator.vpnRepository.favorites()
                selectedId = ServiceLocator.vpnRepository.selectedServerId()
            } catch (e: RepoError) {
                error = e.message
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    Column(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = Spacing.xl),
    ) {
        // ---------- Header ----------
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Spacing.md),
        ) {
            Column(Modifier.weight(1f)) {
                Text("Servers", style = MaterialTheme.typography.headlineSmall)
                Text(
                    "Pick an active server — lowest load is usually fastest",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            AegisIconButton(icon = Icons.Rounded.Check, label = "Done — back to home", onClick = onClose)
        }
        if (DemoMode.enabled) {
            Spacer(Modifier.height(Spacing.md))
            DemoBanner()
        }

        // ---------- Search + sort ----------
        Spacer(Modifier.height(Spacing.md))
        Row(
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("Search country, city or code") },
                singleLine = true,
                leadingIcon = { Icon(Icons.Rounded.Search, null, modifier = Modifier.size(20.dp)) },
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f),
            )
            FilterChip(
                selected = sortByLoad,
                onClick = { sortByLoad = !sortByLoad },
                label = { Text(if (sortByLoad) "By load" else "By country") },
                shape = RoundedCornerShape(12.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                ),
            )
        }
        Spacer(Modifier.height(Spacing.md))

        // ---------- Content ----------
        when {
            error != null -> {
                ErrorPanel(
                    message = error!!,
                    suggestion = "Check your connection — your servers list will reload instantly after.",
                    onRetry = { error = null; load() },
                )
            }
            servers == null -> {
                // Skeletons preserve the list geometry — no layout jump.
                Column(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    repeat(4) { SkeletonListCard() }
                }
            }
            else -> {
                val q = query.trim().lowercase()
                val list = servers!!
                    .filter { q.isBlank() || "${it.name} ${it.country} ${it.city} ${it.code}".lowercase().contains(q) }
                    .sortedWith(
                        if (sortByLoad) compareBy({ it.loadPct }) else compareBy({ it.country }, { it.city }),
                    )
                if (list.isEmpty()) {
                    EmptyServers(query)
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                        items(list, key = { it.id }) { server ->
                            ServerRow(
                                server = server,
                                favorite = server.id in favorites,
                                selected = selectedId == server.id,
                                onToggleFavorite = {
                                    scope.launch {
                                        ServiceLocator.vpnRepository.toggleFavorite(server.id)
                                        favorites = ServiceLocator.vpnRepository.favorites()
                                    }
                                },
                                onSelect = {
                                    scope.launch {
                                        ServiceLocator.vpnRepository.selectServer(server.id)
                                        selectedId = server.id
                                    }
                                },
                            )
                        }
                        item { Spacer(Modifier.height(Spacing.xl)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun ServerRow(
    server: Server,
    favorite: Boolean,
    selected: Boolean,
    onToggleFavorite: () -> Unit,
    onSelect: () -> Unit,
) {
    val aegis = LocalAegisColors.current
    val statusColor = when (server.status) {
        "active" -> aegis.success
        "maintenance", "drain" -> aegis.warning
        else -> aegis.danger
    }
    val statusHint = when (server.status) {
        "active" -> "Available"
        "maintenance" -> "Under maintenance"
        "drain" -> "Not accepting new connections"
        else -> "Offline"
    }
    AegisCard(
        modifier = Modifier.then(
            if (selected) Modifier.border(1.5.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(18.dp))
            else Modifier,
        ),
    ) {
        Column(Modifier.padding(Spacing.lg)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Country code monogram.
                Box(
                    Modifier
                        .size(44.dp)
                        .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        server.code.take(2).uppercase(),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                }
                Spacer(Modifier.size(Spacing.md))
                Column(Modifier.weight(1f)) {
                    Text(server.name, style = MaterialTheme.typography.titleSmall)
                    Text(
                        "${server.city}, ${server.country}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                AegisIconButton(
                    icon = Icons.Rounded.Star,
                    label = if (favorite) "Remove ${server.name} from favorites" else "Add ${server.name} to favorites",
                    onClick = onToggleFavorite,
                    tint = if (favorite) LocalAegisColors.current.gold else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                )
            }
            Spacer(Modifier.height(Spacing.md))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                StatePill(text = server.status, color = statusColor)
                Text(
                    statusHint,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                )
            }
            Spacer(Modifier.height(Spacing.md))
            LoadBar(loadPct = server.loadPct)
            Spacer(Modifier.height(Spacing.md))
            val canSelect = server.status == "active" && !selected
            val selectLabel = when {
                selected -> "Selected — ready to connect"
                server.status != "active" -> "Unavailable while ${server.status}"
                else -> "Select ${server.name}"
            }
            Box(
                Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
                    .background(
                        when {
                            selected -> MaterialTheme.colorScheme.primaryContainer
                            canSelect -> MaterialTheme.colorScheme.primary
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        RoundedCornerShape(12.dp),
                    )
                    .clickable(enabled = canSelect, onClickLabel = selectLabel) { onSelect() }
                    .semantics { contentDescription = selectLabel },
                contentAlignment = Alignment.Center,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (selected) {
                        Icon(Icons.Rounded.Check, null, tint = MaterialTheme.colorScheme.onPrimaryContainer, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.size(6.dp))
                    }
                    Text(
                        if (selected) "Selected" else "Select",
                        style = MaterialTheme.typography.labelLarge,
                        color = when {
                            selected -> MaterialTheme.colorScheme.onPrimaryContainer
                            canSelect -> MaterialTheme.colorScheme.onPrimary
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyServers(query: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.xxxl),
    ) {
        Text("No servers match", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(Spacing.sm))
        Text(
            if (query.isBlank()) "All servers are hidden by filters — try clearing them."
            else "Nothing matched \"$query\" — check the spelling or try a country code.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}
