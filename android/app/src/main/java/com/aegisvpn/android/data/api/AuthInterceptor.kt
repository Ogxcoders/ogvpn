package com.aegisvpn.android.data.api

import com.aegisvpn.android.data.secure.TokenStore
import okhttp3.Interceptor
import okhttp3.Response

/** Attaches the bearer access token to API requests. */
class AuthInterceptor(private val tokens: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val access = tokens.accessToken
        val newRequest = if (access != null) {
            request.newBuilder()
                .header("Authorization", "Bearer $access")
                .build()
        } else {
            request
        }
        return chain.proceed(newRequest)
    }
}
