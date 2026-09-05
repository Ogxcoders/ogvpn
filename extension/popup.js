// AegisVPN popup: mirrors the shared connection state system in miniature.
const $ = (id) => document.getElementById(id);
const toggle = $("toggle");
const status = $("status");
const server = $("server");
const err = $("err");

function render(state) {
  status.textContent = state.enabled ? `Protected · ${state.serverCode === "auto" ? "auto" : state.serverCode}` : "Browser proxy off";
  status.classList.toggle("on", state.enabled);
  toggle.textContent = state.enabled ? "Disconnect" : "Protect browser";
  toggle.className = state.enabled ? "disconnect" : "connect";
  server.value = state.serverCode || "auto";
}

function send(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

toggle.addEventListener("click", async () => {
  toggle.disabled = true;
  err.style.display = "none";
  const { ok, state, error } = await send(toggle.textContent.startsWith("Disconnect") ? { type: "disconnect" } : { type: "connect", serverCode: server.value });
  toggle.disabled = false;
  if (state) render(state);
  if (!ok) {
    err.textContent = error === "credential_fetch_failed"
      ? "Could not fetch a proxy credential — sign in from the dashboard, then try again."
      : "Connection failed. Please retry.";
    err.style.display = "block";
  }
});

server.addEventListener("change", async () => {
  const { state } = await send({ type: "switchServer", serverCode: server.value });
  if (state) render(state);
});

$("docs").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://aegisvpn.io/#/docs/extension-setup" });
});

// Suspension recovery: always re-render from storage on wake
send({ type: "getState" }).then(({ state }) => state && render(state));
