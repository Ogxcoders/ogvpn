# OGVPN — Licensing

## Original code

The OGVPN backend, web control plane, desktop client, VPN server tooling,
Chrome extension, build scripts and documentation in this repository are
released under the MIT License:

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

## Android client

The Android application links against the official
[wireguard-android](https://github.com/WireGuard/wireguard-android) tunnel
library, which is licensed **GPL-2.0-only**. Distributing the OGVPN Android
APK therefore subjects that APK to GPL-2.0 terms. The corresponding full
license text is available at:
https://www.gnu.org/licenses/old-licenses/gpl-2.0.html

## Third-party components

Each package keeps its own license: see `backend/package.json`,
`web/package.json`, `desktop/package.json`, `android/app/build.gradle.kts`
(dependency list) and `platform/package.json` for the components in use.
WireGuard is a registered trademark of Jason A. Donenfeld; this project is
not affiliated with the WireGuard project.
