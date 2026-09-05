package com.aegisvpn.android.data.demo

import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import kotlin.random.Random

/**
 * OkHttp interceptor that answers every control-plane request locally while
 * [DemoMode] is enabled — the app never touches the network in demo mode.
 *
 * Installed FIRST in the OkHttp chain (before auth/refresh interceptors), so
 * demo responses do not depend on tokens at all. Responses are serialized
 * contract DTOs from [DemoData]; a small artificial latency keeps the UI's
 * real busy/progress states visible.
 *
 * Honest failure handling: unknown routes return the standard error envelope
 * (404), and demo business errors (e.g. connecting to a maintenance server)
 * return the same codes the real backend produces.
 */
class DemoInterceptor : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        if (!DemoMode.enabled) return chain.proceed(request)

        // Strip the base-URL prefix: ".../api/v1/auth/login" -> "auth/login".
        val rawPath = request.url.encodedPath
        val path = rawPath.substringAfter("api/v1/", rawPath)
        val body = request.body?.let { requestBody ->
            try {
                val buffer = okio.Buffer()
                requestBody.writeTo(buffer)
                buffer.readUtf8()
            } catch (_: Exception) {
                null
            }
        }

        // 150–350 ms latency so spinners and state transitions are observable.
        try {
            Thread.sleep(150L + Random.nextLong(200L))
        } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
        }

        val (status, payload) = DemoData.handle(request.method, path, body)

        val builder = Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(status)
            .message(if (status < 400) "OK (demo)" else "Demo error")
        return if (payload != null) {
            builder
                .body(payload.toResponseBody("application/json".toMediaType()))
                .build()
        } else {
            builder.build()
        }
    }
}
