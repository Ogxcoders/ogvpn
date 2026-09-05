// AegisVPN Android client — root build script.
// Plugin versions are declared here once and applied per-module.
plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.20" apply false
    // Required with Kotlin 2.0+: the Compose compiler ships as a Gradle plugin.
    // Without it, `composeOptions.kotlinCompilerExtensionVersion` alone does not
    // configure a compiler and the build fails. Kept in lockstep with the
    // Kotlin version above.
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.20" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "2.0.20" apply false
}
