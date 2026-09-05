// AegisVPN Chrome extension — background service worker (Manifest V3).
// Browser-level routing uses the chrome.proxy API: the extension cannot create
// a system VPN tunnel, so traffic is routed through Aegis egress proxies
// (HTTPS CONNECT). This limitation is disclosed in the store listing and docs.
const API_BASE = "https://api.aegisvpn.io";
const PROXY_HOST = "proxy.aegisvpn.io";

const DEFAULT_STATE = { enabled: false, serverCode: "auto", protocol: "https" };

async function getState() {
  const { state } = await chrome.storage.local.get("state");
  return state ?? DEFAULT_STATE;
}

async function saveState(patch) {
  const state = { ...(await getState()), ...patch };
  await chrome.storage.local.set({ state });
  return state;
}

// Apply or clear the browser proxy configuration.
async function applyProxy(state) {
  if (!state.enabled) {
    await chrome.proxy.settings.clear({ scope: "regular" });
    await updateBadge(state);
    return { applied: false };
  }
  // Credential rotation: fetch a short-lived proxy credential from the API.
  let cred = null;
  try {
    const res = await fetch(`${API_BASE}/v1/extension/proxy-credential`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serverCode: state.serverCode }),
      credentials: "include",
    });
    if (res.ok) cred = await res.json();
  } catch {
    // Provider failure handling: leave proxy off rather than half-configured.
    await chrome.proxy.settings.clear({ scope: "regular" });
    return { applied: false, error: "credential_fetch_failed" };
  }
  const config = {
    mode: "fixed_servers",
    protocol: state.protocol,
    endpoint: { host: cred?.host ?? `${state.serverCode}.${PROXY_HOST}`, port: cred?.port ?? 8443 },
    ...(cred?.username ? { auth: { scheme: "basic", username: cred.username, password: cred.secret } } : {}),
  };
  await chrome.proxy.settings.set({ value: config, scope: "regular" });
  await updateBadge(state);
  return { applied: true };
}

async function updateBadge(state) {
  const text = state.enabled ? "ON" : "";
  const color = state.enabled ? "#10b981" : "#71717a";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}

// Reconnect logic: service workers can suspend; re-apply proxy on wake.
chrome.runtime.onStartup.addListener(async () => {
  const state = await getState();
  if (state.enabled) await applyProxy(state);
});
chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  await applyProxy(state);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case "getState": {
        const state = await getState();
        sendResponse({ ok: true, state });
        break;
      }
      case "connect": {
        const state = await saveState({ enabled: true, serverCode: msg.serverCode || "auto" });
        const result = await applyProxy(state);
        sendResponse({ ok: result.applied, state, error: result.error });
        break;
      }
      case "disconnect": {
        const state = await saveState({ enabled: false });
        await applyProxy(state);
        sendResponse({ ok: true, state });
        break;
      }
      case "switchServer": {
        const state = await saveState({ serverCode: msg.serverCode });
        if (state.enabled) await applyProxy(state);
        sendResponse({ ok: true, state });
        break;
      }
      case "diagnostics": {
        const state = await getState();
        const proxy = await chrome.proxy.settings.get({ scope: "regular" });
        sendResponse({ ok: true, state, proxyControlled: proxy.levelOfControl, version: chrome.runtime.getManifest().version });
        break;
      }
      default:
        sendResponse({ ok: false, error: "unknown_message" });
    }
  })();
  return true; // async sendResponse
});
