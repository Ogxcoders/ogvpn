package com.aegisvpn.android.di

import android.content.Context
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.preferencesDataStoreFile
import com.aegisvpn.android.data.api.AegisApi
import com.aegisvpn.android.data.api.AuthInterceptor
import com.aegisvpn.android.data.api.TokenRefreshInterceptor
import com.aegisvpn.android.data.demo.DemoInterceptor
import com.aegisvpn.android.data.demo.DemoMode
import com.aegisvpn.android.data.repo.AuthRepository
import com.aegisvpn.android.data.repo.VpnRepository
import com.aegisvpn.android.data.secure.TokenStore
import com.aegisvpn.android.notifications.Notifier
import com.aegisvpn.android.sync.EventStreamClient
import com.aegisvpn.android.vpn.TunnelManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Manual dependency injection.
 *
 * WHY NOT HILT/KOIN: this project must build first-try on a contributor's
 * machine. Hilt adds kapt/ksp processors and annotation-plugin version pins
 * that are the single most common cause of local build failures in fresh
 * clones; Koin adds a runtime resolution layer with weaker compile-time
 * guarantees. A hand-built graph of ~10 singletons is fully inspectable,
 * statically typed, and costs nothing at build time. This is a deliberate,
 * documented trade-off, not an oversight.
 */
object ServiceLocator {

    @Volatile
    private var initialized = false

    lateinit var appScope: CoroutineScope
        private set
    lateinit var json: Json
        private set
    lateinit var tokenStore: TokenStore
        private set
    lateinit var okHttpClient: OkHttpClient
        private set
    lateinit var api: AegisApi
        private set
    lateinit var authRepository: AuthRepository
        private set
    lateinit var vpnRepository: VpnRepository
        private set
    lateinit var tunnelManager: TunnelManager
        private set
    lateinit var notifier: Notifier
        private set
    lateinit var eventStream: EventStreamClient
        private set

    fun init(context: Context) {
        if (initialized) return
        synchronized(this) {
            if (initialized) return
            val app = context.applicationContext

            // Restore the demo-mode flag before anything can touch the network.
            DemoMode.load(app)

            appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

            json = Json {
                ignoreUnknownKeys = true
                explicitNulls = false
                encodeDefaults = true
            }

            tokenStore = TokenStore(app)

            val dataStore = PreferenceDataStoreFactory.create(
                scope = CoroutineScope(appScope.coroutineContext + Dispatchers.IO),
            ) { app.preferencesDataStoreFile("aegis_prefs") }

            val authInterceptor = AuthInterceptor(tokenStore)
            val refreshEvents = kotlinx.coroutines.flow.MutableSharedFlow<com.aegisvpn.android.domain.AuthEvent>(extraBufferCapacity = 8)

            // Build the API first with a bootstrap client, then wire the
            // refresh interceptor that needs the api reference (cyclic by
            // nature; broken with a settable delegate).
            val earlyOkHttp = OkHttpClient.Builder()
                // Demo mode answers locally; must run before auth/refresh logic.
                .addInterceptor(DemoInterceptor())
                .addInterceptor(authInterceptor)
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .writeTimeout(20, TimeUnit.SECONDS)
                .build()
            val earlyRetrofit = Retrofit.Builder()
                .baseUrl(com.aegisvpn.android.BuildConfig.API_BASE_URL)
                .client(earlyOkHttp)
                .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
                .build()
            val earlyApi = earlyRetrofit.create(AegisApi::class.java)

            val refreshInterceptor = TokenRefreshInterceptor(tokenStore, earlyApi, refreshEvents, json)

            okHttpClient = earlyOkHttp.newBuilder()
                .addInterceptor(refreshInterceptor)
                .build()

            api = earlyRetrofit.newBuilder()
                .client(okHttpClient)
                .build()
                .create(AegisApi::class.java)

            notifier = Notifier(app)

            authRepository = AuthRepository(api, tokenStore, dataStore, refreshEvents)
            vpnRepository = VpnRepository(api, dataStore, tokenStore)
            tunnelManager = TunnelManager(app, notifier, dataStore, authRepository, vpnRepository)
            eventStream = EventStreamClient(app, tokenStore, authRepository, vpnRepository, tunnelManager)

            initialized = true
        }
    }
}
