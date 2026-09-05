# AegisVPN Chrome Extension (Manifest V3)

Browser-only secure proxy that complements the system-level VPN apps.

## Routing model (browser-level limitation)

Chrome extensions **cannot create a system VPN tunnel**. This extension routes
browser traffic through Aegis egress proxies via the `chrome.proxy` API using
HTTPS CONNECT. Apps outside the browser are not covered — pair it with the
desktop app for full-device protection. This limitation is disclosed in the
Web Store listing, the popup footer, and the docs (`extension-setup`).

## Architecture

- `background.js` — service worker: proxy config, credential rotation
  (short-lived proxy credentials fetched per connect), suspension recovery
  (re-applies proxy on `onStartup`/`onInstalled`), badge state.
- `popup.js` / `popup.html` — minimal UI: connect/disconnect, location select,
  error states, diagnostics link.
- State syncs with the account via `api.aegisvpn.io`; extension failures
  degrade to "proxy off" rather than half-configured states.

## Permissions (minimized)

| Permission | Why |
|---|---|
| `storage` | Remember proxy state between sessions |
| `proxy` | Configure browser routing |
| `webRequest` + `webRequestAuthProvider` | Answer proxy auth challenges only |
| `host_permissions: api.aegisvpn.io` | Fetch proxy credentials |

No `tabs`, no `<all_urls>`, no content scripts — nothing reads page content.

## Load & test

1. Chrome → `chrome://extensions` → enable Developer mode.
2. "Load unpacked" → select this `extension/` folder.
3. Click the toolbar icon; "Protect browser" applies the proxy and shows ON.
4. Store metadata and privacy disclosures live in `docs/store-listing.md`.
