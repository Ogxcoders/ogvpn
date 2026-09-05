package com.aegisvpn.android.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.aegisvpn.android.data.repo.RepoError
import com.aegisvpn.android.di.ServiceLocator
import com.aegisvpn.android.domain.Server
import com.aegisvpn.android.ui.theme.Green
import com.aegisvpn.android.ui.theme.Red
import com.aegisvpn.android.ui.theme.Amber
import kotlinx.coroutines.launch

/** Server list: search, sort, favorites, status badges, load bars, selection. */
@Composable
fun ServersScreen(onClose: () -> Unit) {
    val scope = rememberCoroutineScope()
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

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("Search") },
                singleLine = true,
                modifier = Modifier.weight(1f),
            )
            FilterChip(selected = sortByLoad, onClick = { sortByLoad = !sortByLoad }, label = { Text("By load") })
        }
        Spacer(Modifier.height(12.dp))

        when {
            error != null -> {
                Text(error!!, color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(8.dp))
                Button(onClick = { error = null; load() }) { Text("Retry") }
            }
            servers == null -> {
                CircularProgressIndicator()
            }
            else -> {
                val q = query.trim().lowercase()
                val list = servers!!
                    .filter { q.isBlank() || "${it.name} ${it.country} ${it.city} ${it.code}".lowercase().contains(q) }
                    .sortedWith(
                        if (sortByLoad) compareBy({ it.loadPct }) else compareBy({ it.country }, { it.city }),
                    )
                if (list.isEmpty()) {
                    Text("No servers match your search.")
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(list, key = { it.id }) { server ->
                            Card(Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(14.dp)) {
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Column(Modifier.weight(1f)) {
                                            Text(server.name, style = MaterialTheme.typography.titleSmall)
                                            Text(
                                                "${server.city}, ${server.country} · ${server.code}",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            )
                                        }
                                        TextButton(onClick = {
                                            scope.launch {
                                                ServiceLocator.vpnRepository.toggleFavorite(server.id)
                                                favorites = ServiceLocator.vpnRepository.favorites()
                                            }
                                        }) {
                                            Text(if (server.id in favorites) "★" else "☆")
                                        }
                                    }
                                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                        val badgeColor = when (server.status) {
                                            "active" -> Green
                                            "maintenance", "drain" -> Amber
                                            else -> Red
                                        }
                                        Text(
                                            server.status,
                                            color = badgeColor,
                                            style = MaterialTheme.typography.labelMedium,
                                        )
                                        Spacer(Modifier.weight(1f))
                                        Text(
                                            "load ${server.loadPct}%",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                    Spacer(Modifier.height(8.dp))
                                    Button(
                                        onClick = {
                                            scope.launch {
                                                ServiceLocator.vpnRepository.selectServer(server.id)
                                                selectedId = server.id
                                            }
                                        },
                                        enabled = server.status == "active" && selectedId != server.id,
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Text(if (selectedId == server.id) "Selected" else "Select")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        TextButton(onClick = onClose, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text("Done")
        }
    }
}
