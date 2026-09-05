package com.aegisvpn.android.data.repo

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import com.aegisvpn.android.data.api.AegisApi
import com.aegisvpn.android.data.api.CheckoutRequest
import com.aegisvpn.android.data.api.CreatePeerRequest
import com.aegisvpn.android.data.api.PatchDeviceRequest
import com.aegisvpn.android.data.api.RotatePeerRequest
import com.aegisvpn.android.data.secure.TokenStore
import com.aegisvpn.android.domain.Plan
import com.aegisvpn.android.domain.Server
import com.aegisvpn.android.domain.Session
import com.aegisvpn.android.domain.DeviceSummary
import com.aegisvpn.android.domain.Subscription
import com.aegisvpn.android.domain.TunnelConfig
import com.aegisvpn.android.domain.toDomain
import com.wireguard.crypto.Key
import com.wireguard.crypto.KeyPair
import kotlinx.coroutines.flow.first
import java.util.UUID

/**
 * VPN-related data: servers, devices, sessions, subscription, tunnels.
 *
 * SECURITY MODEL: WireGuard private keys are generated HERE, on-device, and
 * never leave the device — only the public key travels to the backend
 * (contract: POST /vpn/peers). Private keys are persisted only in the
 * encrypted TokenStore, keyed by tunnel id.
 */
class VpnRepository(
    private val api: AegisApi,
    private val dataStore: DataStore<Preferences>,
    private val tokens: TokenStore,
) {

    // ---- servers ----

    suspend fun servers(): List<Server> =
        apiCall { api.servers() }.servers.map { it.toDomain() }

    suspend fun server(id: String): Server =
        apiCall { api.server(id) }.server.toDomain()

    suspend fun selectedServerId(): String? =
        dataStore.data.first()[KEY_SELECTED_SERVER]

    suspend fun selectServer(serverId: String) {
        dataStore.edit { it[KEY_SELECTED_SERVER] = serverId }
    }

    // ---- favorites ----

    suspend fun favorites(): Set<String> =
        dataStore.data.first()[KEY_FAVORITES] ?: emptySet()

    suspend fun toggleFavorite(serverId: String) {
        dataStore.edit {
            val current = it[KEY_FAVORITES] ?: emptySet()
            it[KEY_FAVORITES] = if (serverId in current) current - serverId else current + serverId
        }
    }

    // ---- devices ----

    suspend fun devices(): List<DeviceSummary> =
        apiCall { api.devices() }.devices.map { it.toDomain() }

    suspend fun renameDevice(id: String, name: String): DeviceSummary {
        val dto = apiCall { api.renameDevice(id, PatchDeviceRequest(name)) }
        return dto.device.toDomain()
    }

    suspend fun revokeDevice(id: String) {
        apiCallResponse { api.revokeDevice(id) }
    }

    // ---- sessions ----

    suspend fun sessions(): List<Session> =
        apiCall { api.sessions() }.sessions.map { it.toDomain() }

    suspend fun forceDisconnect(sessionId: String) {
        apiCallResponse { api.forceDisconnect(sessionId) }
    }

    // ---- subscription ----

    suspend fun subscription(): Subscription =
        apiCall { api.subscription() }.subscription.toDomain()

    suspend fun plans(): List<Plan> =
        apiCall { api.plans() }.plans.map { it.toDomain() }

    /** Demo-mode checkout (simulated payment) or 501 when Stripe configured. */
    suspend fun checkout(planCode: String): Subscription =
        apiCall { api.checkout(CheckoutRequest(planCode)) }.subscription.toDomain()

    suspend fun cancelSubscription(): Subscription =
        apiCall { api.cancelSubscription() }.subscription.toDomain()

    // ---- tunnels ----

    /**
     * Provisions a tunnel for [deviceId] on [serverId]:
     * 1. generates a fresh Curve25519 keypair on-device,
     * 2. uploads ONLY the public key,
     * 3. stores the private key in the encrypted store, keyed by tunnel id.
     */
    suspend fun createTunnel(deviceId: String, serverId: String): TunnelConfig {
        val keypair = KeyPair()
        val publicKey = keypair.getPublicKey().toBase64()
        val dto = apiCall { api.createPeer(UUID.randomUUID().toString(), CreatePeerRequest(deviceId, serverId, publicKey)) }
        val config = dto.tunnel.toDomain()
        tokens.saveTunnelPrivateKey(config.id, keypair.getPrivateKey().toBase64())
        return config
    }

    suspend fun tunnelPrivateKey(tunnelId: String): String? = tokens.tunnelPrivateKey(tunnelId)

    suspend fun deleteTunnel(tunnelId: String) {
        apiCallResponse { api.deletePeer(tunnelId) }
        tokens.removeTunnelPrivateKey(tunnelId)
    }

    suspend fun rotateTunnel(tunnelId: String): TunnelConfig {
        val keypair = KeyPair()
        val dto = apiCall { api.rotatePeer(tunnelId, RotatePeerRequest(keypair.getPublicKey().toBase64())) }
        val config = dto.tunnel.toDomain()
        tokens.saveTunnelPrivateKey(config.id, keypair.getPrivateKey().toBase64())
        tokens.removeTunnelPrivateKey(tunnelId)
        return config
    }

    suspend fun tunnels(): List<TunnelConfig> =
        apiCall { api.peers() }.tunnels.map { it.toDomain() }

    companion object {
        val KEY_SELECTED_SERVER = stringPreferencesKey("selected_server")
        val KEY_FAVORITES = stringSetPreferencesKey("favorite_servers")
    }
}
