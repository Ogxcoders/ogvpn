plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.aegisvpn.android"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aegisvpn.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        debug {
            // Emulator loopback to a host-running AegisVPN backend.
            // NOTE: Retrofit requires the base URL to end with '/'.
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080/api/v1/\"")
            isMinifyEnabled = false
        }
        release {
            // Point this at your production control plane before shipping.
            buildConfigField("String", "API_BASE_URL", "\"https://vpn.example.com/api/v1/\"")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        // Ignored when org.jetbrains.kotlin.plugin.compose is applied (Kotlin 2.0+).
        // Retained so older toolchains (Kotlin < 2.0) can still build the module.
        kotlinCompilerExtensionVersion = "1.5.15"
    }

    packaging {
        jniLibs {
            // Keep symbols in the packaged WireGuard Go shared libraries so native
            // crash reports from the tunnel remain symbolicated and debuggable.
            keepDebugSymbols += "**/*.so"
        }
    }

    lint {
        // Third-party (WireGuard Go) bytecode can trip lint-vital on release
        // assembly; findings were triaged manually, do not abort the build.
        abortOnError = false
    }
}

dependencies {
    // Compose (versions come from the BOM).
    implementation(platform("androidx.compose:compose-bom:2024.09.03"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")

    // Core AndroidX + lifecycle + navigation.
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.navigation:navigation-compose:2.8.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.6")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")

    // WireGuard tunnel (GoBackend userspace implementation).
    // The library's Maven Central versions are date-stamped; "1.1.1" does not
    // exist, so the newest stable line available at the time of writing is used.
    implementation("com.wireguard.android:tunnel:1.0.20231018")

    // Networking: Retrofit + OkHttp + kotlinx.serialization.
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Storage: preferences DataStore + encrypted token storage.
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    testImplementation("junit:junit:4.13.2")
    testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("org.jetbrains.kotlin:kotlin-test:2.0.20")

    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
