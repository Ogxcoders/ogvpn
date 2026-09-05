# OGVPN Master Checklist — 3,754 Items

Generated from `docs/source-checklist.md` (3689 base items) + 65 CI/CD + GitHub verification items supplied by the project owner. Machine-readable twin: `docs/master-checklist.json`.

## Evidence ladder (mandatory)

```
IMPLEMENTED → BUILT → AUTOMATED TESTED → REAL RUNTIME TESTED → EVIDENCE
```

| Tier | Meaning |
|---|---|
| IMPLEMENTED | Code exists in the repository |
| BUILT | Compiled/assembled by GitHub Actions CI, not just locally |
| AUTOMATED TESTED | Automated suite covers the item and passes in CI |
| REAL RUNTIME TESTED | Exercised against a real running system (device/server/network) |
| EVIDENCE | Durable, linkable artifact: CI run URL, artifact, log, screenshot |

## Rules

- Source code is not proof of functionality. Compilation is not proof of correctness.
- An item is PASS only at the EVIDENCE tier with a concrete artifact.
- Never report a blanket pass count (“all tests passed”); every item carries its own status.
- FAIL items must record reproduction steps, root cause, and the fix commit.
- N/A items must record why they genuinely do not apply.

## Section summary

| # | Section | Items |
|---|---|---|
| 1 | 1. Mission, Scope & Evidence | 22 |
| 2 | 2. Agent Execution Discipline | 22 |
| 3 | 3. Repository & Build Integrity | 22 |
| 4 | 4. Environment & Configuration | 22 |
| 5 | 5. Web Authentication & Session | 22 |
| 6 | 6. Web Authentication Extended | 22 |
| 7 | 7. Web Navigation & Shell | 23 |
| 8 | 8. Web Layout, Scroll & Responsive | 22 |
| 9 | 9. Web Component Quality | 23 |
| 10 | 10. Web Dashboard | 22 |
| 11 | 11. Web Servers & Connection UI | 23 |
| 12 | 12. Web Devices | 22 |
| 13 | 13. Web Billing & Entitlements | 22 |
| 14 | 14. Web Settings & Account | 22 |
| 15 | 15. Web Support & Notifications | 23 |
| 16 | 16. Android Project Creation | 21 |
| 17 | 17. Android Authentication | 22 |
| 18 | 18. Android Navigation & UI | 23 |
| 19 | 19. Android Dashboard & Core Features | 22 |
| 20 | 20. Android VPN Service | 22 |
| 21 | 21. Android Network Resilience | 22 |
| 22 | 22. Android Kill Switch & Routing | 22 |
| 23 | 23. Android Background, Permissions & Notifications | 22 |
| 24 | 24. Android Device Matrix | 23 |
| 25 | 25. Android Security & Storage | 22 |
| 26 | 26. Desktop Project Creation | 22 |
| 27 | 27. Desktop Authentication & Navigation | 22 |
| 28 | 28. Desktop VPN Integration | 23 |
| 29 | 29. Desktop OS Coverage | 22 |
| 30 | 30. Desktop UI/UX | 22 |
| 31 | 31. Chrome Extension Foundation | 23 |
| 32 | 32. Chrome Extension VPN Behavior | 22 |
| 33 | 33. API Contract Inventory | 22 |
| 34 | 34. API Reliability | 22 |
| 35 | 35. Backend Authentication | 22 |
| 36 | 36. Authorization & RBAC | 22 |
| 37 | 37. Database Integrity | 23 |
| 38 | 38. Data Consistency & Sync | 22 |
| 39 | 39. VPN Control Plane | 22 |
| 40 | 40. VPN Server Lifecycle | 22 |
| 41 | 41. WireGuard | 22 |
| 42 | 42. OpenVPN/IKEv2 Where Applicable | 22 |
| 43 | 43. DNS & Leak Prevention | 22 |
| 44 | 44. IPv4, IPv6 & Routing | 22 |
| 45 | 45. Kill Switch | 23 |
| 46 | 46. Split Tunneling | 22 |
| 47 | 47. Network Switching | 23 |
| 48 | 48. Sleep, Resume, Restart | 22 |
| 49 | 49. Performance | 23 |
| 50 | 50. Memory, CPU & Battery | 23 |
| 51 | 51. Accessibility Core | 23 |
| 52 | 52. Accessibility Mobile & Desktop | 23 |
| 53 | 53. Forms & Input | 23 |
| 54 | 54. Error Handling | 23 |
| 55 | 55. Loading, Empty, Stale & Offline States | 23 |
| 56 | 56. Overlays, Dialogs & Drawers | 22 |
| 57 | 57. Sidebar & Mobile Menu | 22 |
| 58 | 58. Visual QA | 22 |
| 59 | 59. Cognitive UX | 23 |
| 60 | 60. Interaction Integrity | 22 |
| 61 | 61. Duplicate Action & Race Protection | 22 |
| 62 | 62. Security Baseline | 22 |
| 63 | 63. Web Security | 22 |
| 64 | 64. Android Security | 23 |
| 65 | 65. Desktop Security | 23 |
| 66 | 66. Extension Security | 22 |
| 67 | 67. Privacy & Data Handling | 22 |
| 68 | 68. Analytics & Telemetry | 22 |
| 69 | 69. Observability | 22 |
| 70 | 70. Jobs, Queues & Background Work | 22 |
| 71 | 71. File Upload & Download | 22 |
| 72 | 72. Deep Links & External Launch | 23 |
| 73 | 73. Notifications Cross-Platform | 22 |
| 74 | 74. Localization & Time | 23 |
| 75 | 75. Browser Matrix | 23 |
| 76 | 76. Mobile Browser Matrix | 24 |
| 77 | 77. Desktop Window & Input Matrix | 24 |
| 78 | 78. Concurrent Users & Devices | 22 |
| 79 | 79. Load & Stress | 22 |
| 80 | 80. Soak & Reliability | 23 |
| 81 | 81. Backup & Disaster Recovery | 22 |
| 82 | 82. Deployment & CI/CD | 24 |
| 83 | 83. Release & Update | 23 |
| 84 | 84. Billing Edge Cases | 22 |
| 85 | 85. Product Limits & Abuse | 22 |
| 86 | 86. Admin & Operations | 22 |
| 87 | 87. Audit & Compliance | 22 |
| 88 | 88. Platform Parity | 22 |
| 89 | 89. Cross-Platform Session Handoff | 22 |
| 90 | 90. UX Consistency System | 22 |
| 91 | 91. Component State Matrix | 22 |
| 92 | 92. Scroll Integrity | 23 |
| 93 | 93. Mobile Menu/Header Diagnostics | 22 |
| 94 | 94. API-to-UI Handshake | 22 |
| 95 | 95. End-to-End User Journeys | 22 |
| 96 | 96. Android End-to-End | 23 |
| 97 | 97. Desktop End-to-End | 23 |
| 98 | 98. Extension End-to-End | 23 |
| 99 | 99. Regression & Defect Closure | 23 |
| 100 | 100. Final Production Acceptance | 25 |
| 101 | 101. Matrix: Web / authentication | 10 |
| 102 | 101. Matrix: Web / session persistence | 10 |
| 103 | 101. Matrix: Web / navigation | 10 |
| 104 | 101. Matrix: Web / forms | 10 |
| 105 | 101. Matrix: Web / loading states | 10 |
| 106 | 101. Matrix: Web / error states | 10 |
| 107 | 101. Matrix: Web / offline recovery | 10 |
| 108 | 101. Matrix: Web / network switching | 10 |
| 109 | 101. Matrix: Web / VPN connection | 10 |
| 110 | 101. Matrix: Web / VPN disconnection | 10 |
| 111 | 101. Matrix: Web / server selection | 10 |
| 112 | 101. Matrix: Web / device management | 10 |
| 113 | 101. Matrix: Web / settings | 10 |
| 114 | 101. Matrix: Web / notifications | 10 |
| 115 | 101. Matrix: Web / billing | 10 |
| 116 | 101. Matrix: Web / support | 10 |
| 117 | 101. Matrix: Web / accessibility | 10 |
| 118 | 101. Matrix: Web / responsive behavior | 10 |
| 119 | 101. Matrix: Web / keyboard/input | 10 |
| 120 | 101. Matrix: Web / permissions | 10 |
| 121 | 101. Matrix: Web / deep links | 10 |
| 122 | 101. Matrix: Web / logging | 10 |
| 123 | 101. Matrix: Web / analytics | 10 |
| 124 | 101. Matrix: Web / security | 10 |
| 125 | 101. Matrix: Web / performance | 10 |
| 126 | 101. Matrix: Web / state synchronization | 10 |
| 127 | 101. Matrix: Web / update/restart recovery | 10 |
| 128 | 101. Matrix: Web / duplicate-action protection | 10 |
| 129 | 101. Matrix: Web / API contract handling | 10 |
| 130 | 101. Matrix: Android / authentication | 10 |
| 131 | 101. Matrix: Android / session persistence | 10 |
| 132 | 101. Matrix: Android / navigation | 10 |
| 133 | 101. Matrix: Android / forms | 10 |
| 134 | 101. Matrix: Android / loading states | 10 |
| 135 | 101. Matrix: Android / error states | 10 |
| 136 | 101. Matrix: Android / offline recovery | 10 |
| 137 | 101. Matrix: Android / network switching | 10 |
| 138 | 101. Matrix: Android / VPN connection | 10 |
| 139 | 101. Matrix: Android / VPN disconnection | 10 |
| 140 | 101. Matrix: Android / server selection | 10 |
| 141 | 101. Matrix: Android / device management | 10 |
| 142 | 101. Matrix: Android / settings | 10 |
| 143 | 101. Matrix: Android / notifications | 10 |
| 144 | 101. Matrix: Android / billing | 10 |
| 145 | 101. Matrix: Android / support | 10 |
| 146 | 101. Matrix: Android / accessibility | 10 |
| 147 | 101. Matrix: Android / responsive behavior | 10 |
| 148 | 101. Matrix: Android / keyboard/input | 10 |
| 149 | 101. Matrix: Android / permissions | 10 |
| 150 | 101. Matrix: Android / deep links | 10 |
| 151 | 101. Matrix: Android / logging | 10 |
| 152 | 101. Matrix: Android / analytics | 10 |
| 153 | 101. Matrix: Android / security | 10 |
| 154 | 101. Matrix: Android / performance | 10 |
| 155 | 101. Matrix: Android / state synchronization | 10 |
| 156 | 101. Matrix: Android / update/restart recovery | 10 |
| 157 | 101. Matrix: Android / duplicate-action protection | 10 |
| 158 | 101. Matrix: Android / API contract handling | 10 |
| 159 | 101. Matrix: Desktop / authentication | 10 |
| 160 | 101. Matrix: Desktop / session persistence | 10 |
| 161 | 101. Matrix: Desktop / navigation | 10 |
| 162 | 101. Matrix: Desktop / forms | 10 |
| 163 | 101. Matrix: Desktop / loading states | 10 |
| 164 | 101. Matrix: Desktop / error states | 10 |
| 165 | 101. Matrix: Desktop / offline recovery | 10 |
| 166 | 101. Matrix: Desktop / network switching | 10 |
| 167 | 101. Matrix: Desktop / VPN connection | 10 |
| 168 | 101. Matrix: Desktop / VPN disconnection | 10 |
| 169 | 101. Matrix: Desktop / server selection | 10 |
| 170 | 101. Matrix: Desktop / device management | 10 |
| 171 | 101. Matrix: Desktop / settings | 10 |
| 172 | 101. Matrix: Desktop / notifications | 10 |
| 173 | 101. Matrix: Desktop / billing | 10 |
| 174 | 101. Matrix: Desktop / support | 10 |
| 175 | 101. Matrix: Desktop / accessibility | 10 |
| 176 | 101. Matrix: Desktop / responsive behavior | 10 |
| 177 | 101. Matrix: Desktop / keyboard/input | 10 |
| 178 | 101. Matrix: Desktop / permissions | 10 |
| 179 | 101. Matrix: Desktop / deep links | 10 |
| 180 | 101. Matrix: Desktop / logging | 10 |
| 181 | 101. Matrix: Desktop / analytics | 10 |
| 182 | 101. Matrix: Desktop / security | 10 |
| 183 | 101. Matrix: Desktop / performance | 10 |
| 184 | 101. Matrix: Desktop / state synchronization | 10 |
| 185 | 101. Matrix: Desktop / update/restart recovery | 10 |
| 186 | 101. Matrix: Desktop / duplicate-action protection | 10 |
| 187 | 101. Matrix: Desktop / API contract handling | 10 |
| 188 | 101. Matrix: Chrome extension / authentication | 10 |
| 189 | 101. Matrix: Chrome extension / session persistence | 10 |
| 190 | 101. Matrix: Chrome extension / navigation | 10 |
| 191 | 101. Matrix: Chrome extension / forms | 10 |
| 192 | 101. Matrix: Chrome extension / loading states | 10 |
| 193 | 101. Matrix: Chrome extension / error states | 10 |
| 194 | 101. Matrix: Chrome extension / offline recovery | 10 |
| 195 | 101. Matrix: Chrome extension / network switching | 10 |
| 196 | 101. Matrix: Chrome extension / VPN connection | 10 |
| 197 | 101. Matrix: Chrome extension / VPN disconnection | 10 |
| 198 | 101. Matrix: Chrome extension / server selection | 10 |
| 199 | 101. Matrix: Chrome extension / device management | 10 |
| 200 | 101. Matrix: Chrome extension / settings | 10 |
| 201 | 101. Matrix: Chrome extension / notifications | 10 |
| 202 | 101. Matrix: Chrome extension / billing | 10 |
| 203 | 101. Matrix: Chrome extension / support | 10 |
| 204 | 101. Matrix: Chrome extension / accessibility | 10 |
| 205 | 101. Matrix: Chrome extension / responsive behavior | 10 |
| 206 | 101. Matrix: Chrome extension / keyboard/input | 10 |
| 207 | 101. Matrix: Chrome extension / permissions | 10 |
| 208 | 101. Matrix: Chrome extension / deep links | 10 |
| 209 | 101. Matrix: Chrome extension / logging | 10 |
| 210 | 101. Matrix: Chrome extension / analytics | 10 |
| 211 | 101. Matrix: Chrome extension / security | 10 |
| 212 | 101. Matrix: Chrome extension / performance | 10 |
| 213 | 101. Matrix: Chrome extension / state synchronization | 10 |
| 214 | 101. Matrix: Chrome extension / update/restart recovery | 10 |
| 215 | 101. Matrix: Chrome extension / duplicate-action protection | 10 |
| 216 | 101. Matrix: Chrome extension / API contract handling | 10 |
| 217 | 101. Matrix: Backend/API / authentication | 10 |
| 218 | 101. Matrix: Backend/API / session persistence | 10 |
| 219 | 101. Matrix: Backend/API / navigation | 10 |
| 220 | 101. Matrix: Backend/API / forms | 10 |
| 221 | 101. Matrix: Backend/API / loading states | 10 |
| 222 | 101. Matrix: Backend/API / error states | 10 |
| 223 | 101. Matrix: Backend/API / offline recovery | 10 |
| 224 | 101. Matrix: Backend/API / network switching | 10 |
| 225 | 101. Matrix: Backend/API / VPN connection | 10 |
| 226 | 101. Matrix: Backend/API / VPN disconnection | 10 |
| 227 | 101. Matrix: Backend/API / server selection | 10 |
| 228 | 101. Matrix: Backend/API / device management | 10 |
| 229 | 101. Matrix: Backend/API / settings | 10 |
| 230 | 101. Matrix: Backend/API / notifications | 10 |
| 231 | 101. Matrix: Backend/API / billing | 10 |
| 232 | 101. Matrix: Backend/API / support | 10 |
| 233 | 101. Matrix: Backend/API / accessibility | 10 |
| 234 | 101. Matrix: Backend/API / responsive behavior | 10 |
| 235 | 101. Matrix: Backend/API / keyboard/input | 10 |
| 236 | 101. Matrix: Backend/API / permissions | 10 |
| 237 | 101. Matrix: Backend/API / deep links | 10 |
| 238 | 101. Matrix: Backend/API / logging | 10 |
| 239 | 101. Matrix: Backend/API / analytics | 10 |
| 240 | 101. Matrix: Backend/API / security | 10 |
| 241 | 101. Matrix: Backend/API / performance | 10 |
| 242 | 101. Matrix: Backend/API / state synchronization | 10 |
| 243 | 101. Matrix: Backend/API / update/restart recovery | 10 |
| 244 | 101. Matrix: Backend/API / duplicate-action protection | 10 |
| 245 | 101. Matrix: Backend/API / API contract handling | 10 |
| 246 | 102. CI/CD + GitHub Verification | 65 |
| | **Total** | **3754** |

## Full item list

### 1. Mission, Scope & Evidence

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0001 | 1 | Inventory every repository, package, app target, service, extension, script, route, screen, component, database model, and deployment artifact before changing anything. | NOT_STARTED | — |
| OGVPN-0002 | 2 | Confirm the actual deliverables are Web, Android, Desktop, Chrome extension, backend, database, deployment, and supporting tooling. | NOT_STARTED | — |
| OGVPN-0003 | 3 | Treat Android as a build requirement, not documentation; create the real native Android application if source/build artifacts are absent. | NOT_STARTED | — |
| OGVPN-0004 | 4 | Treat Desktop as a build requirement, not documentation; create the real desktop application if source/build artifacts are absent. | NOT_STARTED | — |
| OGVPN-0005 | 5 | Detect whether any claimed implementation exists only in docs, screenshots, mocks, stubs, placeholders, or dead code. | NOT_STARTED | — |
| OGVPN-0006 | 6 | Create a complete feature inventory from requirements, existing code, APIs, and rendered screens. | NOT_STARTED | — |
| OGVPN-0007 | 7 | Create a platform matrix mapping every feature to Web, Android, Desktop, and Extension where applicable. | NOT_STARTED | — |
| OGVPN-0008 | 8 | Create a screen inventory for every platform and every reachable state. | NOT_STARTED | — |
| OGVPN-0009 | 9 | Create a component inventory for every reusable and platform-specific component. | NOT_STARTED | — |
| OGVPN-0010 | 10 | Create a state inventory covering initial, loading, active, stale, success, error, offline, disabled, and empty states where applicable. | NOT_STARTED | — |
| OGVPN-0011 | 11 | Create a user-flow inventory from first launch through account deletion and every major task. | NOT_STARTED | — |
| OGVPN-0012 | 12 | Create a dependency inventory and identify unsupported, obsolete, duplicated, or risky dependencies. | NOT_STARTED | — |
| OGVPN-0013 | 13 | Create an API inventory and map every client call to its backend contract. | NOT_STARTED | — |
| OGVPN-0014 | 14 | Create a data-flow inventory for authentication, VPN configuration, devices, servers, billing, usage, notifications, and support. | NOT_STARTED | — |
| OGVPN-0015 | 15 | Create an environment inventory for development, test, staging, and production. | NOT_STARTED | — |
| OGVPN-0016 | 16 | Create an evidence folder containing build logs, test logs, screenshots, recordings, and defect evidence. | NOT_STARTED | — |
| OGVPN-0017 | 17 | Do not accept source-code presence as proof of functionality; execute the functionality. | NOT_STARTED | — |
| OGVPN-0018 | 18 | Do not accept compilation as proof of correctness; verify rendered and runtime behavior. | NOT_STARTED | — |
| OGVPN-0019 | 19 | Do not skip a requirement because it is inconvenient or cross-platform. | NOT_STARTED | — |
| OGVPN-0020 | 20 | Do not leave TODOs, fake APIs, placeholder screens, dead buttons, mock-only flows, or knowingly broken paths. | NOT_STARTED | — |
| OGVPN-0021 | 21 | Keep a live defect list and resolve every discovered defect before declaring completion. | NOT_STARTED | — |
| OGVPN-0022 | 22 | At the end, produce Requirement → Implemented → Tested → Verified evidence for every applicable requirement. | NOT_STARTED | — |
### 2. Agent Execution Discipline

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0023 | 23 | Follow INSPECT → UNDERSTAND → PLAN → IMPLEMENT → RUN → INSPECT → TEST → DIAGNOSE → FIX → RETEST → REGRESSION → VERIFY → DELIVER. | NOT_STARTED | — |
| OGVPN-0024 | 24 | Read the existing architecture before replacing or duplicating it. | NOT_STARTED | — |
| OGVPN-0025 | 25 | Preserve working behavior unless a deliberate improvement is required. | NOT_STARTED | — |
| OGVPN-0026 | 26 | Prefer shared domain logic over duplicated platform logic where technically appropriate. | NOT_STARTED | — |
| OGVPN-0027 | 27 | Keep platform-specific UI and OS integrations native to each platform. | NOT_STARTED | — |
| OGVPN-0028 | 28 | Never hide a failing test merely to obtain a green build. | NOT_STARTED | — |
| OGVPN-0029 | 29 | Never weaken validation solely to make a test pass. | NOT_STARTED | — |
| OGVPN-0030 | 30 | Never hardcode successful responses for production flows. | NOT_STARTED | — |
| OGVPN-0031 | 31 | Never silently swallow exceptions that affect user-visible behavior. | NOT_STARTED | — |
| OGVPN-0032 | 32 | Record exact reproduction steps for every defect. | NOT_STARTED | — |
| OGVPN-0033 | 33 | Record expected behavior and observed behavior for every defect. | NOT_STARTED | — |
| OGVPN-0034 | 34 | Localize each defect to the smallest responsible layer. | NOT_STARTED | — |
| OGVPN-0035 | 35 | Fix root causes instead of patching symptoms. | NOT_STARTED | — |
| OGVPN-0036 | 36 | Run the smallest relevant test immediately after each repair. | NOT_STARTED | — |
| OGVPN-0037 | 37 | Run broader regression tests after grouped repairs. | NOT_STARTED | — |
| OGVPN-0038 | 38 | Re-test previously fixed defects after unrelated changes. | NOT_STARTED | — |
| OGVPN-0039 | 39 | Verify both success and failure paths for every important action. | NOT_STARTED | — |
| OGVPN-0040 | 40 | Verify first-run and returning-user behavior. | NOT_STARTED | — |
| OGVPN-0041 | 41 | Verify clean install and upgrade behavior. | NOT_STARTED | — |
| OGVPN-0042 | 42 | Verify interrupted operations and recovery. | NOT_STARTED | — |
| OGVPN-0043 | 43 | Verify behavior with realistic production-like data. | NOT_STARTED | — |
| OGVPN-0044 | 44 | Do not declare done until all high-severity defects are resolved. | NOT_STARTED | — |
### 3. Repository & Build Integrity

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0045 | 45 | Verify every package has a valid manifest and reproducible build. | NOT_STARTED | — |
| OGVPN-0046 | 46 | Verify lockfiles match manifests and builds are deterministic. | NOT_STARTED | — |
| OGVPN-0047 | 47 | Verify no missing source files are referenced by build configuration. | NOT_STARTED | — |
| OGVPN-0048 | 48 | Verify no generated files are incorrectly required as source. | NOT_STARTED | — |
| OGVPN-0049 | 49 | Verify TypeScript, Kotlin/Java, Swift/Objective-C, C#, Rust, or other configured languages compile cleanly as applicable. | NOT_STARTED | — |
| OGVPN-0050 | 50 | Verify linting passes without newly introduced suppressions. | NOT_STARTED | — |
| OGVPN-0051 | 51 | Verify formatting is consistent and automated checks pass. | NOT_STARTED | — |
| OGVPN-0052 | 52 | Verify static analysis reports are reviewed rather than ignored. | NOT_STARTED | — |
| OGVPN-0053 | 53 | Verify all environment variables are documented by purpose. | NOT_STARTED | — |
| OGVPN-0054 | 54 | Verify required environment variables fail clearly when absent. | NOT_STARTED | — |
| OGVPN-0055 | 55 | Verify secret values are never committed. | NOT_STARTED | — |
| OGVPN-0056 | 56 | Verify debug-only code cannot ship in production. | NOT_STARTED | — |
| OGVPN-0057 | 57 | Verify development mock servers cannot be accidentally selected in production. | NOT_STARTED | — |
| OGVPN-0058 | 58 | Verify production builds use production endpoints. | NOT_STARTED | — |
| OGVPN-0059 | 59 | Verify release builds disable inappropriate verbose logging. | NOT_STARTED | — |
| OGVPN-0060 | 60 | Verify source maps and debugging settings follow the deployment policy. | NOT_STARTED | — |
| OGVPN-0061 | 61 | Verify app identifiers and package identifiers are consistent across release tooling. | NOT_STARTED | — |
| OGVPN-0062 | 62 | Verify version names and version codes are monotonic and correct. | NOT_STARTED | — |
| OGVPN-0063 | 63 | Verify build artifacts are generated for every required platform. | NOT_STARTED | — |
| OGVPN-0064 | 64 | Verify clean builds work without relying on stale local caches. | NOT_STARTED | — |
| OGVPN-0065 | 65 | Verify CI can reproduce the local release build. | NOT_STARTED | — |
| OGVPN-0066 | 66 | Verify the final artifacts can be installed and launched. | NOT_STARTED | — |
### 4. Environment & Configuration

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0067 | 67 | Verify development configuration. | NOT_STARTED | — |
| OGVPN-0068 | 68 | Verify test configuration. | NOT_STARTED | — |
| OGVPN-0069 | 69 | Verify staging configuration. | NOT_STARTED | — |
| OGVPN-0070 | 70 | Verify production configuration. | NOT_STARTED | — |
| OGVPN-0071 | 71 | Verify environment-specific API base URLs. | NOT_STARTED | — |
| OGVPN-0072 | 72 | Verify environment-specific WebSocket endpoints. | NOT_STARTED | — |
| OGVPN-0073 | 73 | Verify environment-specific authentication settings. | NOT_STARTED | — |
| OGVPN-0074 | 74 | Verify environment-specific billing configuration. | NOT_STARTED | — |
| OGVPN-0075 | 75 | Verify environment-specific VPN control-plane settings. | NOT_STARTED | — |
| OGVPN-0076 | 76 | Verify feature flags have safe defaults. | NOT_STARTED | — |
| OGVPN-0077 | 77 | Verify disabled features cannot be reached through stale UI. | NOT_STARTED | — |
| OGVPN-0078 | 78 | Verify enabled features are actually wired end-to-end. | NOT_STARTED | — |
| OGVPN-0079 | 79 | Verify configuration changes propagate to clients correctly. | NOT_STARTED | — |
| OGVPN-0080 | 80 | Verify invalid configuration produces actionable startup errors. | NOT_STARTED | — |
| OGVPN-0081 | 81 | Verify configuration secrets are loaded from secure storage. | NOT_STARTED | — |
| OGVPN-0082 | 82 | Verify client builds do not expose server secrets. | NOT_STARTED | — |
| OGVPN-0083 | 83 | Verify Android release configuration is separate from debug configuration. | NOT_STARTED | — |
| OGVPN-0084 | 84 | Verify Desktop release configuration is separate from development configuration. | NOT_STARTED | — |
| OGVPN-0085 | 85 | Verify extension release configuration is separate from development configuration. | NOT_STARTED | — |
| OGVPN-0086 | 86 | Verify web deployment configuration is correct. | NOT_STARTED | — |
| OGVPN-0087 | 87 | Verify rollback configuration remains available. | NOT_STARTED | — |
| OGVPN-0088 | 88 | Verify configuration documentation matches the actual runtime. | NOT_STARTED | — |
### 5. Web Authentication & Session

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0089 | 89 | Enter valid demo credentials and confirm the login request succeeds. | NOT_STARTED | — |
| OGVPN-0090 | 90 | Confirm a successful login transitions to the authenticated application state. | NOT_STARTED | — |
| OGVPN-0091 | 91 | Confirm the application does not redirect back to login after successful authentication. | NOT_STARTED | — |
| OGVPN-0092 | 92 | Confirm the auth guard and session provider agree that the session is valid. | NOT_STARTED | — |
| OGVPN-0093 | 93 | Confirm the token or session cookie is stored according to the chosen security model. | NOT_STARTED | — |
| OGVPN-0094 | 94 | Confirm session state survives the expected page refresh. | NOT_STARTED | — |
| OGVPN-0095 | 95 | Confirm session state survives the expected browser navigation. | NOT_STARTED | — |
| OGVPN-0096 | 96 | Confirm session state is restored correctly after reopening the application. | NOT_STARTED | — |
| OGVPN-0097 | 97 | Confirm an expired session redirects cleanly to authentication. | NOT_STARTED | — |
| OGVPN-0098 | 98 | Confirm logout clears every client-side session artifact. | NOT_STARTED | — |
| OGVPN-0099 | 99 | Confirm logout invalidates the server-side session when required. | NOT_STARTED | — |
| OGVPN-0100 | 100 | Confirm a stale auth state cannot display private data. | NOT_STARTED | — |
| OGVPN-0101 | 101 | Confirm concurrent tabs do not create contradictory authentication states. | NOT_STARTED | — |
| OGVPN-0102 | 102 | Confirm login failures show a clear actionable error. | NOT_STARTED | — |
| OGVPN-0103 | 103 | Confirm invalid credentials do not enter the authenticated state. | NOT_STARTED | — |
| OGVPN-0104 | 104 | Confirm network failure during login does not create a phantom session. | NOT_STARTED | — |
| OGVPN-0105 | 105 | Confirm timeout during login can be retried safely. | NOT_STARTED | — |
| OGVPN-0106 | 106 | Confirm double-clicking login does not create duplicate requests or inconsistent state. | NOT_STARTED | — |
| OGVPN-0107 | 107 | Confirm loading state always terminates. | NOT_STARTED | — |
| OGVPN-0108 | 108 | Confirm browser back/forward navigation cannot bypass authorization. | NOT_STARTED | — |
| OGVPN-0109 | 109 | Confirm protected API calls cannot be made anonymously. | NOT_STARTED | — |
| OGVPN-0110 | 110 | Confirm the demo account is clearly isolated from production accounts. | NOT_STARTED | — |
### 6. Web Authentication Extended

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0111 | 111 | Verify signup validation. | NOT_STARTED | — |
| OGVPN-0112 | 112 | Verify duplicate-account handling. | NOT_STARTED | — |
| OGVPN-0113 | 113 | Verify email verification flow if supported. | NOT_STARTED | — |
| OGVPN-0114 | 114 | Verify verification-token expiration. | NOT_STARTED | — |
| OGVPN-0115 | 115 | Verify verification resend behavior. | NOT_STARTED | — |
| OGVPN-0116 | 116 | Verify password reset request. | NOT_STARTED | — |
| OGVPN-0117 | 117 | Verify password reset token validation. | NOT_STARTED | — |
| OGVPN-0118 | 118 | Verify expired reset token handling. | NOT_STARTED | — |
| OGVPN-0119 | 119 | Verify password reset completion. | NOT_STARTED | — |
| OGVPN-0120 | 120 | Verify password strength feedback. | NOT_STARTED | — |
| OGVPN-0121 | 121 | Verify password confirmation mismatch handling. | NOT_STARTED | — |
| OGVPN-0122 | 122 | Verify MFA enrollment if supported. | NOT_STARTED | — |
| OGVPN-0123 | 123 | Verify MFA challenge. | NOT_STARTED | — |
| OGVPN-0124 | 124 | Verify invalid MFA code handling. | NOT_STARTED | — |
| OGVPN-0125 | 125 | Verify MFA recovery behavior. | NOT_STARTED | — |
| OGVPN-0126 | 126 | Verify session revocation. | NOT_STARTED | — |
| OGVPN-0127 | 127 | Verify active-session listing. | NOT_STARTED | — |
| OGVPN-0128 | 128 | Verify device/session logout. | NOT_STARTED | — |
| OGVPN-0129 | 129 | Verify account lockout or abuse controls. | NOT_STARTED | — |
| OGVPN-0130 | 130 | Verify rate limiting on authentication endpoints. | NOT_STARTED | — |
| OGVPN-0131 | 131 | Verify CSRF protections where cookie authentication is used. | NOT_STARTED | — |
| OGVPN-0132 | 132 | Verify authentication audit events. | NOT_STARTED | — |
### 7. Web Navigation & Shell

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0133 | 133 | Verify every primary navigation item reaches the correct screen. | NOT_STARTED | — |
| OGVPN-0134 | 134 | Verify every secondary navigation item reaches the correct screen. | NOT_STARTED | — |
| OGVPN-0135 | 135 | Verify active navigation state matches the current route. | NOT_STARTED | — |
| OGVPN-0136 | 136 | Verify browser refresh preserves the current route when allowed. | NOT_STARTED | — |
| OGVPN-0137 | 137 | Verify deep links open the correct screen. | NOT_STARTED | — |
| OGVPN-0138 | 138 | Verify unauthorized deep links redirect safely. | NOT_STARTED | — |
| OGVPN-0139 | 139 | Verify unknown routes show a useful not-found state. | NOT_STARTED | — |
| OGVPN-0140 | 140 | Verify navigation does not lose unsaved user input without warning. | NOT_STARTED | — |
| OGVPN-0141 | 141 | Verify back navigation follows the user's mental model. | NOT_STARTED | — |
| OGVPN-0142 | 142 | Verify forward navigation remains coherent. | NOT_STARTED | — |
| OGVPN-0143 | 143 | Verify desktop navigation and mobile navigation expose equivalent capabilities. | NOT_STARTED | — |
| OGVPN-0144 | 144 | Verify mobile menu closed state. | NOT_STARTED | — |
| OGVPN-0145 | 145 | Verify mobile menu opening state. | NOT_STARTED | — |
| OGVPN-0146 | 146 | Verify mobile menu fully open state. | NOT_STARTED | — |
| OGVPN-0147 | 147 | Verify mobile menu closing state. | NOT_STARTED | — |
| OGVPN-0148 | 148 | Verify mobile menu after-close state. | NOT_STARTED | — |
| OGVPN-0149 | 149 | Verify the mobile menu has a visible close control. | NOT_STARTED | — |
| OGVPN-0150 | 150 | Verify backdrop dismissal works where intended. | NOT_STARTED | — |
| OGVPN-0151 | 151 | Verify Escape closes the menu where supported. | NOT_STARTED | — |
| OGVPN-0152 | 152 | Verify focus moves into the open menu. | NOT_STARTED | — |
| OGVPN-0153 | 153 | Verify focus returns to the triggering control. | NOT_STARTED | — |
| OGVPN-0154 | 154 | Verify page scrolling is restored after menu close. | NOT_STARTED | — |
| OGVPN-0155 | 155 | Verify the menu cannot trap the page in an unusable scroll state. | NOT_STARTED | — |
### 8. Web Layout, Scroll & Responsive

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0156 | 156 | Test 320×568 viewport. | NOT_STARTED | — |
| OGVPN-0157 | 157 | Test 320×640 viewport. | NOT_STARTED | — |
| OGVPN-0158 | 158 | Test 390×844 viewport. | NOT_STARTED | — |
| OGVPN-0159 | 159 | Test 430×932 viewport. | NOT_STARTED | — |
| OGVPN-0160 | 160 | Test 768×1024 viewport. | NOT_STARTED | — |
| OGVPN-0161 | 161 | Test 1024×768 viewport. | NOT_STARTED | — |
| OGVPN-0162 | 162 | Test 1280×800 viewport. | NOT_STARTED | — |
| OGVPN-0163 | 163 | Test 1440×900 viewport. | NOT_STARTED | — |
| OGVPN-0164 | 164 | Test portrait orientation. | NOT_STARTED | — |
| OGVPN-0165 | 165 | Test landscape orientation. | NOT_STARTED | — |
| OGVPN-0166 | 166 | Test mobile browser URL-bar expansion. | NOT_STARTED | — |
| OGVPN-0167 | 167 | Test mobile browser URL-bar collapse. | NOT_STARTED | — |
| OGVPN-0168 | 168 | Test software keyboard opening. | NOT_STARTED | — |
| OGVPN-0169 | 169 | Test software keyboard closing. | NOT_STARTED | — |
| OGVPN-0170 | 170 | Test safe-area insets. | NOT_STARTED | — |
| OGVPN-0171 | 171 | Verify no accidental horizontal overflow. | NOT_STARTED | — |
| OGVPN-0172 | 172 | Verify every screen can scroll naturally when content exceeds the viewport. | NOT_STARTED | — |
| OGVPN-0173 | 173 | Verify scroll ownership is deterministic. | NOT_STARTED | — |
| OGVPN-0174 | 174 | Verify no nested scroll trap blocks essential content. | NOT_STARTED | — |
| OGVPN-0175 | 175 | Verify overlays contain their own scroll when needed. | NOT_STARTED | — |
| OGVPN-0176 | 176 | Verify closing an overlay restores background scrolling. | NOT_STARTED | — |
| OGVPN-0177 | 177 | Verify no content or control is permanently clipped. | NOT_STARTED | — |
### 9. Web Component Quality

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0178 | 178 | Verify every button has a real action. | NOT_STARTED | — |
| OGVPN-0179 | 179 | Verify every link has a valid destination. | NOT_STARTED | — |
| OGVPN-0180 | 180 | Verify every input has a label or accessible name. | NOT_STARTED | — |
| OGVPN-0181 | 181 | Verify every select has an accessible label. | NOT_STARTED | — |
| OGVPN-0182 | 182 | Verify every checkbox communicates checked state. | NOT_STARTED | — |
| OGVPN-0183 | 183 | Verify every switch communicates on/off state. | NOT_STARTED | — |
| OGVPN-0184 | 184 | Verify every tab communicates selected state. | NOT_STARTED | — |
| OGVPN-0185 | 185 | Verify every accordion communicates expanded state. | NOT_STARTED | — |
| OGVPN-0186 | 186 | Verify every dialog has a meaningful title. | NOT_STARTED | — |
| OGVPN-0187 | 187 | Verify every destructive action has appropriate confirmation. | NOT_STARTED | — |
| OGVPN-0188 | 188 | Verify every toast is understandable without relying on color. | NOT_STARTED | — |
| OGVPN-0189 | 189 | Verify every loading indicator has an accessible status. | NOT_STARTED | — |
| OGVPN-0190 | 190 | Verify every skeleton resolves into real content. | NOT_STARTED | — |
| OGVPN-0191 | 191 | Verify every empty state explains the next useful action. | NOT_STARTED | — |
| OGVPN-0192 | 192 | Verify every error state explains what happened and what to do. | NOT_STARTED | — |
| OGVPN-0193 | 193 | Verify disabled controls are disabled for a meaningful reason. | NOT_STARTED | — |
| OGVPN-0194 | 194 | Verify disabled controls do not appear interactive. | NOT_STARTED | — |
| OGVPN-0195 | 195 | Verify hover-only information has an alternative on touch. | NOT_STARTED | — |
| OGVPN-0196 | 196 | Verify tooltips do not hide essential information. | NOT_STARTED | — |
| OGVPN-0197 | 197 | Verify long labels wrap without breaking layout. | NOT_STARTED | — |
| OGVPN-0198 | 198 | Verify long URLs wrap or truncate safely. | NOT_STARTED | — |
| OGVPN-0199 | 199 | Verify unusual text does not break components. | NOT_STARTED | — |
| OGVPN-0200 | 200 | Verify all shared components behave consistently. | NOT_STARTED | — |
### 10. Web Dashboard

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0201 | 201 | Verify dashboard initial load. | NOT_STARTED | — |
| OGVPN-0202 | 202 | Verify dashboard loading state. | NOT_STARTED | — |
| OGVPN-0203 | 203 | Verify dashboard empty state. | NOT_STARTED | — |
| OGVPN-0204 | 204 | Verify dashboard stale-data state. | NOT_STARTED | — |
| OGVPN-0205 | 205 | Verify dashboard success state. | NOT_STARTED | — |
| OGVPN-0206 | 206 | Verify dashboard API failure state. | NOT_STARTED | — |
| OGVPN-0207 | 207 | Verify dashboard offline state. | NOT_STARTED | — |
| OGVPN-0208 | 208 | Verify dashboard retry behavior. | NOT_STARTED | — |
| OGVPN-0209 | 209 | Verify dashboard metrics match backend data. | NOT_STARTED | — |
| OGVPN-0210 | 210 | Verify dashboard connection status is current. | NOT_STARTED | — |
| OGVPN-0211 | 211 | Verify dashboard device count is current. | NOT_STARTED | — |
| OGVPN-0212 | 212 | Verify dashboard server information is current. | NOT_STARTED | — |
| OGVPN-0213 | 213 | Verify dashboard usage information is current. | NOT_STARTED | — |
| OGVPN-0214 | 214 | Verify dashboard subscription state is current. | NOT_STARTED | — |
| OGVPN-0215 | 215 | Verify dashboard notification state is current. | NOT_STARTED | — |
| OGVPN-0216 | 216 | Verify dashboard refresh behavior. | NOT_STARTED | — |
| OGVPN-0217 | 217 | Verify dashboard does not over-fetch unnecessarily. | NOT_STARTED | — |
| OGVPN-0218 | 218 | Verify dashboard handles slow API responses. | NOT_STARTED | — |
| OGVPN-0219 | 219 | Verify dashboard handles malformed API responses. | NOT_STARTED | — |
| OGVPN-0220 | 220 | Verify dashboard handles partial data. | NOT_STARTED | — |
| OGVPN-0221 | 221 | Verify dashboard remains usable with large datasets. | NOT_STARTED | — |
| OGVPN-0222 | 222 | Verify dashboard state remains coherent after logout/login. | NOT_STARTED | — |
### 11. Web Servers & Connection UI

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0223 | 223 | Verify server list loads. | NOT_STARTED | — |
| OGVPN-0224 | 224 | Verify server list empty state. | NOT_STARTED | — |
| OGVPN-0225 | 225 | Verify server list loading state. | NOT_STARTED | — |
| OGVPN-0226 | 226 | Verify server list error state. | NOT_STARTED | — |
| OGVPN-0227 | 227 | Verify server search. | NOT_STARTED | — |
| OGVPN-0228 | 228 | Verify server filtering. | NOT_STARTED | — |
| OGVPN-0229 | 229 | Verify server sorting. | NOT_STARTED | — |
| OGVPN-0230 | 230 | Verify server favorites. | NOT_STARTED | — |
| OGVPN-0231 | 231 | Verify favorite persistence. | NOT_STARTED | — |
| OGVPN-0232 | 232 | Verify unavailable-server presentation. | NOT_STARTED | — |
| OGVPN-0233 | 233 | Verify server status freshness. | NOT_STARTED | — |
| OGVPN-0234 | 234 | Verify server metadata correctness. | NOT_STARTED | — |
| OGVPN-0235 | 235 | Verify connection action starts exactly once. | NOT_STARTED | — |
| OGVPN-0236 | 236 | Verify connection action shows progress. | NOT_STARTED | — |
| OGVPN-0237 | 237 | Verify connection success updates UI. | NOT_STARTED | — |
| OGVPN-0238 | 238 | Verify connection failure updates UI. | NOT_STARTED | — |
| OGVPN-0239 | 239 | Verify connection timeout updates UI. | NOT_STARTED | — |
| OGVPN-0240 | 240 | Verify connection cancellation works. | NOT_STARTED | — |
| OGVPN-0241 | 241 | Verify disconnect action works. | NOT_STARTED | — |
| OGVPN-0242 | 242 | Verify repeated connect/disconnect actions cannot race into a wrong final state. | NOT_STARTED | — |
| OGVPN-0243 | 243 | Verify connection state remains correct after refresh. | NOT_STARTED | — |
| OGVPN-0244 | 244 | Verify connection state remains correct after network interruption. | NOT_STARTED | — |
| OGVPN-0245 | 245 | Verify connection state matches the actual VPN control-plane state. | NOT_STARTED | — |
### 12. Web Devices

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0246 | 246 | Verify device list. | NOT_STARTED | — |
| OGVPN-0247 | 247 | Verify device empty state. | NOT_STARTED | — |
| OGVPN-0248 | 248 | Verify device loading state. | NOT_STARTED | — |
| OGVPN-0249 | 249 | Verify device error state. | NOT_STARTED | — |
| OGVPN-0250 | 250 | Verify device details. | NOT_STARTED | — |
| OGVPN-0251 | 251 | Verify device naming. | NOT_STARTED | — |
| OGVPN-0252 | 252 | Verify device rename validation. | NOT_STARTED | — |
| OGVPN-0253 | 253 | Verify device deletion confirmation. | NOT_STARTED | — |
| OGVPN-0254 | 254 | Verify device deletion success. | NOT_STARTED | — |
| OGVPN-0255 | 255 | Verify device deletion failure. | NOT_STARTED | — |
| OGVPN-0256 | 256 | Verify device configuration retrieval. | NOT_STARTED | — |
| OGVPN-0257 | 257 | Verify configuration download. | NOT_STARTED | — |
| OGVPN-0258 | 258 | Verify expired configuration handling. | NOT_STARTED | — |
| OGVPN-0259 | 259 | Verify device status freshness. | NOT_STARTED | — |
| OGVPN-0260 | 260 | Verify current-device identification. | NOT_STARTED | — |
| OGVPN-0261 | 261 | Verify multi-device limits. | NOT_STARTED | — |
| OGVPN-0262 | 262 | Verify device limit messaging. | NOT_STARTED | — |
| OGVPN-0263 | 263 | Verify revoked-device behavior. | NOT_STARTED | — |
| OGVPN-0264 | 264 | Verify a revoked device cannot reconnect using stale credentials. | NOT_STARTED | — |
| OGVPN-0265 | 265 | Verify device list refresh. | NOT_STARTED | — |
| OGVPN-0266 | 266 | Verify device state consistency across tabs. | NOT_STARTED | — |
| OGVPN-0267 | 267 | Verify device state consistency across platforms. | NOT_STARTED | — |
### 13. Web Billing & Entitlements

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0268 | 268 | Verify current plan display. | NOT_STARTED | — |
| OGVPN-0269 | 269 | Verify trial state. | NOT_STARTED | — |
| OGVPN-0270 | 270 | Verify active subscription state. | NOT_STARTED | — |
| OGVPN-0271 | 271 | Verify canceled subscription state. | NOT_STARTED | — |
| OGVPN-0272 | 272 | Verify past-due state. | NOT_STARTED | — |
| OGVPN-0273 | 273 | Verify expired state. | NOT_STARTED | — |
| OGVPN-0274 | 274 | Verify upgrade flow. | NOT_STARTED | — |
| OGVPN-0275 | 275 | Verify downgrade flow. | NOT_STARTED | — |
| OGVPN-0276 | 276 | Verify cancellation flow. | NOT_STARTED | — |
| OGVPN-0277 | 277 | Verify renewal state. | NOT_STARTED | — |
| OGVPN-0278 | 278 | Verify payment failure state. | NOT_STARTED | — |
| OGVPN-0279 | 279 | Verify webhook-driven entitlement changes. | NOT_STARTED | — |
| OGVPN-0280 | 280 | Verify duplicate webhook handling. | NOT_STARTED | — |
| OGVPN-0281 | 281 | Verify delayed webhook handling. | NOT_STARTED | — |
| OGVPN-0282 | 282 | Verify entitlement refresh. | NOT_STARTED | — |
| OGVPN-0283 | 283 | Verify premium feature access. | NOT_STARTED | — |
| OGVPN-0284 | 284 | Verify premium denial. | NOT_STARTED | — |
| OGVPN-0285 | 285 | Verify limits are enforced server-side. | NOT_STARTED | — |
| OGVPN-0286 | 286 | Verify incomplete user progress survives upgrade. | NOT_STARTED | — |
| OGVPN-0287 | 287 | Verify billing UI never claims payment succeeded before confirmation. | NOT_STARTED | — |
| OGVPN-0288 | 288 | Verify billing errors are actionable. | NOT_STARTED | — |
| OGVPN-0289 | 289 | Verify billing history where supported. | NOT_STARTED | — |
### 14. Web Settings & Account

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0290 | 290 | Verify profile loading. | NOT_STARTED | — |
| OGVPN-0291 | 291 | Verify profile editing. | NOT_STARTED | — |
| OGVPN-0292 | 292 | Verify profile validation. | NOT_STARTED | — |
| OGVPN-0293 | 293 | Verify settings save. | NOT_STARTED | — |
| OGVPN-0294 | 294 | Verify settings save loading state. | NOT_STARTED | — |
| OGVPN-0295 | 295 | Verify settings save success state. | NOT_STARTED | — |
| OGVPN-0296 | 296 | Verify settings save failure state. | NOT_STARTED | — |
| OGVPN-0297 | 297 | Verify VPN settings retrieval. | NOT_STARTED | — |
| OGVPN-0298 | 298 | Verify VPN settings update. | NOT_STARTED | — |
| OGVPN-0299 | 299 | Verify notification preferences. | NOT_STARTED | — |
| OGVPN-0300 | 300 | Verify privacy preferences. | NOT_STARTED | — |
| OGVPN-0301 | 301 | Verify session settings. | NOT_STARTED | — |
| OGVPN-0302 | 302 | Verify account deletion confirmation. | NOT_STARTED | — |
| OGVPN-0303 | 303 | Verify account deletion execution. | NOT_STARTED | — |
| OGVPN-0304 | 304 | Verify account deletion failure recovery. | NOT_STARTED | — |
| OGVPN-0305 | 305 | Verify settings persist after refresh. | NOT_STARTED | — |
| OGVPN-0306 | 306 | Verify settings persist across devices when intended. | NOT_STARTED | — |
| OGVPN-0307 | 307 | Verify stale settings do not overwrite newer settings. | NOT_STARTED | — |
| OGVPN-0308 | 308 | Verify unsaved changes are preserved appropriately. | NOT_STARTED | — |
| OGVPN-0309 | 309 | Verify destructive settings require appropriate confirmation. | NOT_STARTED | — |
| OGVPN-0310 | 310 | Verify settings are accessible by keyboard. | NOT_STARTED | — |
| OGVPN-0311 | 311 | Verify settings are accessible with assistive technology. | NOT_STARTED | — |
### 15. Web Support & Notifications

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0312 | 312 | Verify notification list. | NOT_STARTED | — |
| OGVPN-0313 | 313 | Verify unread count. | NOT_STARTED | — |
| OGVPN-0314 | 314 | Verify mark-read action. | NOT_STARTED | — |
| OGVPN-0315 | 315 | Verify mark-all-read action. | NOT_STARTED | — |
| OGVPN-0316 | 316 | Verify notification failure handling. | NOT_STARTED | — |
| OGVPN-0317 | 317 | Verify notification preferences. | NOT_STARTED | — |
| OGVPN-0318 | 318 | Verify support ticket creation. | NOT_STARTED | — |
| OGVPN-0319 | 319 | Verify support ticket validation. | NOT_STARTED | — |
| OGVPN-0320 | 320 | Verify support ticket loading. | NOT_STARTED | — |
| OGVPN-0321 | 321 | Verify support ticket success. | NOT_STARTED | — |
| OGVPN-0322 | 322 | Verify support ticket failure. | NOT_STARTED | — |
| OGVPN-0323 | 323 | Verify ticket list. | NOT_STARTED | — |
| OGVPN-0324 | 324 | Verify ticket detail. | NOT_STARTED | — |
| OGVPN-0325 | 325 | Verify ticket reply. | NOT_STARTED | — |
| OGVPN-0326 | 326 | Verify ticket reply duplicate protection. | NOT_STARTED | — |
| OGVPN-0327 | 327 | Verify knowledge-base listing. | NOT_STARTED | — |
| OGVPN-0328 | 328 | Verify knowledge-base search. | NOT_STARTED | — |
| OGVPN-0329 | 329 | Verify knowledge-base detail. | NOT_STARTED | — |
| OGVPN-0330 | 330 | Verify unavailable article handling. | NOT_STARTED | — |
| OGVPN-0331 | 331 | Verify support links open correctly. | NOT_STARTED | — |
| OGVPN-0332 | 332 | Verify notification state synchronizes across sessions. | NOT_STARTED | — |
| OGVPN-0333 | 333 | Verify notification state does not leak between accounts. | NOT_STARTED | — |
| OGVPN-0334 | 334 | Verify support data is authorized per account. | NOT_STARTED | — |
### 16. Android Project Creation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0335 | 335 | Create a real Android project if no Android source exists. | NOT_STARTED | — |
| OGVPN-0336 | 336 | Use a maintainable native Android architecture appropriate to the product. | NOT_STARTED | — |
| OGVPN-0337 | 337 | Configure the real application ID. | NOT_STARTED | — |
| OGVPN-0338 | 338 | Configure release and debug build variants. | NOT_STARTED | — |
| OGVPN-0339 | 339 | Configure signing infrastructure without committing private signing secrets. | NOT_STARTED | — |
| OGVPN-0340 | 340 | Configure minimum and target Android SDK versions intentionally. | NOT_STARTED | — |
| OGVPN-0341 | 341 | Configure dependency management and lock versions. | NOT_STARTED | — |
| OGVPN-0342 | 342 | Configure network security correctly. | NOT_STARTED | — |
| OGVPN-0343 | 343 | Configure secure API base URLs. | NOT_STARTED | — |
| OGVPN-0344 | 344 | Configure release logging policy. | NOT_STARTED | — |
| OGVPN-0345 | 345 | Configure crash reporting policy if used. | NOT_STARTED | — |
| OGVPN-0346 | 346 | Configure app startup. | NOT_STARTED | — |
| OGVPN-0347 | 347 | Configure application lifecycle handling. | NOT_STARTED | — |
| OGVPN-0348 | 348 | Configure navigation architecture. | NOT_STARTED | — |
| OGVPN-0349 | 349 | Configure persistent session storage. | NOT_STARTED | — |
| OGVPN-0350 | 350 | Configure secure secret/token storage. | NOT_STARTED | — |
| OGVPN-0351 | 351 | Configure background execution strategy. | NOT_STARTED | — |
| OGVPN-0352 | 352 | Configure VPN service integration. | NOT_STARTED | — |
| OGVPN-0353 | 353 | Configure notification channels where required. | NOT_STARTED | — |
| OGVPN-0354 | 354 | Configure deep links/app links. | NOT_STARTED | — |
| OGVPN-0355 | 355 | Build a clean release APK/AAB successfully. | NOT_STARTED | — |
### 17. Android Authentication

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0356 | 356 | Verify first launch. | NOT_STARTED | — |
| OGVPN-0357 | 357 | Verify login screen. | NOT_STARTED | — |
| OGVPN-0358 | 358 | Verify valid login. | NOT_STARTED | — |
| OGVPN-0359 | 359 | Verify invalid login. | NOT_STARTED | — |
| OGVPN-0360 | 360 | Verify empty credential validation. | NOT_STARTED | — |
| OGVPN-0361 | 361 | Verify keyboard behavior. | NOT_STARTED | — |
| OGVPN-0362 | 362 | Verify autofill behavior where supported. | NOT_STARTED | — |
| OGVPN-0363 | 363 | Verify login loading state. | NOT_STARTED | — |
| OGVPN-0364 | 364 | Verify login timeout. | NOT_STARTED | — |
| OGVPN-0365 | 365 | Verify login network failure. | NOT_STARTED | — |
| OGVPN-0366 | 366 | Verify login server failure. | NOT_STARTED | — |
| OGVPN-0367 | 367 | Verify successful login persists. | NOT_STARTED | — |
| OGVPN-0368 | 368 | Verify app restart restores the expected session. | NOT_STARTED | — |
| OGVPN-0369 | 369 | Verify session expiry redirects correctly. | NOT_STARTED | — |
| OGVPN-0370 | 370 | Verify logout clears local session state. | NOT_STARTED | — |
| OGVPN-0371 | 371 | Verify logout invalidates remote session where required. | NOT_STARTED | — |
| OGVPN-0372 | 372 | Verify back navigation does not bypass auth. | NOT_STARTED | — |
| OGVPN-0373 | 373 | Verify deep link while logged out. | NOT_STARTED | — |
| OGVPN-0374 | 374 | Verify deep link while logged in. | NOT_STARTED | — |
| OGVPN-0375 | 375 | Verify duplicate login taps are safe. | NOT_STARTED | — |
| OGVPN-0376 | 376 | Verify authentication errors are human-readable. | NOT_STARTED | — |
| OGVPN-0377 | 377 | Verify no auth token is exposed in logs. | NOT_STARTED | — |
### 18. Android Navigation & UI

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0378 | 378 | Verify every Android screen exists and is reachable. | NOT_STARTED | — |
| OGVPN-0379 | 379 | Verify every navigation action works. | NOT_STARTED | — |
| OGVPN-0380 | 380 | Verify system back behavior. | NOT_STARTED | — |
| OGVPN-0381 | 381 | Verify toolbar back behavior. | NOT_STARTED | — |
| OGVPN-0382 | 382 | Verify bottom navigation if used. | NOT_STARTED | — |
| OGVPN-0383 | 383 | Verify drawer navigation if used. | NOT_STARTED | — |
| OGVPN-0384 | 384 | Verify dialog navigation. | NOT_STARTED | — |
| OGVPN-0385 | 385 | Verify modal dismissal. | NOT_STARTED | — |
| OGVPN-0386 | 386 | Verify state restoration after rotation where applicable. | NOT_STARTED | — |
| OGVPN-0387 | 387 | Verify state restoration after process recreation where applicable. | NOT_STARTED | — |
| OGVPN-0388 | 388 | Verify keyboard does not cover critical controls. | NOT_STARTED | — |
| OGVPN-0389 | 389 | Verify content resizes or scrolls when the keyboard opens. | NOT_STARTED | — |
| OGVPN-0390 | 390 | Verify edge-to-edge behavior. | NOT_STARTED | — |
| OGVPN-0391 | 391 | Verify system-bar handling. | NOT_STARTED | — |
| OGVPN-0392 | 392 | Verify gesture navigation compatibility. | NOT_STARTED | — |
| OGVPN-0393 | 393 | Verify touch targets are practical and accessible. | NOT_STARTED | — |
| OGVPN-0394 | 394 | Verify long text wrapping. | NOT_STARTED | — |
| OGVPN-0395 | 395 | Verify long URLs wrapping. | NOT_STARTED | — |
| OGVPN-0396 | 396 | Verify empty states. | NOT_STARTED | — |
| OGVPN-0397 | 397 | Verify loading states. | NOT_STARTED | — |
| OGVPN-0398 | 398 | Verify error states. | NOT_STARTED | — |
| OGVPN-0399 | 399 | Verify offline states. | NOT_STARTED | — |
| OGVPN-0400 | 400 | Verify disabled states. | NOT_STARTED | — |
### 19. Android Dashboard & Core Features

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0401 | 401 | Verify Android dashboard data matches the backend. | NOT_STARTED | — |
| OGVPN-0402 | 402 | Verify dashboard loading. | NOT_STARTED | — |
| OGVPN-0403 | 403 | Verify dashboard empty state. | NOT_STARTED | — |
| OGVPN-0404 | 404 | Verify dashboard error. | NOT_STARTED | — |
| OGVPN-0405 | 405 | Verify dashboard offline behavior. | NOT_STARTED | — |
| OGVPN-0406 | 406 | Verify refresh. | NOT_STARTED | — |
| OGVPN-0407 | 407 | Verify server list. | NOT_STARTED | — |
| OGVPN-0408 | 408 | Verify server search. | NOT_STARTED | — |
| OGVPN-0409 | 409 | Verify server filtering. | NOT_STARTED | — |
| OGVPN-0410 | 410 | Verify favorites. | NOT_STARTED | — |
| OGVPN-0411 | 411 | Verify device list. | NOT_STARTED | — |
| OGVPN-0412 | 412 | Verify device details. | NOT_STARTED | — |
| OGVPN-0413 | 413 | Verify usage display. | NOT_STARTED | — |
| OGVPN-0414 | 414 | Verify subscription display. | NOT_STARTED | — |
| OGVPN-0415 | 415 | Verify notifications. | NOT_STARTED | — |
| OGVPN-0416 | 416 | Verify support access. | NOT_STARTED | — |
| OGVPN-0417 | 417 | Verify settings. | NOT_STARTED | — |
| OGVPN-0418 | 418 | Verify account information. | NOT_STARTED | — |
| OGVPN-0419 | 419 | Verify connection status. | NOT_STARTED | — |
| OGVPN-0420 | 420 | Verify connection action. | NOT_STARTED | — |
| OGVPN-0421 | 421 | Verify disconnect action. | NOT_STARTED | — |
| OGVPN-0422 | 422 | Verify all dashboard actions have real implementations. | NOT_STARTED | — |
### 20. Android VPN Service

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0423 | 423 | Implement the actual Android VPN service rather than a simulated connection state. | NOT_STARTED | — |
| OGVPN-0424 | 424 | Request VPN permission correctly. | NOT_STARTED | — |
| OGVPN-0425 | 425 | Handle VPN permission denial. | NOT_STARTED | — |
| OGVPN-0426 | 426 | Handle VPN permission cancellation. | NOT_STARTED | — |
| OGVPN-0427 | 427 | Handle VPN permission revocation. | NOT_STARTED | — |
| OGVPN-0428 | 428 | Start the VPN service only after required authorization. | NOT_STARTED | — |
| OGVPN-0429 | 429 | Stop the VPN service reliably. | NOT_STARTED | — |
| OGVPN-0430 | 430 | Report connection state from the actual service. | NOT_STARTED | — |
| OGVPN-0431 | 431 | Handle service startup failure. | NOT_STARTED | — |
| OGVPN-0432 | 432 | Handle service teardown. | NOT_STARTED | — |
| OGVPN-0433 | 433 | Handle configuration parsing failure. | NOT_STARTED | — |
| OGVPN-0434 | 434 | Handle missing configuration. | NOT_STARTED | — |
| OGVPN-0435 | 435 | Handle expired configuration. | NOT_STARTED | — |
| OGVPN-0436 | 436 | Handle revoked configuration. | NOT_STARTED | — |
| OGVPN-0437 | 437 | Handle invalid server endpoint. | NOT_STARTED | — |
| OGVPN-0438 | 438 | Handle tunnel handshake failure. | NOT_STARTED | — |
| OGVPN-0439 | 439 | Handle tunnel interruption. | NOT_STARTED | — |
| OGVPN-0440 | 440 | Handle tunnel recovery. | NOT_STARTED | — |
| OGVPN-0441 | 441 | Prevent duplicate tunnel instances. | NOT_STARTED | — |
| OGVPN-0442 | 442 | Prevent stale UI from claiming the tunnel is connected. | NOT_STARTED | — |
| OGVPN-0443 | 443 | Persist only the minimum required VPN state. | NOT_STARTED | — |
| OGVPN-0444 | 444 | Verify the VPN service survives expected lifecycle transitions. | NOT_STARTED | — |
### 21. Android Network Resilience

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0445 | 445 | Switch Wi-Fi to mobile data during connection. | NOT_STARTED | — |
| OGVPN-0446 | 446 | Switch mobile data to Wi-Fi during connection. | NOT_STARTED | — |
| OGVPN-0447 | 447 | Disable network during handshake. | NOT_STARTED | — |
| OGVPN-0448 | 448 | Restore network during handshake. | NOT_STARTED | — |
| OGVPN-0449 | 449 | Disable network while connected. | NOT_STARTED | — |
| OGVPN-0450 | 450 | Restore network while connected. | NOT_STARTED | — |
| OGVPN-0451 | 451 | Change networks while reconnecting. | NOT_STARTED | — |
| OGVPN-0452 | 452 | Test captive portal conditions. | NOT_STARTED | — |
| OGVPN-0453 | 453 | Test airplane mode. | NOT_STARTED | — |
| OGVPN-0454 | 454 | Test airplane mode recovery. | NOT_STARTED | — |
| OGVPN-0455 | 455 | Test weak Wi-Fi. | NOT_STARTED | — |
| OGVPN-0456 | 456 | Test high latency. | NOT_STARTED | — |
| OGVPN-0457 | 457 | Test packet loss. | NOT_STARTED | — |
| OGVPN-0458 | 458 | Test DNS failure. | NOT_STARTED | — |
| OGVPN-0459 | 459 | Test server timeout. | NOT_STARTED | — |
| OGVPN-0460 | 460 | Test server rejection. | NOT_STARTED | — |
| OGVPN-0461 | 461 | Test app backgrounding. | NOT_STARTED | — |
| OGVPN-0462 | 462 | Test app foregrounding. | NOT_STARTED | — |
| OGVPN-0463 | 463 | Test device sleep. | NOT_STARTED | — |
| OGVPN-0464 | 464 | Test device wake. | NOT_STARTED | — |
| OGVPN-0465 | 465 | Verify reconnect behavior is bounded and non-looping. | NOT_STARTED | — |
| OGVPN-0466 | 466 | Verify UI accurately reflects every network transition. | NOT_STARTED | — |
### 22. Android Kill Switch & Routing

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0467 | 467 | Verify kill-switch configuration. | NOT_STARTED | — |
| OGVPN-0468 | 468 | Verify kill-switch enablement. | NOT_STARTED | — |
| OGVPN-0469 | 469 | Verify kill-switch disablement. | NOT_STARTED | — |
| OGVPN-0470 | 470 | Verify traffic behavior during tunnel startup. | NOT_STARTED | — |
| OGVPN-0471 | 471 | Verify traffic behavior during tunnel shutdown. | NOT_STARTED | — |
| OGVPN-0472 | 472 | Verify traffic behavior after tunnel failure. | NOT_STARTED | — |
| OGVPN-0473 | 473 | Verify recovery after tunnel restoration. | NOT_STARTED | — |
| OGVPN-0474 | 474 | Verify IPv4 routing. | NOT_STARTED | — |
| OGVPN-0475 | 475 | Verify IPv6 routing. | NOT_STARTED | — |
| OGVPN-0476 | 476 | Verify DNS routing. | NOT_STARTED | — |
| OGVPN-0477 | 477 | Verify route exclusions where supported. | NOT_STARTED | — |
| OGVPN-0478 | 478 | Verify LAN access behavior according to settings. | NOT_STARTED | — |
| OGVPN-0479 | 479 | Verify split tunneling configuration. | NOT_STARTED | — |
| OGVPN-0480 | 480 | Verify per-app inclusion. | NOT_STARTED | — |
| OGVPN-0481 | 481 | Verify per-app exclusion. | NOT_STARTED | — |
| OGVPN-0482 | 482 | Verify invalid package handling. | NOT_STARTED | — |
| OGVPN-0483 | 483 | Verify route changes do not leave stale routes. | NOT_STARTED | — |
| OGVPN-0484 | 484 | Verify duplicate routes are avoided. | NOT_STARTED | — |
| OGVPN-0485 | 485 | Verify reboot behavior. | NOT_STARTED | — |
| OGVPN-0486 | 486 | Verify VPN state after app update. | NOT_STARTED | — |
| OGVPN-0487 | 487 | Verify VPN state after service restart. | NOT_STARTED | — |
| OGVPN-0488 | 488 | Verify no accidental traffic leak during transitions. | NOT_STARTED | — |
### 23. Android Background, Permissions & Notifications

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0489 | 489 | Verify notification permission handling on supported Android versions. | NOT_STARTED | — |
| OGVPN-0490 | 490 | Verify notification denial handling. | NOT_STARTED | — |
| OGVPN-0491 | 491 | Verify VPN foreground-service requirements. | NOT_STARTED | — |
| OGVPN-0492 | 492 | Verify foreground-service notification content. | NOT_STARTED | — |
| OGVPN-0493 | 493 | Verify notification tap navigation. | NOT_STARTED | — |
| OGVPN-0494 | 494 | Verify notification dismissal. | NOT_STARTED | — |
| OGVPN-0495 | 495 | Verify background connection behavior. | NOT_STARTED | — |
| OGVPN-0496 | 496 | Verify battery-optimization interactions. | NOT_STARTED | — |
| OGVPN-0497 | 497 | Verify background restrictions. | NOT_STARTED | — |
| OGVPN-0498 | 498 | Verify app standby behavior. | NOT_STARTED | — |
| OGVPN-0499 | 499 | Verify service restart behavior. | NOT_STARTED | — |
| OGVPN-0500 | 500 | Verify process death recovery. | NOT_STARTED | — |
| OGVPN-0501 | 501 | Verify boot behavior if supported. | NOT_STARTED | — |
| OGVPN-0502 | 502 | Verify user-disabled background behavior. | NOT_STARTED | — |
| OGVPN-0503 | 503 | Verify permission changes from system settings. | NOT_STARTED | — |
| OGVPN-0504 | 504 | Verify notification channels. | NOT_STARTED | — |
| OGVPN-0505 | 505 | Verify notification importance. | NOT_STARTED | — |
| OGVPN-0506 | 506 | Verify sensitive information is not unnecessarily exposed in notifications. | NOT_STARTED | — |
| OGVPN-0507 | 507 | Verify notifications do not duplicate. | NOT_STARTED | — |
| OGVPN-0508 | 508 | Verify notifications do not become stale. | NOT_STARTED | — |
| OGVPN-0509 | 509 | Verify background failures are recoverable. | NOT_STARTED | — |
| OGVPN-0510 | 510 | Verify background behavior is documented in-app when necessary. | NOT_STARTED | — |
### 24. Android Device Matrix

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0511 | 511 | Test at least one low-memory device. | NOT_STARTED | — |
| OGVPN-0512 | 512 | Test at least one mid-range device. | NOT_STARTED | — |
| OGVPN-0513 | 513 | Test at least one high-end device. | NOT_STARTED | — |
| OGVPN-0514 | 514 | Test Android 10 where supported. | NOT_STARTED | — |
| OGVPN-0515 | 515 | Test Android 11 where supported. | NOT_STARTED | — |
| OGVPN-0516 | 516 | Test Android 12 where supported. | NOT_STARTED | — |
| OGVPN-0517 | 517 | Test Android 13 where supported. | NOT_STARTED | — |
| OGVPN-0518 | 518 | Test Android 14 where supported. | NOT_STARTED | — |
| OGVPN-0519 | 519 | Test Android 15 where supported. | NOT_STARTED | — |
| OGVPN-0520 | 520 | Test Android 16 where supported. | NOT_STARTED | — |
| OGVPN-0521 | 521 | Test small screen. | NOT_STARTED | — |
| OGVPN-0522 | 522 | Test large screen. | NOT_STARTED | — |
| OGVPN-0523 | 523 | Test portrait. | NOT_STARTED | — |
| OGVPN-0524 | 524 | Test landscape. | NOT_STARTED | — |
| OGVPN-0525 | 525 | Test gesture navigation. | NOT_STARTED | — |
| OGVPN-0526 | 526 | Test three-button navigation where available. | NOT_STARTED | — |
| OGVPN-0527 | 527 | Test physical keyboard if relevant. | NOT_STARTED | — |
| OGVPN-0528 | 528 | Test software keyboard. | NOT_STARTED | — |
| OGVPN-0529 | 529 | Test dark/system appearance if supported. | NOT_STARTED | — |
| OGVPN-0530 | 530 | Test font scaling. | NOT_STARTED | — |
| OGVPN-0531 | 531 | Test accessibility services. | NOT_STARTED | — |
| OGVPN-0532 | 532 | Test clean install and upgrade. | NOT_STARTED | — |
| OGVPN-0533 | 533 | Test uninstall/reinstall account behavior. | NOT_STARTED | — |
### 25. Android Security & Storage

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0534 | 534 | Verify secrets are not hardcoded. | NOT_STARTED | — |
| OGVPN-0535 | 535 | Verify tokens are stored securely. | NOT_STARTED | — |
| OGVPN-0536 | 536 | Verify sensitive logs are removed from release builds. | NOT_STARTED | — |
| OGVPN-0537 | 537 | Verify screenshots are handled according to the privacy policy. | NOT_STARTED | — |
| OGVPN-0538 | 538 | Verify backup behavior for sensitive data. | NOT_STARTED | — |
| OGVPN-0539 | 539 | Verify exported activities are intentional. | NOT_STARTED | — |
| OGVPN-0540 | 540 | Verify exported services are intentional. | NOT_STARTED | — |
| OGVPN-0541 | 541 | Verify exported receivers are intentional. | NOT_STARTED | — |
| OGVPN-0542 | 542 | Verify deep links validate inputs. | NOT_STARTED | — |
| OGVPN-0543 | 543 | Verify WebView use is minimized and hardened if present. | NOT_STARTED | — |
| OGVPN-0544 | 544 | Verify certificate validation. | NOT_STARTED | — |
| OGVPN-0545 | 545 | Verify TLS configuration. | NOT_STARTED | — |
| OGVPN-0546 | 546 | Verify network traffic does not expose credentials. | NOT_STARTED | — |
| OGVPN-0547 | 547 | Verify local database access controls. | NOT_STARTED | — |
| OGVPN-0548 | 548 | Verify cache does not contain unnecessary secrets. | NOT_STARTED | — |
| OGVPN-0549 | 549 | Verify logout clears sensitive local state. | NOT_STARTED | — |
| OGVPN-0550 | 550 | Verify account deletion clears local account data. | NOT_STARTED | — |
| OGVPN-0551 | 551 | Verify revoked credentials cannot be reused. | NOT_STARTED | — |
| OGVPN-0552 | 552 | Verify stale VPN configurations are rejected. | NOT_STARTED | — |
| OGVPN-0553 | 553 | Verify tampered configuration files are rejected. | NOT_STARTED | — |
| OGVPN-0554 | 554 | Verify release manifest permissions are minimal. | NOT_STARTED | — |
| OGVPN-0555 | 555 | Verify dependency vulnerabilities are reviewed. | NOT_STARTED | — |
### 26. Desktop Project Creation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0556 | 556 | Create a real desktop application if no desktop source exists. | NOT_STARTED | — |
| OGVPN-0557 | 557 | Select a maintainable desktop framework appropriate to the product. | NOT_STARTED | — |
| OGVPN-0558 | 558 | Configure desktop application identity. | NOT_STARTED | — |
| OGVPN-0559 | 559 | Configure development and release builds. | NOT_STARTED | — |
| OGVPN-0560 | 560 | Configure platform packaging. | NOT_STARTED | — |
| OGVPN-0561 | 561 | Configure update mechanism. | NOT_STARTED | — |
| OGVPN-0562 | 562 | Configure secure API endpoints. | NOT_STARTED | — |
| OGVPN-0563 | 563 | Configure secure local storage. | NOT_STARTED | — |
| OGVPN-0564 | 564 | Configure logging policy. | NOT_STARTED | — |
| OGVPN-0565 | 565 | Configure crash handling. | NOT_STARTED | — |
| OGVPN-0566 | 566 | Configure startup behavior. | NOT_STARTED | — |
| OGVPN-0567 | 567 | Configure tray/menu-bar behavior if required. | NOT_STARTED | — |
| OGVPN-0568 | 568 | Configure native network/VPN integration. | NOT_STARTED | — |
| OGVPN-0569 | 569 | Configure deep links. | NOT_STARTED | — |
| OGVPN-0570 | 570 | Configure protocol/file associations where needed. | NOT_STARTED | — |
| OGVPN-0571 | 571 | Configure installer metadata. | NOT_STARTED | — |
| OGVPN-0572 | 572 | Configure uninstall behavior. | NOT_STARTED | — |
| OGVPN-0573 | 573 | Configure code signing strategy. | NOT_STARTED | — |
| OGVPN-0574 | 574 | Configure release artifacts for supported desktop operating systems. | NOT_STARTED | — |
| OGVPN-0575 | 575 | Verify clean installation. | NOT_STARTED | — |
| OGVPN-0576 | 576 | Verify clean uninstallation. | NOT_STARTED | — |
| OGVPN-0577 | 577 | Verify a release build launches successfully. | NOT_STARTED | — |
### 27. Desktop Authentication & Navigation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0578 | 578 | Verify desktop login. | NOT_STARTED | — |
| OGVPN-0579 | 579 | Verify invalid credentials. | NOT_STARTED | — |
| OGVPN-0580 | 580 | Verify network failure. | NOT_STARTED | — |
| OGVPN-0581 | 581 | Verify session persistence. | NOT_STARTED | — |
| OGVPN-0582 | 582 | Verify session expiry. | NOT_STARTED | — |
| OGVPN-0583 | 583 | Verify logout. | NOT_STARTED | — |
| OGVPN-0584 | 584 | Verify deep link while logged out. | NOT_STARTED | — |
| OGVPN-0585 | 585 | Verify deep link while logged in. | NOT_STARTED | — |
| OGVPN-0586 | 586 | Verify app restart. | NOT_STARTED | — |
| OGVPN-0587 | 587 | Verify OS sleep/resume. | NOT_STARTED | — |
| OGVPN-0588 | 588 | Verify navigation history. | NOT_STARTED | — |
| OGVPN-0589 | 589 | Verify window close/reopen. | NOT_STARTED | — |
| OGVPN-0590 | 590 | Verify multiple windows if supported. | NOT_STARTED | — |
| OGVPN-0591 | 591 | Verify duplicate actions. | NOT_STARTED | — |
| OGVPN-0592 | 592 | Verify keyboard shortcuts where supported. | NOT_STARTED | — |
| OGVPN-0593 | 593 | Verify focus order. | NOT_STARTED | — |
| OGVPN-0594 | 594 | Verify dialogs. | NOT_STARTED | — |
| OGVPN-0595 | 595 | Verify error messages. | NOT_STARTED | — |
| OGVPN-0596 | 596 | Verify loading states. | NOT_STARTED | — |
| OGVPN-0597 | 597 | Verify offline state. | NOT_STARTED | — |
| OGVPN-0598 | 598 | Verify accessibility tree. | NOT_STARTED | — |
| OGVPN-0599 | 599 | Verify all routes and screens are reachable. | NOT_STARTED | — |
### 28. Desktop VPN Integration

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0600 | 600 | Implement actual desktop VPN integration. | NOT_STARTED | — |
| OGVPN-0601 | 601 | Verify VPN adapter creation. | NOT_STARTED | — |
| OGVPN-0602 | 602 | Verify VPN adapter cleanup. | NOT_STARTED | — |
| OGVPN-0603 | 603 | Verify tunnel start. | NOT_STARTED | — |
| OGVPN-0604 | 604 | Verify tunnel stop. | NOT_STARTED | — |
| OGVPN-0605 | 605 | Verify tunnel status. | NOT_STARTED | — |
| OGVPN-0606 | 606 | Verify handshake failure. | NOT_STARTED | — |
| OGVPN-0607 | 607 | Verify configuration failure. | NOT_STARTED | — |
| OGVPN-0608 | 608 | Verify invalid credentials. | NOT_STARTED | — |
| OGVPN-0609 | 609 | Verify expired configuration. | NOT_STARTED | — |
| OGVPN-0610 | 610 | Verify revoked configuration. | NOT_STARTED | — |
| OGVPN-0611 | 611 | Verify DNS configuration. | NOT_STARTED | — |
| OGVPN-0612 | 612 | Verify route configuration. | NOT_STARTED | — |
| OGVPN-0613 | 613 | Verify kill switch. | NOT_STARTED | — |
| OGVPN-0614 | 614 | Verify split tunneling if supported. | NOT_STARTED | — |
| OGVPN-0615 | 615 | Verify reconnect. | NOT_STARTED | — |
| OGVPN-0616 | 616 | Verify network switching. | NOT_STARTED | — |
| OGVPN-0617 | 617 | Verify sleep/resume. | NOT_STARTED | — |
| OGVPN-0618 | 618 | Verify OS restart. | NOT_STARTED | — |
| OGVPN-0619 | 619 | Verify adapter conflicts. | NOT_STARTED | — |
| OGVPN-0620 | 620 | Verify permission denial. | NOT_STARTED | — |
| OGVPN-0621 | 621 | Verify elevation requirements. | NOT_STARTED | — |
| OGVPN-0622 | 622 | Verify UI state always reflects actual tunnel state. | NOT_STARTED | — |
### 29. Desktop OS Coverage

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0623 | 623 | Test Windows installation. | NOT_STARTED | — |
| OGVPN-0624 | 624 | Test Windows update. | NOT_STARTED | — |
| OGVPN-0625 | 625 | Test Windows uninstall. | NOT_STARTED | — |
| OGVPN-0626 | 626 | Test Windows sleep/resume. | NOT_STARTED | — |
| OGVPN-0627 | 627 | Test Windows network switching. | NOT_STARTED | — |
| OGVPN-0628 | 628 | Test Windows permission prompts. | NOT_STARTED | — |
| OGVPN-0629 | 629 | Test Windows firewall interaction. | NOT_STARTED | — |
| OGVPN-0630 | 630 | Test Windows VPN adapter behavior. | NOT_STARTED | — |
| OGVPN-0631 | 631 | Test macOS installation where supported. | NOT_STARTED | — |
| OGVPN-0632 | 632 | Test macOS update where supported. | NOT_STARTED | — |
| OGVPN-0633 | 633 | Test macOS uninstall where supported. | NOT_STARTED | — |
| OGVPN-0634 | 634 | Test macOS sleep/resume where supported. | NOT_STARTED | — |
| OGVPN-0635 | 635 | Test macOS network switching where supported. | NOT_STARTED | — |
| OGVPN-0636 | 636 | Test macOS permission prompts where supported. | NOT_STARTED | — |
| OGVPN-0637 | 637 | Test macOS VPN integration where supported. | NOT_STARTED | — |
| OGVPN-0638 | 638 | Test Linux installation where supported. | NOT_STARTED | — |
| OGVPN-0639 | 639 | Test Linux update where supported. | NOT_STARTED | — |
| OGVPN-0640 | 640 | Test Linux uninstall where supported. | NOT_STARTED | — |
| OGVPN-0641 | 641 | Test Linux network switching where supported. | NOT_STARTED | — |
| OGVPN-0642 | 642 | Test Linux service behavior where supported. | NOT_STARTED | — |
| OGVPN-0643 | 643 | Test Linux VPN integration where supported. | NOT_STARTED | — |
| OGVPN-0644 | 644 | Document and test every declared supported OS/version. | NOT_STARTED | — |
### 30. Desktop UI/UX

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0645 | 645 | Verify every screen against the product information architecture. | NOT_STARTED | — |
| OGVPN-0646 | 646 | Verify consistent navigation. | NOT_STARTED | — |
| OGVPN-0647 | 647 | Verify clear connection state. | NOT_STARTED | — |
| OGVPN-0648 | 648 | Verify clear primary action. | NOT_STARTED | — |
| OGVPN-0649 | 649 | Verify clear secondary actions. | NOT_STARTED | — |
| OGVPN-0650 | 650 | Verify loading feedback. | NOT_STARTED | — |
| OGVPN-0651 | 651 | Verify empty states. | NOT_STARTED | — |
| OGVPN-0652 | 652 | Verify error recovery. | NOT_STARTED | — |
| OGVPN-0653 | 653 | Verify offline behavior. | NOT_STARTED | — |
| OGVPN-0654 | 654 | Verify window resizing. | NOT_STARTED | — |
| OGVPN-0655 | 655 | Verify minimum window size. | NOT_STARTED | — |
| OGVPN-0656 | 656 | Verify maximum useful content width. | NOT_STARTED | — |
| OGVPN-0657 | 657 | Verify dialogs remain within the viewport. | NOT_STARTED | — |
| OGVPN-0658 | 658 | Verify menus remain within the viewport. | NOT_STARTED | — |
| OGVPN-0659 | 659 | Verify side panels remain usable. | NOT_STARTED | — |
| OGVPN-0660 | 660 | Verify keyboard navigation. | NOT_STARTED | — |
| OGVPN-0661 | 661 | Verify visible focus. | NOT_STARTED | — |
| OGVPN-0662 | 662 | Verify context menus. | NOT_STARTED | — |
| OGVPN-0663 | 663 | Verify hover states. | NOT_STARTED | — |
| OGVPN-0664 | 664 | Verify disabled states. | NOT_STARTED | — |
| OGVPN-0665 | 665 | Verify long content. | NOT_STARTED | — |
| OGVPN-0666 | 666 | Verify multi-monitor behavior where supported. | NOT_STARTED | — |
### 31. Chrome Extension Foundation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0667 | 667 | Verify extension manifest. | NOT_STARTED | — |
| OGVPN-0668 | 668 | Verify required permissions are minimal. | NOT_STARTED | — |
| OGVPN-0669 | 669 | Verify content scripts. | NOT_STARTED | — |
| OGVPN-0670 | 670 | Verify service worker. | NOT_STARTED | — |
| OGVPN-0671 | 671 | Verify popup. | NOT_STARTED | — |
| OGVPN-0672 | 672 | Verify options/settings page if present. | NOT_STARTED | — |
| OGVPN-0673 | 673 | Verify extension storage. | NOT_STARTED | — |
| OGVPN-0674 | 674 | Verify storage migration. | NOT_STARTED | — |
| OGVPN-0675 | 675 | Verify service-worker startup. | NOT_STARTED | — |
| OGVPN-0676 | 676 | Verify service-worker termination. | NOT_STARTED | — |
| OGVPN-0677 | 677 | Verify service-worker restart. | NOT_STARTED | — |
| OGVPN-0678 | 678 | Verify popup opening. | NOT_STARTED | — |
| OGVPN-0679 | 679 | Verify popup closing. | NOT_STARTED | — |
| OGVPN-0680 | 680 | Verify popup state restoration. | NOT_STARTED | — |
| OGVPN-0681 | 681 | Verify browser restart. | NOT_STARTED | — |
| OGVPN-0682 | 682 | Verify extension reload. | NOT_STARTED | — |
| OGVPN-0683 | 683 | Verify extension update. | NOT_STARTED | — |
| OGVPN-0684 | 684 | Verify permission denial. | NOT_STARTED | — |
| OGVPN-0685 | 685 | Verify host permission behavior. | NOT_STARTED | — |
| OGVPN-0686 | 686 | Verify API authentication. | NOT_STARTED | — |
| OGVPN-0687 | 687 | Verify logout. | NOT_STARTED | — |
| OGVPN-0688 | 688 | Verify no secrets are exposed unnecessarily. | NOT_STARTED | — |
| OGVPN-0689 | 689 | Verify production packaging. | NOT_STARTED | — |
### 32. Chrome Extension VPN Behavior

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0690 | 690 | Verify extension connection flow. | NOT_STARTED | — |
| OGVPN-0691 | 691 | Verify extension disconnect flow. | NOT_STARTED | — |
| OGVPN-0692 | 692 | Verify connection state. | NOT_STARTED | — |
| OGVPN-0693 | 693 | Verify connection failure. | NOT_STARTED | — |
| OGVPN-0694 | 694 | Verify reconnect. | NOT_STARTED | — |
| OGVPN-0695 | 695 | Verify server selection. | NOT_STARTED | — |
| OGVPN-0696 | 696 | Verify server search. | NOT_STARTED | — |
| OGVPN-0697 | 697 | Verify favorites. | NOT_STARTED | — |
| OGVPN-0698 | 698 | Verify configuration retrieval. | NOT_STARTED | — |
| OGVPN-0699 | 699 | Verify stale configuration handling. | NOT_STARTED | — |
| OGVPN-0700 | 700 | Verify authentication expiry. | NOT_STARTED | — |
| OGVPN-0701 | 701 | Verify browser network changes. | NOT_STARTED | — |
| OGVPN-0702 | 702 | Verify browser restart. | NOT_STARTED | — |
| OGVPN-0703 | 703 | Verify extension service-worker restart. | NOT_STARTED | — |
| OGVPN-0704 | 704 | Verify tab navigation. | NOT_STARTED | — |
| OGVPN-0705 | 705 | Verify multiple tabs. | NOT_STARTED | — |
| OGVPN-0706 | 706 | Verify incognito behavior if supported. | NOT_STARTED | — |
| OGVPN-0707 | 707 | Verify host permissions. | NOT_STARTED | — |
| OGVPN-0708 | 708 | Verify proxy/network behavior. | NOT_STARTED | — |
| OGVPN-0709 | 709 | Verify DNS behavior where applicable. | NOT_STARTED | — |
| OGVPN-0710 | 710 | Verify UI cannot claim connected when backend state disagrees. | NOT_STARTED | — |
| OGVPN-0711 | 711 | Verify extension-to-dashboard synchronization. | NOT_STARTED | — |
### 33. API Contract Inventory

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0712 | 712 | Inventory every API endpoint. | NOT_STARTED | — |
| OGVPN-0713 | 713 | Inventory every HTTP method. | NOT_STARTED | — |
| OGVPN-0714 | 714 | Inventory every request schema. | NOT_STARTED | — |
| OGVPN-0715 | 715 | Inventory every response schema. | NOT_STARTED | — |
| OGVPN-0716 | 716 | Inventory every authentication requirement. | NOT_STARTED | — |
| OGVPN-0717 | 717 | Inventory every authorization rule. | NOT_STARTED | — |
| OGVPN-0718 | 718 | Inventory every loading state. | NOT_STARTED | — |
| OGVPN-0719 | 719 | Inventory every success state. | NOT_STARTED | — |
| OGVPN-0720 | 720 | Inventory every error state. | NOT_STARTED | — |
| OGVPN-0721 | 721 | Inventory every timeout. | NOT_STARTED | — |
| OGVPN-0722 | 722 | Inventory every retry policy. | NOT_STARTED | — |
| OGVPN-0723 | 723 | Inventory every offline behavior. | NOT_STARTED | — |
| OGVPN-0724 | 724 | Inventory every duplicate-action safeguard. | NOT_STARTED | — |
| OGVPN-0725 | 725 | Inventory every pagination contract. | NOT_STARTED | — |
| OGVPN-0726 | 726 | Inventory every filtering contract. | NOT_STARTED | — |
| OGVPN-0727 | 727 | Inventory every sorting contract. | NOT_STARTED | — |
| OGVPN-0728 | 728 | Inventory every validation rule. | NOT_STARTED | — |
| OGVPN-0729 | 729 | Inventory every rate limit. | NOT_STARTED | — |
| OGVPN-0730 | 730 | Inventory every webhook. | NOT_STARTED | — |
| OGVPN-0731 | 731 | Inventory every event emitted. | NOT_STARTED | — |
| OGVPN-0732 | 732 | Inventory every client consuming each endpoint. | NOT_STARTED | — |
| OGVPN-0733 | 733 | Verify documentation matches implementation. | NOT_STARTED | — |
### 34. API Reliability

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0734 | 734 | Test successful API requests. | NOT_STARTED | — |
| OGVPN-0735 | 735 | Test malformed request. | NOT_STARTED | — |
| OGVPN-0736 | 736 | Test missing fields. | NOT_STARTED | — |
| OGVPN-0737 | 737 | Test invalid types. | NOT_STARTED | — |
| OGVPN-0738 | 738 | Test oversized input. | NOT_STARTED | — |
| OGVPN-0739 | 739 | Test unauthorized request. | NOT_STARTED | — |
| OGVPN-0740 | 740 | Test forbidden request. | NOT_STARTED | — |
| OGVPN-0741 | 741 | Test not-found request. | NOT_STARTED | — |
| OGVPN-0742 | 742 | Test conflict response. | NOT_STARTED | — |
| OGVPN-0743 | 743 | Test validation error. | NOT_STARTED | — |
| OGVPN-0744 | 744 | Test rate-limit response. | NOT_STARTED | — |
| OGVPN-0745 | 745 | Test server error. | NOT_STARTED | — |
| OGVPN-0746 | 746 | Test gateway error. | NOT_STARTED | — |
| OGVPN-0747 | 747 | Test timeout. | NOT_STARTED | — |
| OGVPN-0748 | 748 | Test connection reset. | NOT_STARTED | — |
| OGVPN-0749 | 749 | Test malformed JSON response. | NOT_STARTED | — |
| OGVPN-0750 | 750 | Test unexpected response fields. | NOT_STARTED | — |
| OGVPN-0751 | 751 | Test missing response fields. | NOT_STARTED | — |
| OGVPN-0752 | 752 | Test duplicate requests. | NOT_STARTED | — |
| OGVPN-0753 | 753 | Test idempotency where required. | NOT_STARTED | — |
| OGVPN-0754 | 754 | Test retry behavior. | NOT_STARTED | — |
| OGVPN-0755 | 755 | Test client recovery after transient failure. | NOT_STARTED | — |
### 35. Backend Authentication

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0756 | 756 | Verify password hashing. | NOT_STARTED | — |
| OGVPN-0757 | 757 | Verify credential validation. | NOT_STARTED | — |
| OGVPN-0758 | 758 | Verify session issuance. | NOT_STARTED | — |
| OGVPN-0759 | 759 | Verify session expiration. | NOT_STARTED | — |
| OGVPN-0760 | 760 | Verify session refresh. | NOT_STARTED | — |
| OGVPN-0761 | 761 | Verify session revocation. | NOT_STARTED | — |
| OGVPN-0762 | 762 | Verify logout. | NOT_STARTED | — |
| OGVPN-0763 | 763 | Verify account isolation. | NOT_STARTED | — |
| OGVPN-0764 | 764 | Verify authentication history. | NOT_STARTED | — |
| OGVPN-0765 | 765 | Verify MFA flow if enabled. | NOT_STARTED | — |
| OGVPN-0766 | 766 | Verify recovery flow. | NOT_STARTED | — |
| OGVPN-0767 | 767 | Verify brute-force protection. | NOT_STARTED | — |
| OGVPN-0768 | 768 | Verify rate limiting. | NOT_STARTED | — |
| OGVPN-0769 | 769 | Verify suspicious login handling. | NOT_STARTED | — |
| OGVPN-0770 | 770 | Verify secure cookies if used. | NOT_STARTED | — |
| OGVPN-0771 | 771 | Verify token audience. | NOT_STARTED | — |
| OGVPN-0772 | 772 | Verify token issuer. | NOT_STARTED | — |
| OGVPN-0773 | 773 | Verify token expiration validation. | NOT_STARTED | — |
| OGVPN-0774 | 774 | Verify clock-skew handling. | NOT_STARTED | — |
| OGVPN-0775 | 775 | Verify invalid token rejection. | NOT_STARTED | — |
| OGVPN-0776 | 776 | Verify revoked-token rejection. | NOT_STARTED | — |
| OGVPN-0777 | 777 | Verify audit logging. | NOT_STARTED | — |
### 36. Authorization & RBAC

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0778 | 778 | Verify every protected route checks authentication. | NOT_STARTED | — |
| OGVPN-0779 | 779 | Verify every protected route checks authorization. | NOT_STARTED | — |
| OGVPN-0780 | 780 | Verify users cannot access another user's devices. | NOT_STARTED | — |
| OGVPN-0781 | 781 | Verify users cannot access another user's VPN configurations. | NOT_STARTED | — |
| OGVPN-0782 | 782 | Verify users cannot access another user's billing data. | NOT_STARTED | — |
| OGVPN-0783 | 783 | Verify users cannot access another user's support tickets. | NOT_STARTED | — |
| OGVPN-0784 | 784 | Verify users cannot access another user's notifications. | NOT_STARTED | — |
| OGVPN-0785 | 785 | Verify admin endpoints reject normal users. | NOT_STARTED | — |
| OGVPN-0786 | 786 | Verify admin roles are enforced server-side. | NOT_STARTED | — |
| OGVPN-0787 | 787 | Verify role changes take effect correctly. | NOT_STARTED | — |
| OGVPN-0788 | 788 | Verify revoked roles lose access. | NOT_STARTED | — |
| OGVPN-0789 | 789 | Verify direct API calls cannot bypass UI restrictions. | NOT_STARTED | — |
| OGVPN-0790 | 790 | Verify object identifiers cannot be manipulated for unauthorized access. | NOT_STARTED | — |
| OGVPN-0791 | 791 | Verify bulk endpoints enforce per-object authorization. | NOT_STARTED | — |
| OGVPN-0792 | 792 | Verify websocket authorization. | NOT_STARTED | — |
| OGVPN-0793 | 793 | Verify background job authorization context. | NOT_STARTED | — |
| OGVPN-0794 | 794 | Verify webhook authentication. | NOT_STARTED | — |
| OGVPN-0795 | 795 | Verify internal service authorization. | NOT_STARTED | — |
| OGVPN-0796 | 796 | Verify least privilege. | NOT_STARTED | — |
| OGVPN-0797 | 797 | Verify default-deny behavior. | NOT_STARTED | — |
| OGVPN-0798 | 798 | Verify authorization failures are logged appropriately. | NOT_STARTED | — |
| OGVPN-0799 | 799 | Verify authorization tests run in CI. | NOT_STARTED | — |
### 37. Database Integrity

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0800 | 800 | Verify schema matches application assumptions. | NOT_STARTED | — |
| OGVPN-0801 | 801 | Verify migrations run cleanly. | NOT_STARTED | — |
| OGVPN-0802 | 802 | Verify migrations are reversible where policy requires. | NOT_STARTED | — |
| OGVPN-0803 | 803 | Verify fresh database creation. | NOT_STARTED | — |
| OGVPN-0804 | 804 | Verify upgrade from prior schema. | NOT_STARTED | — |
| OGVPN-0805 | 805 | Verify unique constraints. | NOT_STARTED | — |
| OGVPN-0806 | 806 | Verify foreign keys. | NOT_STARTED | — |
| OGVPN-0807 | 807 | Verify nullable fields. | NOT_STARTED | — |
| OGVPN-0808 | 808 | Verify defaults. | NOT_STARTED | — |
| OGVPN-0809 | 809 | Verify indexes. | NOT_STARTED | — |
| OGVPN-0810 | 810 | Verify transaction boundaries. | NOT_STARTED | — |
| OGVPN-0811 | 811 | Verify rollback on partial failure. | NOT_STARTED | — |
| OGVPN-0812 | 812 | Verify concurrent writes. | NOT_STARTED | — |
| OGVPN-0813 | 813 | Verify stale writes. | NOT_STARTED | — |
| OGVPN-0814 | 814 | Verify deleted-record behavior. | NOT_STARTED | — |
| OGVPN-0815 | 815 | Verify soft-delete behavior if used. | NOT_STARTED | — |
| OGVPN-0816 | 816 | Verify account isolation. | NOT_STARTED | — |
| OGVPN-0817 | 817 | Verify sensitive data retention. | NOT_STARTED | — |
| OGVPN-0818 | 818 | Verify cleanup jobs. | NOT_STARTED | — |
| OGVPN-0819 | 819 | Verify backup integrity. | NOT_STARTED | — |
| OGVPN-0820 | 820 | Verify restore integrity. | NOT_STARTED | — |
| OGVPN-0821 | 821 | Verify seed data is not production-sensitive. | NOT_STARTED | — |
| OGVPN-0822 | 822 | Verify test data cannot contaminate production. | NOT_STARTED | — |
### 38. Data Consistency & Sync

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0823 | 823 | Verify UI data matches server data after create. | NOT_STARTED | — |
| OGVPN-0824 | 824 | Verify UI data matches server data after update. | NOT_STARTED | — |
| OGVPN-0825 | 825 | Verify UI data matches server data after delete. | NOT_STARTED | — |
| OGVPN-0826 | 826 | Verify refresh consistency. | NOT_STARTED | — |
| OGVPN-0827 | 827 | Verify multi-tab consistency. | NOT_STARTED | — |
| OGVPN-0828 | 828 | Verify multi-device consistency. | NOT_STARTED | — |
| OGVPN-0829 | 829 | Verify Android/web consistency. | NOT_STARTED | — |
| OGVPN-0830 | 830 | Verify desktop/web consistency. | NOT_STARTED | — |
| OGVPN-0831 | 831 | Verify extension/web consistency. | NOT_STARTED | — |
| OGVPN-0832 | 832 | Verify eventual consistency windows are handled. | NOT_STARTED | — |
| OGVPN-0833 | 833 | Verify stale cache invalidation. | NOT_STARTED | — |
| OGVPN-0834 | 834 | Verify optimistic updates roll back on failure. | NOT_STARTED | — |
| OGVPN-0835 | 835 | Verify duplicate events do not duplicate records. | NOT_STARTED | — |
| OGVPN-0836 | 836 | Verify out-of-order events do not corrupt state. | NOT_STARTED | — |
| OGVPN-0837 | 837 | Verify reconnect synchronization. | NOT_STARTED | — |
| OGVPN-0838 | 838 | Verify offline queue replay. | NOT_STARTED | — |
| OGVPN-0839 | 839 | Verify conflicting edits are handled. | NOT_STARTED | — |
| OGVPN-0840 | 840 | Verify server remains source of truth where required. | NOT_STARTED | — |
| OGVPN-0841 | 841 | Verify client state cannot permanently override server state. | NOT_STARTED | — |
| OGVPN-0842 | 842 | Verify timestamps are interpreted consistently. | NOT_STARTED | — |
| OGVPN-0843 | 843 | Verify IDs remain stable across clients. | NOT_STARTED | — |
| OGVPN-0844 | 844 | Verify deleted entities disappear everywhere appropriately. | NOT_STARTED | — |
### 39. VPN Control Plane

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0845 | 845 | Verify server inventory. | NOT_STARTED | — |
| OGVPN-0846 | 846 | Verify server health. | NOT_STARTED | — |
| OGVPN-0847 | 847 | Verify server availability. | NOT_STARTED | — |
| OGVPN-0848 | 848 | Verify server capacity. | NOT_STARTED | — |
| OGVPN-0849 | 849 | Verify region metadata. | NOT_STARTED | — |
| OGVPN-0850 | 850 | Verify protocol metadata. | NOT_STARTED | — |
| OGVPN-0851 | 851 | Verify configuration generation. | NOT_STARTED | — |
| OGVPN-0852 | 852 | Verify configuration authorization. | NOT_STARTED | — |
| OGVPN-0853 | 853 | Verify device binding. | NOT_STARTED | — |
| OGVPN-0854 | 854 | Verify key association. | NOT_STARTED | — |
| OGVPN-0855 | 855 | Verify key revocation. | NOT_STARTED | — |
| OGVPN-0856 | 856 | Verify tunnel state. | NOT_STARTED | — |
| OGVPN-0857 | 857 | Verify connection events. | NOT_STARTED | — |
| OGVPN-0858 | 858 | Verify disconnect events. | NOT_STARTED | — |
| OGVPN-0859 | 859 | Verify failure events. | NOT_STARTED | — |
| OGVPN-0860 | 860 | Verify stale connection cleanup. | NOT_STARTED | — |
| OGVPN-0861 | 861 | Verify concurrent connection handling. | NOT_STARTED | — |
| OGVPN-0862 | 862 | Verify device limits. | NOT_STARTED | — |
| OGVPN-0863 | 863 | Verify plan limits. | NOT_STARTED | — |
| OGVPN-0864 | 864 | Verify abuse controls. | NOT_STARTED | — |
| OGVPN-0865 | 865 | Verify administrative overrides. | NOT_STARTED | — |
| OGVPN-0866 | 866 | Verify control-plane failures are visible and recoverable. | NOT_STARTED | — |
### 40. VPN Server Lifecycle

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0867 | 867 | Verify server registration. | NOT_STARTED | — |
| OGVPN-0868 | 868 | Verify server activation. | NOT_STARTED | — |
| OGVPN-0869 | 869 | Verify server deactivation. | NOT_STARTED | — |
| OGVPN-0870 | 870 | Verify server maintenance state. | NOT_STARTED | — |
| OGVPN-0871 | 871 | Verify server drain behavior. | NOT_STARTED | — |
| OGVPN-0872 | 872 | Verify provisioning. | NOT_STARTED | — |
| OGVPN-0873 | 873 | Verify configuration deployment. | NOT_STARTED | — |
| OGVPN-0874 | 874 | Verify health-check startup. | NOT_STARTED | — |
| OGVPN-0875 | 875 | Verify health-check failure. | NOT_STARTED | — |
| OGVPN-0876 | 876 | Verify automatic recovery where supported. | NOT_STARTED | — |
| OGVPN-0877 | 877 | Verify manual recovery. | NOT_STARTED | — |
| OGVPN-0878 | 878 | Verify key rotation. | NOT_STARTED | — |
| OGVPN-0879 | 879 | Verify certificate rotation if applicable. | NOT_STARTED | — |
| OGVPN-0880 | 880 | Verify server removal. | NOT_STARTED | — |
| OGVPN-0881 | 881 | Verify stale server removal. | NOT_STARTED | — |
| OGVPN-0882 | 882 | Verify users are not assigned to removed servers. | NOT_STARTED | — |
| OGVPN-0883 | 883 | Verify graceful migration. | NOT_STARTED | — |
| OGVPN-0884 | 884 | Verify failed provisioning rollback. | NOT_STARTED | — |
| OGVPN-0885 | 885 | Verify partial provisioning cleanup. | NOT_STARTED | — |
| OGVPN-0886 | 886 | Verify monitoring. | NOT_STARTED | — |
| OGVPN-0887 | 887 | Verify capacity thresholds. | NOT_STARTED | — |
| OGVPN-0888 | 888 | Verify incident state propagation. | NOT_STARTED | — |
### 41. WireGuard

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0889 | 889 | Verify key generation. | NOT_STARTED | — |
| OGVPN-0890 | 890 | Verify private keys never leave intended secure boundaries. | NOT_STARTED | — |
| OGVPN-0891 | 891 | Verify public-key registration. | NOT_STARTED | — |
| OGVPN-0892 | 892 | Verify peer configuration. | NOT_STARTED | — |
| OGVPN-0893 | 893 | Verify allowed IPs. | NOT_STARTED | — |
| OGVPN-0894 | 894 | Verify endpoint configuration. | NOT_STARTED | — |
| OGVPN-0895 | 895 | Verify persistent keepalive where required. | NOT_STARTED | — |
| OGVPN-0896 | 896 | Verify handshake. | NOT_STARTED | — |
| OGVPN-0897 | 897 | Verify handshake timeout. | NOT_STARTED | — |
| OGVPN-0898 | 898 | Verify key mismatch. | NOT_STARTED | — |
| OGVPN-0899 | 899 | Verify revoked peer. | NOT_STARTED | — |
| OGVPN-0900 | 900 | Verify stale peer. | NOT_STARTED | — |
| OGVPN-0901 | 901 | Verify peer removal. | NOT_STARTED | — |
| OGVPN-0902 | 902 | Verify configuration refresh. | NOT_STARTED | — |
| OGVPN-0903 | 903 | Verify configuration expiration. | NOT_STARTED | — |
| OGVPN-0904 | 904 | Verify reconnect. | NOT_STARTED | — |
| OGVPN-0905 | 905 | Verify server failover. | NOT_STARTED | — |
| OGVPN-0906 | 906 | Verify DNS behavior. | NOT_STARTED | — |
| OGVPN-0907 | 907 | Verify IPv6 behavior. | NOT_STARTED | — |
| OGVPN-0908 | 908 | Verify MTU behavior. | NOT_STARTED | — |
| OGVPN-0909 | 909 | Verify packet routing. | NOT_STARTED | — |
| OGVPN-0910 | 910 | Verify actual tunnel traffic. | NOT_STARTED | — |
### 42. OpenVPN/IKEv2 Where Applicable

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0911 | 911 | Verify protocol availability matches product claims. | NOT_STARTED | — |
| OGVPN-0912 | 912 | Verify configuration generation. | NOT_STARTED | — |
| OGVPN-0913 | 913 | Verify credential provisioning. | NOT_STARTED | — |
| OGVPN-0914 | 914 | Verify certificate validation. | NOT_STARTED | — |
| OGVPN-0915 | 915 | Verify server identity validation. | NOT_STARTED | — |
| OGVPN-0916 | 916 | Verify handshake. | NOT_STARTED | — |
| OGVPN-0917 | 917 | Verify authentication failure. | NOT_STARTED | — |
| OGVPN-0918 | 918 | Verify timeout. | NOT_STARTED | — |
| OGVPN-0919 | 919 | Verify reconnect. | NOT_STARTED | — |
| OGVPN-0920 | 920 | Verify configuration expiration. | NOT_STARTED | — |
| OGVPN-0921 | 921 | Verify revocation. | NOT_STARTED | — |
| OGVPN-0922 | 922 | Verify DNS routing. | NOT_STARTED | — |
| OGVPN-0923 | 923 | Verify IPv4 routing. | NOT_STARTED | — |
| OGVPN-0924 | 924 | Verify IPv6 routing. | NOT_STARTED | — |
| OGVPN-0925 | 925 | Verify split tunneling where supported. | NOT_STARTED | — |
| OGVPN-0926 | 926 | Verify kill switch where supported. | NOT_STARTED | — |
| OGVPN-0927 | 927 | Verify network switching. | NOT_STARTED | — |
| OGVPN-0928 | 928 | Verify sleep/resume. | NOT_STARTED | — |
| OGVPN-0929 | 929 | Verify server failover. | NOT_STARTED | — |
| OGVPN-0930 | 930 | Verify actual encrypted traffic. | NOT_STARTED | — |
| OGVPN-0931 | 931 | Verify protocol-specific error messages. | NOT_STARTED | — |
| OGVPN-0932 | 932 | Verify platform-specific behavior. | NOT_STARTED | — |
### 43. DNS & Leak Prevention

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0933 | 933 | Verify DNS server selection. | NOT_STARTED | — |
| OGVPN-0934 | 934 | Verify DNS requests traverse the intended path. | NOT_STARTED | — |
| OGVPN-0935 | 935 | Verify DNS behavior before tunnel establishment. | NOT_STARTED | — |
| OGVPN-0936 | 936 | Verify DNS behavior after tunnel establishment. | NOT_STARTED | — |
| OGVPN-0937 | 937 | Verify DNS behavior after tunnel failure. | NOT_STARTED | — |
| OGVPN-0938 | 938 | Verify DNS behavior after disconnect. | NOT_STARTED | — |
| OGVPN-0939 | 939 | Verify DNS behavior during reconnect. | NOT_STARTED | — |
| OGVPN-0940 | 940 | Verify IPv4 DNS. | NOT_STARTED | — |
| OGVPN-0941 | 941 | Verify IPv6 DNS. | NOT_STARTED | — |
| OGVPN-0942 | 942 | Verify split-DNS behavior where supported. | NOT_STARTED | — |
| OGVPN-0943 | 943 | Verify local DNS behavior according to policy. | NOT_STARTED | — |
| OGVPN-0944 | 944 | Verify captive portal compatibility. | NOT_STARTED | — |
| OGVPN-0945 | 945 | Verify stale DNS configuration cleanup. | NOT_STARTED | — |
| OGVPN-0946 | 946 | Verify DNS configuration persistence. | NOT_STARTED | — |
| OGVPN-0947 | 947 | Verify DNS configuration after reboot. | NOT_STARTED | — |
| OGVPN-0948 | 948 | Verify DNS configuration after app restart. | NOT_STARTED | — |
| OGVPN-0949 | 949 | Verify DNS leak testing. | NOT_STARTED | — |
| OGVPN-0950 | 950 | Verify browser DNS behavior. | NOT_STARTED | — |
| OGVPN-0951 | 951 | Verify system DNS behavior. | NOT_STARTED | — |
| OGVPN-0952 | 952 | Verify application-specific DNS behavior. | NOT_STARTED | — |
| OGVPN-0953 | 953 | Verify failure is surfaced clearly. | NOT_STARTED | — |
| OGVPN-0954 | 954 | Verify no accidental fallback bypasses intended privacy controls. | NOT_STARTED | — |
### 44. IPv4, IPv6 & Routing

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0955 | 955 | Verify IPv4-only network. | NOT_STARTED | — |
| OGVPN-0956 | 956 | Verify IPv6-only network where supported. | NOT_STARTED | — |
| OGVPN-0957 | 957 | Verify dual-stack network. | NOT_STARTED | — |
| OGVPN-0958 | 958 | Verify IPv4 route installation. | NOT_STARTED | — |
| OGVPN-0959 | 959 | Verify IPv6 route installation. | NOT_STARTED | — |
| OGVPN-0960 | 960 | Verify default route. | NOT_STARTED | — |
| OGVPN-0961 | 961 | Verify split routes. | NOT_STARTED | — |
| OGVPN-0962 | 962 | Verify excluded routes. | NOT_STARTED | — |
| OGVPN-0963 | 963 | Verify route cleanup. | NOT_STARTED | — |
| OGVPN-0964 | 964 | Verify route conflict. | NOT_STARTED | — |
| OGVPN-0965 | 965 | Verify local network access. | NOT_STARTED | — |
| OGVPN-0966 | 966 | Verify internet access. | NOT_STARTED | — |
| OGVPN-0967 | 967 | Verify private-network access behavior. | NOT_STARTED | — |
| OGVPN-0968 | 968 | Verify route changes during reconnect. | NOT_STARTED | — |
| OGVPN-0969 | 969 | Verify route changes after disconnect. | NOT_STARTED | — |
| OGVPN-0970 | 970 | Verify route changes after sleep/resume. | NOT_STARTED | — |
| OGVPN-0971 | 971 | Verify route state after reboot. | NOT_STARTED | — |
| OGVPN-0972 | 972 | Verify route state after app crash. | NOT_STARTED | — |
| OGVPN-0973 | 973 | Verify route state after forced termination. | NOT_STARTED | — |
| OGVPN-0974 | 974 | Verify route state after update. | NOT_STARTED | — |
| OGVPN-0975 | 975 | Verify route state after uninstall. | NOT_STARTED | — |
| OGVPN-0976 | 976 | Verify no traffic escapes intended routing policy. | NOT_STARTED | — |
### 45. Kill Switch

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-0977 | 977 | Verify kill switch default state. | NOT_STARTED | — |
| OGVPN-0978 | 978 | Verify enablement. | NOT_STARTED | — |
| OGVPN-0979 | 979 | Verify disablement. | NOT_STARTED | — |
| OGVPN-0980 | 980 | Verify tunnel startup blocking. | NOT_STARTED | — |
| OGVPN-0981 | 981 | Verify tunnel shutdown blocking. | NOT_STARTED | — |
| OGVPN-0982 | 982 | Verify unexpected tunnel failure blocking. | NOT_STARTED | — |
| OGVPN-0983 | 983 | Verify reconnect transition. | NOT_STARTED | — |
| OGVPN-0984 | 984 | Verify network transition. | NOT_STARTED | — |
| OGVPN-0985 | 985 | Verify device sleep. | NOT_STARTED | — |
| OGVPN-0986 | 986 | Verify device wake. | NOT_STARTED | — |
| OGVPN-0987 | 987 | Verify app restart. | NOT_STARTED | — |
| OGVPN-0988 | 988 | Verify service restart. | NOT_STARTED | — |
| OGVPN-0989 | 989 | Verify system restart. | NOT_STARTED | — |
| OGVPN-0990 | 990 | Verify configuration corruption. | NOT_STARTED | — |
| OGVPN-0991 | 991 | Verify server unavailable. | NOT_STARTED | — |
| OGVPN-0992 | 992 | Verify DNS unavailable. | NOT_STARTED | — |
| OGVPN-0993 | 993 | Verify kill-switch UI reflects actual state. | NOT_STARTED | — |
| OGVPN-0994 | 994 | Verify user can recover from an intentionally blocked network. | NOT_STARTED | — |
| OGVPN-0995 | 995 | Verify no permanent network lock occurs after normal recovery. | NOT_STARTED | — |
| OGVPN-0996 | 996 | Verify platform-specific implementation. | NOT_STARTED | — |
| OGVPN-0997 | 997 | Verify uninstall cleanup. | NOT_STARTED | — |
| OGVPN-0998 | 998 | Verify no bypass through alternate interfaces where the feature claims full-device protection. | NOT_STARTED | — |
| OGVPN-0999 | 999 | Verify evidence with actual traffic tests. | NOT_STARTED | — |
### 46. Split Tunneling

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1000 | 1000 | Verify feature availability per platform. | NOT_STARTED | — |
| OGVPN-1001 | 1001 | Verify include-list mode. | NOT_STARTED | — |
| OGVPN-1002 | 1002 | Verify exclude-list mode. | NOT_STARTED | — |
| OGVPN-1003 | 1003 | Verify application selection. | NOT_STARTED | — |
| OGVPN-1004 | 1004 | Verify application deselection. | NOT_STARTED | — |
| OGVPN-1005 | 1005 | Verify invalid application selection. | NOT_STARTED | — |
| OGVPN-1006 | 1006 | Verify system application handling. | NOT_STARTED | — |
| OGVPN-1007 | 1007 | Verify browser handling. | NOT_STARTED | — |
| OGVPN-1008 | 1008 | Verify DNS behavior. | NOT_STARTED | — |
| OGVPN-1009 | 1009 | Verify IPv4 routing. | NOT_STARTED | — |
| OGVPN-1010 | 1010 | Verify IPv6 routing. | NOT_STARTED | — |
| OGVPN-1011 | 1011 | Verify changes while connected. | NOT_STARTED | — |
| OGVPN-1012 | 1012 | Verify changes while disconnected. | NOT_STARTED | — |
| OGVPN-1013 | 1013 | Verify reconnect after rule change. | NOT_STARTED | — |
| OGVPN-1014 | 1014 | Verify persistence. | NOT_STARTED | — |
| OGVPN-1015 | 1015 | Verify reset-to-default. | NOT_STARTED | — |
| OGVPN-1016 | 1016 | Verify rule conflicts. | NOT_STARTED | — |
| OGVPN-1017 | 1017 | Verify duplicate rules. | NOT_STARTED | — |
| OGVPN-1018 | 1018 | Verify large rule lists. | NOT_STARTED | — |
| OGVPN-1019 | 1019 | Verify rule migration after app update. | NOT_STARTED | — |
| OGVPN-1020 | 1020 | Verify UI accurately reflects effective routing. | NOT_STARTED | — |
| OGVPN-1021 | 1021 | Verify server-side limits if applicable. | NOT_STARTED | — |
### 47. Network Switching

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1022 | 1022 | Test Wi-Fi to cellular. | NOT_STARTED | — |
| OGVPN-1023 | 1023 | Test cellular to Wi-Fi. | NOT_STARTED | — |
| OGVPN-1024 | 1024 | Test Ethernet to Wi-Fi. | NOT_STARTED | — |
| OGVPN-1025 | 1025 | Test Wi-Fi to Ethernet. | NOT_STARTED | — |
| OGVPN-1026 | 1026 | Test VPN server endpoint change. | NOT_STARTED | — |
| OGVPN-1027 | 1027 | Test IP address change. | NOT_STARTED | — |
| OGVPN-1028 | 1028 | Test gateway change. | NOT_STARTED | — |
| OGVPN-1029 | 1029 | Test DNS change. | NOT_STARTED | — |
| OGVPN-1030 | 1030 | Test network loss. | NOT_STARTED | — |
| OGVPN-1031 | 1031 | Test network recovery. | NOT_STARTED | — |
| OGVPN-1032 | 1032 | Test captive portal. | NOT_STARTED | — |
| OGVPN-1033 | 1033 | Test airplane mode. | NOT_STARTED | — |
| OGVPN-1034 | 1034 | Test roaming-like transitions where available. | NOT_STARTED | — |
| OGVPN-1035 | 1035 | Test high latency. | NOT_STARTED | — |
| OGVPN-1036 | 1036 | Test packet loss. | NOT_STARTED | — |
| OGVPN-1037 | 1037 | Test intermittent connectivity. | NOT_STARTED | — |
| OGVPN-1038 | 1038 | Test rapid network flapping. | NOT_STARTED | — |
| OGVPN-1039 | 1039 | Verify reconnect backoff. | NOT_STARTED | — |
| OGVPN-1040 | 1040 | Verify no reconnect storm. | NOT_STARTED | — |
| OGVPN-1041 | 1041 | Verify connection state accuracy. | NOT_STARTED | — |
| OGVPN-1042 | 1042 | Verify traffic policy during transitions. | NOT_STARTED | — |
| OGVPN-1043 | 1043 | Verify user-visible messaging. | NOT_STARTED | — |
| OGVPN-1044 | 1044 | Verify all clients recover consistently. | NOT_STARTED | — |
### 48. Sleep, Resume, Restart

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1045 | 1045 | Verify browser sleep/background behavior. | NOT_STARTED | — |
| OGVPN-1046 | 1046 | Verify Android background. | NOT_STARTED | — |
| OGVPN-1047 | 1047 | Verify Android process recreation. | NOT_STARTED | — |
| OGVPN-1048 | 1048 | Verify desktop sleep. | NOT_STARTED | — |
| OGVPN-1049 | 1049 | Verify desktop hibernate where supported. | NOT_STARTED | — |
| OGVPN-1050 | 1050 | Verify desktop resume. | NOT_STARTED | — |
| OGVPN-1051 | 1051 | Verify app restart. | NOT_STARTED | — |
| OGVPN-1052 | 1052 | Verify device reboot. | NOT_STARTED | — |
| OGVPN-1053 | 1053 | Verify VPN service restart. | NOT_STARTED | — |
| OGVPN-1054 | 1054 | Verify network service restart. | NOT_STARTED | — |
| OGVPN-1055 | 1055 | Verify configuration restoration. | NOT_STARTED | — |
| OGVPN-1056 | 1056 | Verify session restoration. | NOT_STARTED | — |
| OGVPN-1057 | 1057 | Verify stale-session detection. | NOT_STARTED | — |
| OGVPN-1058 | 1058 | Verify stale-tunnel detection. | NOT_STARTED | — |
| OGVPN-1059 | 1059 | Verify cleanup of orphaned resources. | NOT_STARTED | — |
| OGVPN-1060 | 1060 | Verify notification state after resume. | NOT_STARTED | — |
| OGVPN-1061 | 1061 | Verify dashboard state after resume. | NOT_STARTED | — |
| OGVPN-1062 | 1062 | Verify server state after resume. | NOT_STARTED | — |
| OGVPN-1063 | 1063 | Verify usage state after resume. | NOT_STARTED | — |
| OGVPN-1064 | 1064 | Verify connection metrics after resume. | NOT_STARTED | — |
| OGVPN-1065 | 1065 | Verify no duplicate connections. | NOT_STARTED | — |
| OGVPN-1066 | 1066 | Verify no hidden background failures. | NOT_STARTED | — |
### 49. Performance

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1067 | 1067 | Measure web first load. | NOT_STARTED | — |
| OGVPN-1068 | 1068 | Measure web authenticated load. | NOT_STARTED | — |
| OGVPN-1069 | 1069 | Measure Android cold start. | NOT_STARTED | — |
| OGVPN-1070 | 1070 | Measure Android warm start. | NOT_STARTED | — |
| OGVPN-1071 | 1071 | Measure Desktop cold start. | NOT_STARTED | — |
| OGVPN-1072 | 1072 | Measure Desktop warm start. | NOT_STARTED | — |
| OGVPN-1073 | 1073 | Measure extension popup start. | NOT_STARTED | — |
| OGVPN-1074 | 1074 | Measure API latency. | NOT_STARTED | — |
| OGVPN-1075 | 1075 | Measure dashboard rendering. | NOT_STARTED | — |
| OGVPN-1076 | 1076 | Measure large server-list rendering. | NOT_STARTED | — |
| OGVPN-1077 | 1077 | Measure large device-list rendering. | NOT_STARTED | — |
| OGVPN-1078 | 1078 | Measure large notification-list rendering. | NOT_STARTED | — |
| OGVPN-1079 | 1079 | Measure large support-list rendering. | NOT_STARTED | — |
| OGVPN-1080 | 1080 | Measure configuration generation latency. | NOT_STARTED | — |
| OGVPN-1081 | 1081 | Measure VPN connection establishment. | NOT_STARTED | — |
| OGVPN-1082 | 1082 | Measure reconnect latency. | NOT_STARTED | — |
| OGVPN-1083 | 1083 | Measure disconnect latency. | NOT_STARTED | — |
| OGVPN-1084 | 1084 | Measure memory usage. | NOT_STARTED | — |
| OGVPN-1085 | 1085 | Measure CPU usage. | NOT_STARTED | — |
| OGVPN-1086 | 1086 | Measure battery impact. | NOT_STARTED | — |
| OGVPN-1087 | 1087 | Measure network overhead. | NOT_STARTED | — |
| OGVPN-1088 | 1088 | Set performance budgets and investigate regressions. | NOT_STARTED | — |
| OGVPN-1089 | 1089 | Verify performance remains acceptable on constrained hardware. | NOT_STARTED | — |
### 50. Memory, CPU & Battery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1090 | 1090 | Check web memory growth across navigation. | NOT_STARTED | — |
| OGVPN-1091 | 1091 | Check web memory growth across repeated login/logout. | NOT_STARTED | — |
| OGVPN-1092 | 1092 | Check extension service-worker memory. | NOT_STARTED | — |
| OGVPN-1093 | 1093 | Check extension popup memory. | NOT_STARTED | — |
| OGVPN-1094 | 1094 | Check Android memory during long connection. | NOT_STARTED | — |
| OGVPN-1095 | 1095 | Check Android memory after repeated connect/disconnect. | NOT_STARTED | — |
| OGVPN-1096 | 1096 | Check Android CPU while connected. | NOT_STARTED | — |
| OGVPN-1097 | 1097 | Check Android battery drain while connected. | NOT_STARTED | — |
| OGVPN-1098 | 1098 | Check Desktop memory while connected. | NOT_STARTED | — |
| OGVPN-1099 | 1099 | Check Desktop CPU while connected. | NOT_STARTED | — |
| OGVPN-1100 | 1100 | Check Desktop resource cleanup after disconnect. | NOT_STARTED | — |
| OGVPN-1101 | 1101 | Check background resource usage. | NOT_STARTED | — |
| OGVPN-1102 | 1102 | Check timer cleanup. | NOT_STARTED | — |
| OGVPN-1103 | 1103 | Check event-listener cleanup. | NOT_STARTED | — |
| OGVPN-1104 | 1104 | Check subscription cleanup. | NOT_STARTED | — |
| OGVPN-1105 | 1105 | Check websocket cleanup. | NOT_STARTED | — |
| OGVPN-1106 | 1106 | Check retry timer cleanup. | NOT_STARTED | — |
| OGVPN-1107 | 1107 | Check VPN process cleanup. | NOT_STARTED | — |
| OGVPN-1108 | 1108 | Check orphan process cleanup. | NOT_STARTED | — |
| OGVPN-1109 | 1109 | Check repeated navigation for leaks. | NOT_STARTED | — |
| OGVPN-1110 | 1110 | Check long-duration stability. | NOT_STARTED | — |
| OGVPN-1111 | 1111 | Check resource behavior after errors. | NOT_STARTED | — |
| OGVPN-1112 | 1112 | Fix measurable leaks rather than merely documenting them. | NOT_STARTED | — |
### 51. Accessibility Core

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1113 | 1113 | Verify semantic structure. | NOT_STARTED | — |
| OGVPN-1114 | 1114 | Verify heading hierarchy. | NOT_STARTED | — |
| OGVPN-1115 | 1115 | Verify landmarks. | NOT_STARTED | — |
| OGVPN-1116 | 1116 | Verify accessible names. | NOT_STARTED | — |
| OGVPN-1117 | 1117 | Verify accessible descriptions where needed. | NOT_STARTED | — |
| OGVPN-1118 | 1118 | Verify keyboard navigation. | NOT_STARTED | — |
| OGVPN-1119 | 1119 | Verify visible focus. | NOT_STARTED | — |
| OGVPN-1120 | 1120 | Verify focus order. | NOT_STARTED | — |
| OGVPN-1121 | 1121 | Verify focus restoration. | NOT_STARTED | — |
| OGVPN-1122 | 1122 | Verify dialog focus containment. | NOT_STARTED | — |
| OGVPN-1123 | 1123 | Verify screen-reader announcements. | NOT_STARTED | — |
| OGVPN-1124 | 1124 | Verify form error association. | NOT_STARTED | — |
| OGVPN-1125 | 1125 | Verify status-message announcements. | NOT_STARTED | — |
| OGVPN-1126 | 1126 | Verify non-color error communication. | NOT_STARTED | — |
| OGVPN-1127 | 1127 | Verify touch target sizing. | NOT_STARTED | — |
| OGVPN-1128 | 1128 | Verify text scaling. | NOT_STARTED | — |
| OGVPN-1129 | 1129 | Verify reduced-motion behavior. | NOT_STARTED | — |
| OGVPN-1130 | 1130 | Verify accessible tables. | NOT_STARTED | — |
| OGVPN-1131 | 1131 | Verify accessible tabs. | NOT_STARTED | — |
| OGVPN-1132 | 1132 | Verify accessible menus. | NOT_STARTED | — |
| OGVPN-1133 | 1133 | Verify accessible comboboxes. | NOT_STARTED | — |
| OGVPN-1134 | 1134 | Verify accessible switches. | NOT_STARTED | — |
| OGVPN-1135 | 1135 | Verify accessible sliders. | NOT_STARTED | — |
### 52. Accessibility Mobile & Desktop

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1136 | 1136 | Test Android TalkBack. | NOT_STARTED | — |
| OGVPN-1137 | 1137 | Test Android font scaling. | NOT_STARTED | — |
| OGVPN-1138 | 1138 | Test Android keyboard navigation where available. | NOT_STARTED | — |
| OGVPN-1139 | 1139 | Test Android touch exploration. | NOT_STARTED | — |
| OGVPN-1140 | 1140 | Test Desktop screen reader where supported. | NOT_STARTED | — |
| OGVPN-1141 | 1141 | Test Desktop keyboard-only use. | NOT_STARTED | — |
| OGVPN-1142 | 1142 | Test Desktop high-text-scale behavior. | NOT_STARTED | — |
| OGVPN-1143 | 1143 | Test browser zoom. | NOT_STARTED | — |
| OGVPN-1144 | 1144 | Test 200% zoom. | NOT_STARTED | — |
| OGVPN-1145 | 1145 | Test 400% zoom where practical. | NOT_STARTED | — |
| OGVPN-1146 | 1146 | Verify no essential content disappears at large text sizes. | NOT_STARTED | — |
| OGVPN-1147 | 1147 | Verify dialogs remain navigable at large text. | NOT_STARTED | — |
| OGVPN-1148 | 1148 | Verify menus remain navigable at large text. | NOT_STARTED | — |
| OGVPN-1149 | 1149 | Verify errors remain associated with fields. | NOT_STARTED | — |
| OGVPN-1150 | 1150 | Verify connection state is announced. | NOT_STARTED | — |
| OGVPN-1151 | 1151 | Verify VPN failures are announced. | NOT_STARTED | — |
| OGVPN-1152 | 1152 | Verify loading is announced. | NOT_STARTED | — |
| OGVPN-1153 | 1153 | Verify success is announced. | NOT_STARTED | — |
| OGVPN-1154 | 1154 | Verify offline is announced. | NOT_STARTED | — |
| OGVPN-1155 | 1155 | Verify disabled state is communicated. | NOT_STARTED | — |
| OGVPN-1156 | 1156 | Verify focus is never lost after async updates. | NOT_STARTED | — |
| OGVPN-1157 | 1157 | Verify keyboard cannot activate unintended destructive actions. | NOT_STARTED | — |
| OGVPN-1158 | 1158 | Verify assistive technology can complete the primary user journey. | NOT_STARTED | — |
### 53. Forms & Input

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1159 | 1159 | Verify required-field validation. | NOT_STARTED | — |
| OGVPN-1160 | 1160 | Verify optional-field behavior. | NOT_STARTED | — |
| OGVPN-1161 | 1161 | Verify type validation. | NOT_STARTED | — |
| OGVPN-1162 | 1162 | Verify length validation. | NOT_STARTED | — |
| OGVPN-1163 | 1163 | Verify pasted content. | NOT_STARTED | — |
| OGVPN-1164 | 1164 | Verify whitespace handling. | NOT_STARTED | — |
| OGVPN-1165 | 1165 | Verify malformed URLs. | NOT_STARTED | — |
| OGVPN-1166 | 1166 | Verify malformed identifiers. | NOT_STARTED | — |
| OGVPN-1167 | 1167 | Verify long input. | NOT_STARTED | — |
| OGVPN-1168 | 1168 | Verify Unicode input. | NOT_STARTED | — |
| OGVPN-1169 | 1169 | Verify emoji input where allowed. | NOT_STARTED | — |
| OGVPN-1170 | 1170 | Verify keyboard type. | NOT_STARTED | — |
| OGVPN-1171 | 1171 | Verify autofill. | NOT_STARTED | — |
| OGVPN-1172 | 1172 | Verify autocomplete. | NOT_STARTED | — |
| OGVPN-1173 | 1173 | Verify input preservation after errors. | NOT_STARTED | — |
| OGVPN-1174 | 1174 | Verify successful submission clears or retains data intentionally. | NOT_STARTED | — |
| OGVPN-1175 | 1175 | Verify duplicate submit protection. | NOT_STARTED | — |
| OGVPN-1176 | 1176 | Verify submit while offline. | NOT_STARTED | — |
| OGVPN-1177 | 1177 | Verify submit after reconnect. | NOT_STARTED | — |
| OGVPN-1178 | 1178 | Verify server validation errors. | NOT_STARTED | — |
| OGVPN-1179 | 1179 | Verify client/server validation consistency. | NOT_STARTED | — |
| OGVPN-1180 | 1180 | Verify focus moves to actionable errors. | NOT_STARTED | — |
| OGVPN-1181 | 1181 | Verify sensitive fields do not leak into logs. | NOT_STARTED | — |
### 54. Error Handling

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1182 | 1182 | Test invalid input. | NOT_STARTED | — |
| OGVPN-1183 | 1183 | Test unauthorized response. | NOT_STARTED | — |
| OGVPN-1184 | 1184 | Test forbidden response. | NOT_STARTED | — |
| OGVPN-1185 | 1185 | Test not found. | NOT_STARTED | — |
| OGVPN-1186 | 1186 | Test conflict. | NOT_STARTED | — |
| OGVPN-1187 | 1187 | Test rate limiting. | NOT_STARTED | — |
| OGVPN-1188 | 1188 | Test timeout. | NOT_STARTED | — |
| OGVPN-1189 | 1189 | Test network failure. | NOT_STARTED | — |
| OGVPN-1190 | 1190 | Test offline. | NOT_STARTED | — |
| OGVPN-1191 | 1191 | Test DNS failure. | NOT_STARTED | — |
| OGVPN-1192 | 1192 | Test malformed response. | NOT_STARTED | — |
| OGVPN-1193 | 1193 | Test server error. | NOT_STARTED | — |
| OGVPN-1194 | 1194 | Test dependency failure. | NOT_STARTED | — |
| OGVPN-1195 | 1195 | Test partial completion. | NOT_STARTED | — |
| OGVPN-1196 | 1196 | Test user cancellation. | NOT_STARTED | — |
| OGVPN-1197 | 1197 | Test app termination during operation. | NOT_STARTED | — |
| OGVPN-1198 | 1198 | Test browser refresh during operation. | NOT_STARTED | — |
| OGVPN-1199 | 1199 | Test duplicate operation. | NOT_STARTED | — |
| OGVPN-1200 | 1200 | Test stale state. | NOT_STARTED | — |
| OGVPN-1201 | 1201 | Test corrupted local state. | NOT_STARTED | — |
| OGVPN-1202 | 1202 | Test expired session. | NOT_STARTED | — |
| OGVPN-1203 | 1203 | Verify every error has recovery guidance. | NOT_STARTED | — |
| OGVPN-1204 | 1204 | Verify no error leaves the UI permanently stuck. | NOT_STARTED | — |
### 55. Loading, Empty, Stale & Offline States

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1205 | 1205 | Verify initial loading. | NOT_STARTED | — |
| OGVPN-1206 | 1206 | Verify inline loading. | NOT_STARTED | — |
| OGVPN-1207 | 1207 | Verify full-screen loading where appropriate. | NOT_STARTED | — |
| OGVPN-1208 | 1208 | Verify action-specific loading. | NOT_STARTED | — |
| OGVPN-1209 | 1209 | Verify empty collection. | NOT_STARTED | — |
| OGVPN-1210 | 1210 | Verify empty search results. | NOT_STARTED | — |
| OGVPN-1211 | 1211 | Verify stale cached data. | NOT_STARTED | — |
| OGVPN-1212 | 1212 | Verify stale data refresh. | NOT_STARTED | — |
| OGVPN-1213 | 1213 | Verify offline initial launch. | NOT_STARTED | — |
| OGVPN-1214 | 1214 | Verify offline after successful use. | NOT_STARTED | — |
| OGVPN-1215 | 1215 | Verify offline during an action. | NOT_STARTED | — |
| OGVPN-1216 | 1216 | Verify reconnect detection. | NOT_STARTED | — |
| OGVPN-1217 | 1217 | Verify retry. | NOT_STARTED | — |
| OGVPN-1218 | 1218 | Verify retry backoff. | NOT_STARTED | — |
| OGVPN-1219 | 1219 | Verify canceled retry. | NOT_STARTED | — |
| OGVPN-1220 | 1220 | Verify partial data. | NOT_STARTED | — |
| OGVPN-1221 | 1221 | Verify degraded functionality. | NOT_STARTED | — |
| OGVPN-1222 | 1222 | Verify disabled actions during unavailable states. | NOT_STARTED | — |
| OGVPN-1223 | 1223 | Verify cached content does not falsely appear current. | NOT_STARTED | — |
| OGVPN-1224 | 1224 | Verify successful recovery removes obsolete error state. | NOT_STARTED | — |
| OGVPN-1225 | 1225 | Verify loading cannot continue forever. | NOT_STARTED | — |
| OGVPN-1226 | 1226 | Verify skeletons match eventual content. | NOT_STARTED | — |
| OGVPN-1227 | 1227 | Verify state transitions are deterministic. | NOT_STARTED | — |
### 56. Overlays, Dialogs & Drawers

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1228 | 1228 | Verify visible close control. | NOT_STARTED | — |
| OGVPN-1229 | 1229 | Verify backdrop dismissal where intended. | NOT_STARTED | — |
| OGVPN-1230 | 1230 | Verify Escape dismissal where intended. | NOT_STARTED | — |
| OGVPN-1231 | 1231 | Verify focus enters the overlay. | NOT_STARTED | — |
| OGVPN-1232 | 1232 | Verify focus remains appropriately contained. | NOT_STARTED | — |
| OGVPN-1233 | 1233 | Verify focus restores to the trigger. | NOT_STARTED | — |
| OGVPN-1234 | 1234 | Verify background scrolling is contained. | NOT_STARTED | — |
| OGVPN-1235 | 1235 | Verify background scrolling restores after close. | NOT_STARTED | — |
| OGVPN-1236 | 1236 | Verify overlay fits 320px width. | NOT_STARTED | — |
| OGVPN-1237 | 1237 | Verify overlay fits 390px width. | NOT_STARTED | — |
| OGVPN-1238 | 1238 | Verify overlay fits 430px width. | NOT_STARTED | — |
| OGVPN-1239 | 1239 | Verify overlay fits tablet width. | NOT_STARTED | — |
| OGVPN-1240 | 1240 | Verify safe-area handling. | NOT_STARTED | — |
| OGVPN-1241 | 1241 | Verify long content scrolls internally. | NOT_STARTED | — |
| OGVPN-1242 | 1242 | Verify short content does not create awkward scroll traps. | NOT_STARTED | — |
| OGVPN-1243 | 1243 | Verify nested overlays have deterministic ownership. | NOT_STARTED | — |
| OGVPN-1244 | 1244 | Verify destructive confirmation cannot be accidentally dismissed into an ambiguous state. | NOT_STARTED | — |
| OGVPN-1245 | 1245 | Verify browser back behavior. | NOT_STARTED | — |
| OGVPN-1246 | 1246 | Verify Android back behavior. | NOT_STARTED | — |
| OGVPN-1247 | 1247 | Verify desktop Escape behavior. | NOT_STARTED | — |
| OGVPN-1248 | 1248 | Verify no invisible pointer blocker remains. | NOT_STARTED | — |
| OGVPN-1249 | 1249 | Verify no hidden overlay remains in the accessibility tree. | NOT_STARTED | — |
### 57. Sidebar & Mobile Menu

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1250 | 1250 | Verify closed state. | NOT_STARTED | — |
| OGVPN-1251 | 1251 | Verify opening state. | NOT_STARTED | — |
| OGVPN-1252 | 1252 | Verify open state. | NOT_STARTED | — |
| OGVPN-1253 | 1253 | Verify closing state. | NOT_STARTED | — |
| OGVPN-1254 | 1254 | Verify after-close state. | NOT_STARTED | — |
| OGVPN-1255 | 1255 | Verify visible close control. | NOT_STARTED | — |
| OGVPN-1256 | 1256 | Verify backdrop. | NOT_STARTED | — |
| OGVPN-1257 | 1257 | Verify safe-area padding. | NOT_STARTED | — |
| OGVPN-1258 | 1258 | Verify internal scrolling. | NOT_STARTED | — |
| OGVPN-1259 | 1259 | Verify long navigation lists. | NOT_STARTED | — |
| OGVPN-1260 | 1260 | Verify active item visibility. | NOT_STARTED | — |
| OGVPN-1261 | 1261 | Verify focus entry. | NOT_STARTED | — |
| OGVPN-1262 | 1262 | Verify focus restoration. | NOT_STARTED | — |
| OGVPN-1263 | 1263 | Verify Escape. | NOT_STARTED | — |
| OGVPN-1264 | 1264 | Verify Android back. | NOT_STARTED | — |
| OGVPN-1265 | 1265 | Verify page-scroll restoration. | NOT_STARTED | — |
| OGVPN-1266 | 1266 | Verify no horizontal clipping. | NOT_STARTED | — |
| OGVPN-1267 | 1267 | Verify no partially off-screen content. | NOT_STARTED | — |
| OGVPN-1268 | 1268 | Verify nested menu behavior. | NOT_STARTED | — |
| OGVPN-1269 | 1269 | Verify menu item actions. | NOT_STARTED | — |
| OGVPN-1270 | 1270 | Verify external-link behavior. | NOT_STARTED | — |
| OGVPN-1271 | 1271 | Verify no pointer interception remains after close. | NOT_STARTED | — |
### 58. Visual QA

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1272 | 1272 | Inspect every rendered web screen. | NOT_STARTED | — |
| OGVPN-1273 | 1273 | Inspect every rendered Android screen. | NOT_STARTED | — |
| OGVPN-1274 | 1274 | Inspect every rendered Desktop screen. | NOT_STARTED | — |
| OGVPN-1275 | 1275 | Inspect the extension popup. | NOT_STARTED | — |
| OGVPN-1276 | 1276 | Inspect every modal. | NOT_STARTED | — |
| OGVPN-1277 | 1277 | Inspect every drawer. | NOT_STARTED | — |
| OGVPN-1278 | 1278 | Inspect every menu. | NOT_STARTED | — |
| OGVPN-1279 | 1279 | Inspect every form. | NOT_STARTED | — |
| OGVPN-1280 | 1280 | Inspect every table. | NOT_STARTED | — |
| OGVPN-1281 | 1281 | Inspect every list. | NOT_STARTED | — |
| OGVPN-1282 | 1282 | Inspect every empty state. | NOT_STARTED | — |
| OGVPN-1283 | 1283 | Inspect every loading state. | NOT_STARTED | — |
| OGVPN-1284 | 1284 | Inspect every error state. | NOT_STARTED | — |
| OGVPN-1285 | 1285 | Inspect every offline state. | NOT_STARTED | — |
| OGVPN-1286 | 1286 | Inspect every success state. | NOT_STARTED | — |
| OGVPN-1287 | 1287 | Inspect every disabled state. | NOT_STARTED | — |
| OGVPN-1288 | 1288 | Inspect every long-content state. | NOT_STARTED | — |
| OGVPN-1289 | 1289 | Inspect every small viewport. | NOT_STARTED | — |
| OGVPN-1290 | 1290 | Inspect every large viewport. | NOT_STARTED | — |
| OGVPN-1291 | 1291 | Inspect every orientation. | NOT_STARTED | — |
| OGVPN-1292 | 1292 | Compare related screens for hierarchy consistency. | NOT_STARTED | — |
| OGVPN-1293 | 1293 | Fix visual defects found in rendered output rather than only source. | NOT_STARTED | — |
### 59. Cognitive UX

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1294 | 1294 | Verify the primary action is obvious. | NOT_STARTED | — |
| OGVPN-1295 | 1295 | Verify secondary actions do not compete with the primary task. | NOT_STARTED | — |
| OGVPN-1296 | 1296 | Verify progressive disclosure reduces unnecessary choices. | NOT_STARTED | — |
| OGVPN-1297 | 1297 | Verify navigation labels match user mental models. | NOT_STARTED | — |
| OGVPN-1298 | 1298 | Verify terminology is consistent. | NOT_STARTED | — |
| OGVPN-1299 | 1299 | Verify important hierarchy survives a squint test. | NOT_STARTED | — |
| OGVPN-1300 | 1300 | Verify related controls are grouped logically. | NOT_STARTED | — |
| OGVPN-1301 | 1301 | Verify destructive actions are separated from routine actions. | NOT_STARTED | — |
| OGVPN-1302 | 1302 | Verify error recovery is visible near the problem. | NOT_STARTED | — |
| OGVPN-1303 | 1303 | Verify users do not need to remember hidden state. | NOT_STARTED | — |
| OGVPN-1304 | 1304 | Verify completed progress is preserved after interruptions. | NOT_STARTED | — |
| OGVPN-1305 | 1305 | Verify long tasks expose meaningful progress. | NOT_STARTED | — |
| OGVPN-1306 | 1306 | Verify irreversible actions are deliberate. | NOT_STARTED | — |
| OGVPN-1307 | 1307 | Verify defaults reduce decision burden. | NOT_STARTED | — |
| OGVPN-1308 | 1308 | Verify choices are minimized where safe. | NOT_STARTED | — |
| OGVPN-1309 | 1309 | Verify advanced options are discoverable without overwhelming beginners. | NOT_STARTED | — |
| OGVPN-1310 | 1310 | Verify confirmation messages answer what happened. | NOT_STARTED | — |
| OGVPN-1311 | 1311 | Verify empty states answer what to do next. | NOT_STARTED | — |
| OGVPN-1312 | 1312 | Verify loading states reduce uncertainty. | NOT_STARTED | — |
| OGVPN-1313 | 1313 | Verify the UI never blames the user for system failures. | NOT_STARTED | — |
| OGVPN-1314 | 1314 | Verify the interface supports rapid repeat tasks. | NOT_STARTED | — |
| OGVPN-1315 | 1315 | Verify every important task has a clear completion signal. | NOT_STARTED | — |
| OGVPN-1316 | 1316 | Verify the product remains understandable without documentation. | NOT_STARTED | — |
### 60. Interaction Integrity

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1317 | 1317 | Verify click actions. | NOT_STARTED | — |
| OGVPN-1318 | 1318 | Verify touch actions. | NOT_STARTED | — |
| OGVPN-1319 | 1319 | Verify pointer actions. | NOT_STARTED | — |
| OGVPN-1320 | 1320 | Verify keyboard actions. | NOT_STARTED | — |
| OGVPN-1321 | 1321 | Verify long press where applicable. | NOT_STARTED | — |
| OGVPN-1322 | 1322 | Verify drag behavior where applicable. | NOT_STARTED | — |
| OGVPN-1323 | 1323 | Verify swipe behavior where applicable. | NOT_STARTED | — |
| OGVPN-1324 | 1324 | Verify submit behavior. | NOT_STARTED | — |
| OGVPN-1325 | 1325 | Verify cancel behavior. | NOT_STARTED | — |
| OGVPN-1326 | 1326 | Verify retry behavior. | NOT_STARTED | — |
| OGVPN-1327 | 1327 | Verify refresh behavior. | NOT_STARTED | — |
| OGVPN-1328 | 1328 | Verify navigation behavior. | NOT_STARTED | — |
| OGVPN-1329 | 1329 | Verify copy behavior. | NOT_STARTED | — |
| OGVPN-1330 | 1330 | Verify download behavior. | NOT_STARTED | — |
| OGVPN-1331 | 1331 | Verify upload behavior. | NOT_STARTED | — |
| OGVPN-1332 | 1332 | Verify delete behavior. | NOT_STARTED | — |
| OGVPN-1333 | 1333 | Verify connect behavior. | NOT_STARTED | — |
| OGVPN-1334 | 1334 | Verify disconnect behavior. | NOT_STARTED | — |
| OGVPN-1335 | 1335 | Verify upgrade behavior. | NOT_STARTED | — |
| OGVPN-1336 | 1336 | Verify support submission. | NOT_STARTED | — |
| OGVPN-1337 | 1337 | Verify every async action disables or guards against duplicates. | NOT_STARTED | — |
| OGVPN-1338 | 1338 | Verify every interaction has a deterministic final state. | NOT_STARTED | — |
### 61. Duplicate Action & Race Protection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1339 | 1339 | Double-click login. | NOT_STARTED | — |
| OGVPN-1340 | 1340 | Double-click connect. | NOT_STARTED | — |
| OGVPN-1341 | 1341 | Double-click disconnect. | NOT_STARTED | — |
| OGVPN-1342 | 1342 | Double-click download. | NOT_STARTED | — |
| OGVPN-1343 | 1343 | Double-click delete. | NOT_STARTED | — |
| OGVPN-1344 | 1344 | Double-click save. | NOT_STARTED | — |
| OGVPN-1345 | 1345 | Double-click payment action. | NOT_STARTED | — |
| OGVPN-1346 | 1346 | Double-click ticket submission. | NOT_STARTED | — |
| OGVPN-1347 | 1347 | Double-click configuration generation. | NOT_STARTED | — |
| OGVPN-1348 | 1348 | Double-click device deletion. | NOT_STARTED | — |
| OGVPN-1349 | 1349 | Trigger connect while disconnecting. | NOT_STARTED | — |
| OGVPN-1350 | 1350 | Trigger disconnect while connecting. | NOT_STARTED | — |
| OGVPN-1351 | 1351 | Change server while connecting. | NOT_STARTED | — |
| OGVPN-1352 | 1352 | Change settings while saving. | NOT_STARTED | — |
| OGVPN-1353 | 1353 | Refresh while saving. | NOT_STARTED | — |
| OGVPN-1354 | 1354 | Navigate away while saving. | NOT_STARTED | — |
| OGVPN-1355 | 1355 | Open the same dialog repeatedly. | NOT_STARTED | — |
| OGVPN-1356 | 1356 | Trigger retry while a request is pending. | NOT_STARTED | — |
| OGVPN-1357 | 1357 | Trigger two pagination requests. | NOT_STARTED | — |
| OGVPN-1358 | 1358 | Trigger two search requests. | NOT_STARTED | — |
| OGVPN-1359 | 1359 | Trigger stale response after newer response. | NOT_STARTED | — |
| OGVPN-1360 | 1360 | Verify only the intended final state survives every race. | NOT_STARTED | — |
### 62. Security Baseline

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1361 | 1361 | Run dependency vulnerability scanning. | NOT_STARTED | — |
| OGVPN-1362 | 1362 | Run static security analysis. | NOT_STARTED | — |
| OGVPN-1363 | 1363 | Check for hardcoded secrets. | NOT_STARTED | — |
| OGVPN-1364 | 1364 | Check for leaked API keys. | NOT_STARTED | — |
| OGVPN-1365 | 1365 | Check for leaked private keys. | NOT_STARTED | — |
| OGVPN-1366 | 1366 | Check for unsafe debug endpoints. | NOT_STARTED | — |
| OGVPN-1367 | 1367 | Check for exposed admin routes. | NOT_STARTED | — |
| OGVPN-1368 | 1368 | Check for missing authorization. | NOT_STARTED | — |
| OGVPN-1369 | 1369 | Check for insecure direct object references. | NOT_STARTED | — |
| OGVPN-1370 | 1370 | Check for injection risks. | NOT_STARTED | — |
| OGVPN-1371 | 1371 | Check for XSS. | NOT_STARTED | — |
| OGVPN-1372 | 1372 | Check for CSRF where relevant. | NOT_STARTED | — |
| OGVPN-1373 | 1373 | Check for SSRF. | NOT_STARTED | — |
| OGVPN-1374 | 1374 | Check for path traversal. | NOT_STARTED | — |
| OGVPN-1375 | 1375 | Check for unsafe deserialization. | NOT_STARTED | — |
| OGVPN-1376 | 1376 | Check for command injection. | NOT_STARTED | — |
| OGVPN-1377 | 1377 | Check for open redirects. | NOT_STARTED | — |
| OGVPN-1378 | 1378 | Check for unsafe file handling. | NOT_STARTED | — |
| OGVPN-1379 | 1379 | Check for sensitive data in logs. | NOT_STARTED | — |
| OGVPN-1380 | 1380 | Check for sensitive data in analytics. | NOT_STARTED | — |
| OGVPN-1381 | 1381 | Check for excessive permissions. | NOT_STARTED | — |
| OGVPN-1382 | 1382 | Check security headers and platform equivalents. | NOT_STARTED | — |
### 63. Web Security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1383 | 1383 | Verify secure transport. | NOT_STARTED | — |
| OGVPN-1384 | 1384 | Verify cookie flags where cookies are used. | NOT_STARTED | — |
| OGVPN-1385 | 1385 | Verify SameSite policy. | NOT_STARTED | — |
| OGVPN-1386 | 1386 | Verify origin validation. | NOT_STARTED | — |
| OGVPN-1387 | 1387 | Verify CORS policy. | NOT_STARTED | — |
| OGVPN-1388 | 1388 | Verify CSRF protection. | NOT_STARTED | — |
| OGVPN-1389 | 1389 | Verify content security policy. | NOT_STARTED | — |
| OGVPN-1390 | 1390 | Verify frame protection. | NOT_STARTED | — |
| OGVPN-1391 | 1391 | Verify referrer policy. | NOT_STARTED | — |
| OGVPN-1392 | 1392 | Verify MIME sniffing protection. | NOT_STARTED | — |
| OGVPN-1393 | 1393 | Verify authorization on API routes. | NOT_STARTED | — |
| OGVPN-1394 | 1394 | Verify rate limits. | NOT_STARTED | — |
| OGVPN-1395 | 1395 | Verify input validation. | NOT_STARTED | — |
| OGVPN-1396 | 1396 | Verify output encoding. | NOT_STARTED | — |
| OGVPN-1397 | 1397 | Verify safe URL handling. | NOT_STARTED | — |
| OGVPN-1398 | 1398 | Verify upload validation. | NOT_STARTED | — |
| OGVPN-1399 | 1399 | Verify download authorization. | NOT_STARTED | — |
| OGVPN-1400 | 1400 | Verify cache behavior for private pages. | NOT_STARTED | — |
| OGVPN-1401 | 1401 | Verify browser storage does not expose secrets unnecessarily. | NOT_STARTED | — |
| OGVPN-1402 | 1402 | Verify logout prevents access to cached private content. | NOT_STARTED | — |
| OGVPN-1403 | 1403 | Verify service-worker caching does not leak private responses. | NOT_STARTED | — |
| OGVPN-1404 | 1404 | Verify production error pages do not expose internals. | NOT_STARTED | — |
### 64. Android Security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1405 | 1405 | Review manifest permissions. | NOT_STARTED | — |
| OGVPN-1406 | 1406 | Review exported components. | NOT_STARTED | — |
| OGVPN-1407 | 1407 | Review deep-link handlers. | NOT_STARTED | — |
| OGVPN-1408 | 1408 | Review intent validation. | NOT_STARTED | — |
| OGVPN-1409 | 1409 | Review network security configuration. | NOT_STARTED | — |
| OGVPN-1410 | 1410 | Review TLS validation. | NOT_STARTED | — |
| OGVPN-1411 | 1411 | Review local storage. | NOT_STARTED | — |
| OGVPN-1412 | 1412 | Review token storage. | NOT_STARTED | — |
| OGVPN-1413 | 1413 | Review backup configuration. | NOT_STARTED | — |
| OGVPN-1414 | 1414 | Review logging. | NOT_STARTED | — |
| OGVPN-1415 | 1415 | Review screenshots and task snapshots. | NOT_STARTED | — |
| OGVPN-1416 | 1416 | Review WebView security if used. | NOT_STARTED | — |
| OGVPN-1417 | 1417 | Review certificate handling. | NOT_STARTED | — |
| OGVPN-1418 | 1418 | Review VPN configuration secrecy. | NOT_STARTED | — |
| OGVPN-1419 | 1419 | Review private-key handling. | NOT_STARTED | — |
| OGVPN-1420 | 1420 | Review release signing. | NOT_STARTED | — |
| OGVPN-1421 | 1421 | Review debug/release separation. | NOT_STARTED | — |
| OGVPN-1422 | 1422 | Review dependency vulnerabilities. | NOT_STARTED | — |
| OGVPN-1423 | 1423 | Review native libraries where used. | NOT_STARTED | — |
| OGVPN-1424 | 1424 | Review root/tampering assumptions without relying on them for security. | NOT_STARTED | — |
| OGVPN-1425 | 1425 | Verify authentication failures do not leak sensitive detail. | NOT_STARTED | — |
| OGVPN-1426 | 1426 | Verify revoked credentials are rejected. | NOT_STARTED | — |
| OGVPN-1427 | 1427 | Verify account data is isolated. | NOT_STARTED | — |
### 65. Desktop Security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1428 | 1428 | Review installer privileges. | NOT_STARTED | — |
| OGVPN-1429 | 1429 | Review auto-update security. | NOT_STARTED | — |
| OGVPN-1430 | 1430 | Review update signature validation. | NOT_STARTED | — |
| OGVPN-1431 | 1431 | Review local credential storage. | NOT_STARTED | — |
| OGVPN-1432 | 1432 | Review file permissions. | NOT_STARTED | — |
| OGVPN-1433 | 1433 | Review service permissions. | NOT_STARTED | — |
| OGVPN-1434 | 1434 | Review VPN adapter permissions. | NOT_STARTED | — |
| OGVPN-1435 | 1435 | Review IPC security. | NOT_STARTED | — |
| OGVPN-1436 | 1436 | Review local ports. | NOT_STARTED | — |
| OGVPN-1437 | 1437 | Review deep-link validation. | NOT_STARTED | — |
| OGVPN-1438 | 1438 | Review protocol handlers. | NOT_STARTED | — |
| OGVPN-1439 | 1439 | Review logs. | NOT_STARTED | — |
| OGVPN-1440 | 1440 | Review crash reports. | NOT_STARTED | — |
| OGVPN-1441 | 1441 | Review secrets. | NOT_STARTED | — |
| OGVPN-1442 | 1442 | Review certificate validation. | NOT_STARTED | — |
| OGVPN-1443 | 1443 | Review TLS. | NOT_STARTED | — |
| OGVPN-1444 | 1444 | Review command execution. | NOT_STARTED | — |
| OGVPN-1445 | 1445 | Review shell invocation. | NOT_STARTED | — |
| OGVPN-1446 | 1446 | Review path handling. | NOT_STARTED | — |
| OGVPN-1447 | 1447 | Review plugin loading. | NOT_STARTED | — |
| OGVPN-1448 | 1448 | Review auto-start behavior. | NOT_STARTED | — |
| OGVPN-1449 | 1449 | Verify uninstall removes sensitive state appropriately. | NOT_STARTED | — |
| OGVPN-1450 | 1450 | Verify unauthorized local users cannot access protected account data. | NOT_STARTED | — |
### 66. Extension Security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1451 | 1451 | Review manifest permissions. | NOT_STARTED | — |
| OGVPN-1452 | 1452 | Review host permissions. | NOT_STARTED | — |
| OGVPN-1453 | 1453 | Review content-script scope. | NOT_STARTED | — |
| OGVPN-1454 | 1454 | Review message passing. | NOT_STARTED | — |
| OGVPN-1455 | 1455 | Review service-worker trust boundaries. | NOT_STARTED | — |
| OGVPN-1456 | 1456 | Review DOM injection. | NOT_STARTED | — |
| OGVPN-1457 | 1457 | Review HTML sanitization. | NOT_STARTED | — |
| OGVPN-1458 | 1458 | Review URL handling. | NOT_STARTED | — |
| OGVPN-1459 | 1459 | Review storage. | NOT_STARTED | — |
| OGVPN-1460 | 1460 | Review token storage. | NOT_STARTED | — |
| OGVPN-1461 | 1461 | Review API authentication. | NOT_STARTED | — |
| OGVPN-1462 | 1462 | Review CORS assumptions. | NOT_STARTED | — |
| OGVPN-1463 | 1463 | Review external messaging. | NOT_STARTED | — |
| OGVPN-1464 | 1464 | Review iframe behavior. | NOT_STARTED | — |
| OGVPN-1465 | 1465 | Review downloads. | NOT_STARTED | — |
| OGVPN-1466 | 1466 | Review clipboard access. | NOT_STARTED | — |
| OGVPN-1467 | 1467 | Review tab access. | NOT_STARTED | — |
| OGVPN-1468 | 1468 | Review webRequest or proxy permissions if used. | NOT_STARTED | — |
| OGVPN-1469 | 1469 | Review incognito handling. | NOT_STARTED | — |
| OGVPN-1470 | 1470 | Review update security. | NOT_STARTED | — |
| OGVPN-1471 | 1471 | Review dependency vulnerabilities. | NOT_STARTED | — |
| OGVPN-1472 | 1472 | Verify extension cannot access unrelated user data. | NOT_STARTED | — |
### 67. Privacy & Data Handling

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1473 | 1473 | Inventory personal data collected. | NOT_STARTED | — |
| OGVPN-1474 | 1474 | Inventory account data. | NOT_STARTED | — |
| OGVPN-1475 | 1475 | Inventory device data. | NOT_STARTED | — |
| OGVPN-1476 | 1476 | Inventory connection data. | NOT_STARTED | — |
| OGVPN-1477 | 1477 | Inventory usage data. | NOT_STARTED | — |
| OGVPN-1478 | 1478 | Inventory billing data. | NOT_STARTED | — |
| OGVPN-1479 | 1479 | Inventory support data. | NOT_STARTED | — |
| OGVPN-1480 | 1480 | Inventory diagnostics. | NOT_STARTED | — |
| OGVPN-1481 | 1481 | Inventory analytics. | NOT_STARTED | — |
| OGVPN-1482 | 1482 | Verify data minimization. | NOT_STARTED | — |
| OGVPN-1483 | 1483 | Verify retention rules. | NOT_STARTED | — |
| OGVPN-1484 | 1484 | Verify deletion rules. | NOT_STARTED | — |
| OGVPN-1485 | 1485 | Verify account deletion propagation. | NOT_STARTED | — |
| OGVPN-1486 | 1486 | Verify export behavior if supported. | NOT_STARTED | — |
| OGVPN-1487 | 1487 | Verify privacy settings. | NOT_STARTED | — |
| OGVPN-1488 | 1488 | Verify consent state where required. | NOT_STARTED | — |
| OGVPN-1489 | 1489 | Verify cookies/storage behavior. | NOT_STARTED | — |
| OGVPN-1490 | 1490 | Verify analytics opt-out behavior. | NOT_STARTED | — |
| OGVPN-1491 | 1491 | Verify logs avoid unnecessary personal data. | NOT_STARTED | — |
| OGVPN-1492 | 1492 | Verify crash reports avoid unnecessary secrets. | NOT_STARTED | — |
| OGVPN-1493 | 1493 | Verify support agents receive only authorized data. | NOT_STARTED | — |
| OGVPN-1494 | 1494 | Verify cross-account isolation. | NOT_STARTED | — |
### 68. Analytics & Telemetry

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1495 | 1495 | Inventory every product event. | NOT_STARTED | — |
| OGVPN-1496 | 1496 | Verify login success event. | NOT_STARTED | — |
| OGVPN-1497 | 1497 | Verify login failure event. | NOT_STARTED | — |
| OGVPN-1498 | 1498 | Verify connection attempt event. | NOT_STARTED | — |
| OGVPN-1499 | 1499 | Verify connection success event. | NOT_STARTED | — |
| OGVPN-1500 | 1500 | Verify connection failure event. | NOT_STARTED | — |
| OGVPN-1501 | 1501 | Verify disconnect event. | NOT_STARTED | — |
| OGVPN-1502 | 1502 | Verify server selection event. | NOT_STARTED | — |
| OGVPN-1503 | 1503 | Verify device event. | NOT_STARTED | — |
| OGVPN-1504 | 1504 | Verify upgrade event. | NOT_STARTED | — |
| OGVPN-1505 | 1505 | Verify billing failure event. | NOT_STARTED | — |
| OGVPN-1506 | 1506 | Verify support event. | NOT_STARTED | — |
| OGVPN-1507 | 1507 | Verify error event. | NOT_STARTED | — |
| OGVPN-1508 | 1508 | Verify offline event where useful. | NOT_STARTED | — |
| OGVPN-1509 | 1509 | Verify events are not duplicated. | NOT_STARTED | — |
| OGVPN-1510 | 1510 | Verify event properties are valid. | NOT_STARTED | — |
| OGVPN-1511 | 1511 | Verify sensitive data is excluded. | NOT_STARTED | — |
| OGVPN-1512 | 1512 | Verify user identifiers are handled consistently. | NOT_STARTED | — |
| OGVPN-1513 | 1513 | Verify platform attribution. | NOT_STARTED | — |
| OGVPN-1514 | 1514 | Verify version attribution. | NOT_STARTED | — |
| OGVPN-1515 | 1515 | Verify analytics failure cannot break core functionality. | NOT_STARTED | — |
| OGVPN-1516 | 1516 | Verify telemetry volume is reasonable. | NOT_STARTED | — |
### 69. Observability

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1517 | 1517 | Verify application logs. | NOT_STARTED | — |
| OGVPN-1518 | 1518 | Verify backend logs. | NOT_STARTED | — |
| OGVPN-1519 | 1519 | Verify Android crash reporting. | NOT_STARTED | — |
| OGVPN-1520 | 1520 | Verify Desktop crash reporting. | NOT_STARTED | — |
| OGVPN-1521 | 1521 | Verify extension errors. | NOT_STARTED | — |
| OGVPN-1522 | 1522 | Verify API metrics. | NOT_STARTED | — |
| OGVPN-1523 | 1523 | Verify VPN connection metrics. | NOT_STARTED | — |
| OGVPN-1524 | 1524 | Verify server health metrics. | NOT_STARTED | — |
| OGVPN-1525 | 1525 | Verify database metrics. | NOT_STARTED | — |
| OGVPN-1526 | 1526 | Verify queue/job metrics. | NOT_STARTED | — |
| OGVPN-1527 | 1527 | Verify latency metrics. | NOT_STARTED | — |
| OGVPN-1528 | 1528 | Verify error-rate metrics. | NOT_STARTED | — |
| OGVPN-1529 | 1529 | Verify authentication failure metrics. | NOT_STARTED | — |
| OGVPN-1530 | 1530 | Verify billing failure metrics. | NOT_STARTED | — |
| OGVPN-1531 | 1531 | Verify reconnect metrics. | NOT_STARTED | — |
| OGVPN-1532 | 1532 | Verify alert thresholds. | NOT_STARTED | — |
| OGVPN-1533 | 1533 | Verify alerts are actionable. | NOT_STARTED | — |
| OGVPN-1534 | 1534 | Verify logs have correlation IDs where appropriate. | NOT_STARTED | — |
| OGVPN-1535 | 1535 | Verify sensitive data is redacted. | NOT_STARTED | — |
| OGVPN-1536 | 1536 | Verify incident investigation can trace a user-visible failure. | NOT_STARTED | — |
| OGVPN-1537 | 1537 | Verify monitoring survives deployment. | NOT_STARTED | — |
| OGVPN-1538 | 1538 | Verify dashboards reflect real production health. | NOT_STARTED | — |
### 70. Jobs, Queues & Background Work

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1539 | 1539 | Inventory background jobs. | NOT_STARTED | — |
| OGVPN-1540 | 1540 | Verify job scheduling. | NOT_STARTED | — |
| OGVPN-1541 | 1541 | Verify job execution. | NOT_STARTED | — |
| OGVPN-1542 | 1542 | Verify job retry. | NOT_STARTED | — |
| OGVPN-1543 | 1543 | Verify retry backoff. | NOT_STARTED | — |
| OGVPN-1544 | 1544 | Verify dead-letter behavior. | NOT_STARTED | — |
| OGVPN-1545 | 1545 | Verify duplicate job protection. | NOT_STARTED | — |
| OGVPN-1546 | 1546 | Verify idempotency. | NOT_STARTED | — |
| OGVPN-1547 | 1547 | Verify job cancellation. | NOT_STARTED | — |
| OGVPN-1548 | 1548 | Verify job timeout. | NOT_STARTED | — |
| OGVPN-1549 | 1549 | Verify partial failure. | NOT_STARTED | — |
| OGVPN-1550 | 1550 | Verify job recovery after process restart. | NOT_STARTED | — |
| OGVPN-1551 | 1551 | Verify job recovery after deployment. | NOT_STARTED | — |
| OGVPN-1552 | 1552 | Verify stale job cleanup. | NOT_STARTED | — |
| OGVPN-1553 | 1553 | Verify notification jobs. | NOT_STARTED | — |
| OGVPN-1554 | 1554 | Verify billing jobs. | NOT_STARTED | — |
| OGVPN-1555 | 1555 | Verify VPN maintenance jobs. | NOT_STARTED | — |
| OGVPN-1556 | 1556 | Verify analytics jobs. | NOT_STARTED | — |
| OGVPN-1557 | 1557 | Verify database cleanup jobs. | NOT_STARTED | — |
| OGVPN-1558 | 1558 | Verify monitoring jobs. | NOT_STARTED | — |
| OGVPN-1559 | 1559 | Verify queue saturation handling. | NOT_STARTED | — |
| OGVPN-1560 | 1560 | Verify user-facing state matches job state. | NOT_STARTED | — |
### 71. File Upload & Download

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1561 | 1561 | Verify upload validation. | NOT_STARTED | — |
| OGVPN-1562 | 1562 | Verify file type validation. | NOT_STARTED | — |
| OGVPN-1563 | 1563 | Verify file size validation. | NOT_STARTED | — |
| OGVPN-1564 | 1564 | Verify malformed files. | NOT_STARTED | — |
| OGVPN-1565 | 1565 | Verify interrupted upload. | NOT_STARTED | — |
| OGVPN-1566 | 1566 | Verify retry upload. | NOT_STARTED | — |
| OGVPN-1567 | 1567 | Verify duplicate upload. | NOT_STARTED | — |
| OGVPN-1568 | 1568 | Verify download authorization. | NOT_STARTED | — |
| OGVPN-1569 | 1569 | Verify interrupted download. | NOT_STARTED | — |
| OGVPN-1570 | 1570 | Verify retry download. | NOT_STARTED | — |
| OGVPN-1571 | 1571 | Verify filename safety. | NOT_STARTED | — |
| OGVPN-1572 | 1572 | Verify path safety. | NOT_STARTED | — |
| OGVPN-1573 | 1573 | Verify content disposition. | NOT_STARTED | — |
| OGVPN-1574 | 1574 | Verify large files. | NOT_STARTED | — |
| OGVPN-1575 | 1575 | Verify mobile download behavior. | NOT_STARTED | — |
| OGVPN-1576 | 1576 | Verify desktop download behavior. | NOT_STARTED | — |
| OGVPN-1577 | 1577 | Verify extension download behavior. | NOT_STARTED | — |
| OGVPN-1578 | 1578 | Verify Android share/open behavior where applicable. | NOT_STARTED | — |
| OGVPN-1579 | 1579 | Verify temporary-file cleanup. | NOT_STARTED | — |
| OGVPN-1580 | 1580 | Verify sensitive configuration files are protected. | NOT_STARTED | — |
| OGVPN-1581 | 1581 | Verify revoked configurations cannot be downloaded. | NOT_STARTED | — |
| OGVPN-1582 | 1582 | Verify successful files are actually usable. | NOT_STARTED | — |
### 72. Deep Links & External Launch

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1583 | 1583 | Verify web deep links. | NOT_STARTED | — |
| OGVPN-1584 | 1584 | Verify Android app links. | NOT_STARTED | — |
| OGVPN-1585 | 1585 | Verify desktop protocol links. | NOT_STARTED | — |
| OGVPN-1586 | 1586 | Verify extension links. | NOT_STARTED | — |
| OGVPN-1587 | 1587 | Verify logged-out deep links. | NOT_STARTED | — |
| OGVPN-1588 | 1588 | Verify logged-in deep links. | NOT_STARTED | — |
| OGVPN-1589 | 1589 | Verify malformed links. | NOT_STARTED | — |
| OGVPN-1590 | 1590 | Verify expired links. | NOT_STARTED | — |
| OGVPN-1591 | 1591 | Verify revoked links. | NOT_STARTED | — |
| OGVPN-1592 | 1592 | Verify unknown routes. | NOT_STARTED | — |
| OGVPN-1593 | 1593 | Verify links from email where applicable. | NOT_STARTED | — |
| OGVPN-1594 | 1594 | Verify links from notifications. | NOT_STARTED | — |
| OGVPN-1595 | 1595 | Verify links from support content. | NOT_STARTED | — |
| OGVPN-1596 | 1596 | Verify browser fallback. | NOT_STARTED | — |
| OGVPN-1597 | 1597 | Verify platform fallback. | NOT_STARTED | — |
| OGVPN-1598 | 1598 | Verify duplicate launches. | NOT_STARTED | — |
| OGVPN-1599 | 1599 | Verify unsafe external URLs. | NOT_STARTED | — |
| OGVPN-1600 | 1600 | Verify URL encoding. | NOT_STARTED | — |
| OGVPN-1601 | 1601 | Verify query parameters. | NOT_STARTED | — |
| OGVPN-1602 | 1602 | Verify fragments. | NOT_STARTED | — |
| OGVPN-1603 | 1603 | Verify return-to-destination after authentication. | NOT_STARTED | — |
| OGVPN-1604 | 1604 | Verify no open redirect. | NOT_STARTED | — |
| OGVPN-1605 | 1605 | Verify deep links never bypass authorization. | NOT_STARTED | — |
### 73. Notifications Cross-Platform

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1606 | 1606 | Verify web notifications if supported. | NOT_STARTED | — |
| OGVPN-1607 | 1607 | Verify Android notifications. | NOT_STARTED | — |
| OGVPN-1608 | 1608 | Verify Desktop notifications. | NOT_STARTED | — |
| OGVPN-1609 | 1609 | Verify extension notifications. | NOT_STARTED | — |
| OGVPN-1610 | 1610 | Verify permission prompts. | NOT_STARTED | — |
| OGVPN-1611 | 1611 | Verify permission denial. | NOT_STARTED | — |
| OGVPN-1612 | 1612 | Verify notification content. | NOT_STARTED | — |
| OGVPN-1613 | 1613 | Verify notification actions. | NOT_STARTED | — |
| OGVPN-1614 | 1614 | Verify notification navigation. | NOT_STARTED | — |
| OGVPN-1615 | 1615 | Verify duplicate prevention. | NOT_STARTED | — |
| OGVPN-1616 | 1616 | Verify stale notification cleanup. | NOT_STARTED | — |
| OGVPN-1617 | 1617 | Verify account isolation. | NOT_STARTED | — |
| OGVPN-1618 | 1618 | Verify logout handling. | NOT_STARTED | — |
| OGVPN-1619 | 1619 | Verify device targeting. | NOT_STARTED | — |
| OGVPN-1620 | 1620 | Verify connection failure notification. | NOT_STARTED | — |
| OGVPN-1621 | 1621 | Verify connection recovery notification. | NOT_STARTED | — |
| OGVPN-1622 | 1622 | Verify billing notification. | NOT_STARTED | — |
| OGVPN-1623 | 1623 | Verify security notification. | NOT_STARTED | — |
| OGVPN-1624 | 1624 | Verify support notification. | NOT_STARTED | — |
| OGVPN-1625 | 1625 | Verify quiet/preference settings. | NOT_STARTED | — |
| OGVPN-1626 | 1626 | Verify offline queuing behavior. | NOT_STARTED | — |
| OGVPN-1627 | 1627 | Verify notification analytics without sensitive content. | NOT_STARTED | — |
### 74. Localization & Time

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1628 | 1628 | Verify locale selection. | NOT_STARTED | — |
| OGVPN-1629 | 1629 | Verify default locale. | NOT_STARTED | — |
| OGVPN-1630 | 1630 | Verify date formatting. | NOT_STARTED | — |
| OGVPN-1631 | 1631 | Verify time formatting. | NOT_STARTED | — |
| OGVPN-1632 | 1632 | Verify timezone handling. | NOT_STARTED | — |
| OGVPN-1633 | 1633 | Verify daylight-saving transitions where relevant. | NOT_STARTED | — |
| OGVPN-1634 | 1634 | Verify relative timestamps. | NOT_STARTED | — |
| OGVPN-1635 | 1635 | Verify billing dates. | NOT_STARTED | — |
| OGVPN-1636 | 1636 | Verify subscription expiration dates. | NOT_STARTED | — |
| OGVPN-1637 | 1637 | Verify usage periods. | NOT_STARTED | — |
| OGVPN-1638 | 1638 | Verify server maintenance times. | NOT_STARTED | — |
| OGVPN-1639 | 1639 | Verify notification timestamps. | NOT_STARTED | — |
| OGVPN-1640 | 1640 | Verify long translated strings. | NOT_STARTED | — |
| OGVPN-1641 | 1641 | Verify short translated strings. | NOT_STARTED | — |
| OGVPN-1642 | 1642 | Verify right-to-left behavior if supported. | NOT_STARTED | — |
| OGVPN-1643 | 1643 | Verify number formatting. | NOT_STARTED | — |
| OGVPN-1644 | 1644 | Verify currency formatting. | NOT_STARTED | — |
| OGVPN-1645 | 1645 | Verify pluralization. | NOT_STARTED | — |
| OGVPN-1646 | 1646 | Verify locale persistence. | NOT_STARTED | — |
| OGVPN-1647 | 1647 | Verify locale changes without stale strings. | NOT_STARTED | — |
| OGVPN-1648 | 1648 | Verify accessible pronunciation of dates. | NOT_STARTED | — |
| OGVPN-1649 | 1649 | Verify server-side timestamps remain unambiguous. | NOT_STARTED | — |
| OGVPN-1650 | 1650 | Verify logs use a consistent machine-readable time standard. | NOT_STARTED | — |
### 75. Browser Matrix

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1651 | 1651 | Test current Chrome. | NOT_STARTED | — |
| OGVPN-1652 | 1652 | Test current Edge. | NOT_STARTED | — |
| OGVPN-1653 | 1653 | Test current Firefox where supported. | NOT_STARTED | — |
| OGVPN-1654 | 1654 | Test current Safari where supported. | NOT_STARTED | — |
| OGVPN-1655 | 1655 | Test Android Chrome. | NOT_STARTED | — |
| OGVPN-1656 | 1656 | Test iOS Safari if the web app is intended to support it. | NOT_STARTED | — |
| OGVPN-1657 | 1657 | Test desktop zoom. | NOT_STARTED | — |
| OGVPN-1658 | 1658 | Test mobile browser zoom. | NOT_STARTED | — |
| OGVPN-1659 | 1659 | Test private browsing where supported. | NOT_STARTED | — |
| OGVPN-1660 | 1660 | Test browser restart. | NOT_STARTED | — |
| OGVPN-1661 | 1661 | Test browser tab duplication. | NOT_STARTED | — |
| OGVPN-1662 | 1662 | Test multiple tabs. | NOT_STARTED | — |
| OGVPN-1663 | 1663 | Test back/forward cache. | NOT_STARTED | — |
| OGVPN-1664 | 1664 | Test service-worker updates. | NOT_STARTED | — |
| OGVPN-1665 | 1665 | Test storage disabled or restricted. | NOT_STARTED | — |
| OGVPN-1666 | 1666 | Test third-party-cookie restrictions where relevant. | NOT_STARTED | — |
| OGVPN-1667 | 1667 | Test slow network. | NOT_STARTED | — |
| OGVPN-1668 | 1668 | Test offline. | NOT_STARTED | — |
| OGVPN-1669 | 1669 | Test browser extensions interacting with the site. | NOT_STARTED | — |
| OGVPN-1670 | 1670 | Test popup blocking. | NOT_STARTED | — |
| OGVPN-1671 | 1671 | Test downloads. | NOT_STARTED | — |
| OGVPN-1672 | 1672 | Test clipboard permissions. | NOT_STARTED | — |
| OGVPN-1673 | 1673 | Verify declared browser support matches reality. | NOT_STARTED | — |
### 76. Mobile Browser Matrix

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1674 | 1674 | Test 320px width. | NOT_STARTED | — |
| OGVPN-1675 | 1675 | Test 390px width. | NOT_STARTED | — |
| OGVPN-1676 | 1676 | Test 430px width. | NOT_STARTED | — |
| OGVPN-1677 | 1677 | Test portrait. | NOT_STARTED | — |
| OGVPN-1678 | 1678 | Test landscape. | NOT_STARTED | — |
| OGVPN-1679 | 1679 | Test keyboard open. | NOT_STARTED | — |
| OGVPN-1680 | 1680 | Test keyboard closed. | NOT_STARTED | — |
| OGVPN-1681 | 1681 | Test URL bar expanded. | NOT_STARTED | — |
| OGVPN-1682 | 1682 | Test URL bar collapsed. | NOT_STARTED | — |
| OGVPN-1683 | 1683 | Test safe areas. | NOT_STARTED | — |
| OGVPN-1684 | 1684 | Test touch scrolling. | NOT_STARTED | — |
| OGVPN-1685 | 1685 | Test touch selection. | NOT_STARTED | — |
| OGVPN-1686 | 1686 | Test long press. | NOT_STARTED | — |
| OGVPN-1687 | 1687 | Test pull-to-refresh interaction. | NOT_STARTED | — |
| OGVPN-1688 | 1688 | Test browser back. | NOT_STARTED | — |
| OGVPN-1689 | 1689 | Test page refresh. | NOT_STARTED | — |
| OGVPN-1690 | 1690 | Test interrupted requests. | NOT_STARTED | — |
| OGVPN-1691 | 1691 | Test offline. | NOT_STARTED | — |
| OGVPN-1692 | 1692 | Test reconnect. | NOT_STARTED | — |
| OGVPN-1693 | 1693 | Test slow network. | NOT_STARTED | — |
| OGVPN-1694 | 1694 | Test low-memory browser recovery. | NOT_STARTED | — |
| OGVPN-1695 | 1695 | Test screen rotation. | NOT_STARTED | — |
| OGVPN-1696 | 1696 | Test text scaling. | NOT_STARTED | — |
| OGVPN-1697 | 1697 | Verify no mobile-only interaction is required without an alternative. | NOT_STARTED | — |
### 77. Desktop Window & Input Matrix

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1698 | 1698 | Test minimum window size. | NOT_STARTED | — |
| OGVPN-1699 | 1699 | Test medium window. | NOT_STARTED | — |
| OGVPN-1700 | 1700 | Test large window. | NOT_STARTED | — |
| OGVPN-1701 | 1701 | Test maximize. | NOT_STARTED | — |
| OGVPN-1702 | 1702 | Test restore. | NOT_STARTED | — |
| OGVPN-1703 | 1703 | Test minimize. | NOT_STARTED | — |
| OGVPN-1704 | 1704 | Test close. | NOT_STARTED | — |
| OGVPN-1705 | 1705 | Test reopen. | NOT_STARTED | — |
| OGVPN-1706 | 1706 | Test keyboard-only. | NOT_STARTED | — |
| OGVPN-1707 | 1707 | Test mouse-only. | NOT_STARTED | — |
| OGVPN-1708 | 1708 | Test touch-enabled desktop where applicable. | NOT_STARTED | — |
| OGVPN-1709 | 1709 | Test high DPI. | NOT_STARTED | — |
| OGVPN-1710 | 1710 | Test multiple monitors. | NOT_STARTED | — |
| OGVPN-1711 | 1711 | Test moving windows between monitors. | NOT_STARTED | — |
| OGVPN-1712 | 1712 | Test display scaling changes. | NOT_STARTED | — |
| OGVPN-1713 | 1713 | Test system font scaling. | NOT_STARTED | — |
| OGVPN-1714 | 1714 | Test OS theme changes. | NOT_STARTED | — |
| OGVPN-1715 | 1715 | Test sleep/resume. | NOT_STARTED | — |
| OGVPN-1716 | 1716 | Test focus loss. | NOT_STARTED | — |
| OGVPN-1717 | 1717 | Test focus restore. | NOT_STARTED | — |
| OGVPN-1718 | 1718 | Test clipboard. | NOT_STARTED | — |
| OGVPN-1719 | 1719 | Test file picker. | NOT_STARTED | — |
| OGVPN-1720 | 1720 | Test native permission dialogs. | NOT_STARTED | — |
| OGVPN-1721 | 1721 | Verify no content becomes unreachable at supported window sizes. | NOT_STARTED | — |
### 78. Concurrent Users & Devices

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1722 | 1722 | Test two web sessions for one account. | NOT_STARTED | — |
| OGVPN-1723 | 1723 | Test web plus Android. | NOT_STARTED | — |
| OGVPN-1724 | 1724 | Test web plus Desktop. | NOT_STARTED | — |
| OGVPN-1725 | 1725 | Test web plus Extension. | NOT_STARTED | — |
| OGVPN-1726 | 1726 | Test Android plus Desktop. | NOT_STARTED | — |
| OGVPN-1727 | 1727 | Test multiple Android devices. | NOT_STARTED | — |
| OGVPN-1728 | 1728 | Test multiple Desktop devices. | NOT_STARTED | — |
| OGVPN-1729 | 1729 | Test connection from two devices. | NOT_STARTED | — |
| OGVPN-1730 | 1730 | Test device-limit enforcement. | NOT_STARTED | — |
| OGVPN-1731 | 1731 | Test simultaneous configuration generation. | NOT_STARTED | — |
| OGVPN-1732 | 1732 | Test simultaneous settings updates. | NOT_STARTED | — |
| OGVPN-1733 | 1733 | Test simultaneous billing changes. | NOT_STARTED | — |
| OGVPN-1734 | 1734 | Test simultaneous device deletion. | NOT_STARTED | — |
| OGVPN-1735 | 1735 | Test simultaneous support updates. | NOT_STARTED | — |
| OGVPN-1736 | 1736 | Test simultaneous logout. | NOT_STARTED | — |
| OGVPN-1737 | 1737 | Test session revocation propagation. | NOT_STARTED | — |
| OGVPN-1738 | 1738 | Test stale client state. | NOT_STARTED | — |
| OGVPN-1739 | 1739 | Test out-of-order responses. | NOT_STARTED | — |
| OGVPN-1740 | 1740 | Test concurrent reconnects. | NOT_STARTED | — |
| OGVPN-1741 | 1741 | Test server capacity limits. | NOT_STARTED | — |
| OGVPN-1742 | 1742 | Test race-safe final state. | NOT_STARTED | — |
| OGVPN-1743 | 1743 | Verify no cross-account contamination. | NOT_STARTED | — |
### 79. Load & Stress

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1744 | 1744 | Load-test authentication. | NOT_STARTED | — |
| OGVPN-1745 | 1745 | Load-test dashboard. | NOT_STARTED | — |
| OGVPN-1746 | 1746 | Load-test server listing. | NOT_STARTED | — |
| OGVPN-1747 | 1747 | Load-test device listing. | NOT_STARTED | — |
| OGVPN-1748 | 1748 | Load-test configuration generation. | NOT_STARTED | — |
| OGVPN-1749 | 1749 | Load-test connection state polling. | NOT_STARTED | — |
| OGVPN-1750 | 1750 | Load-test notifications. | NOT_STARTED | — |
| OGVPN-1751 | 1751 | Load-test support tickets. | NOT_STARTED | — |
| OGVPN-1752 | 1752 | Load-test billing webhooks. | NOT_STARTED | — |
| OGVPN-1753 | 1753 | Load-test analytics. | NOT_STARTED | — |
| OGVPN-1754 | 1754 | Load-test health endpoints. | NOT_STARTED | — |
| OGVPN-1755 | 1755 | Load-test database reads. | NOT_STARTED | — |
| OGVPN-1756 | 1756 | Load-test database writes. | NOT_STARTED | — |
| OGVPN-1757 | 1757 | Load-test cache. | NOT_STARTED | — |
| OGVPN-1758 | 1758 | Load-test queue workers. | NOT_STARTED | — |
| OGVPN-1759 | 1759 | Stress repeated login/logout. | NOT_STARTED | — |
| OGVPN-1760 | 1760 | Stress repeated connect/disconnect. | NOT_STARTED | — |
| OGVPN-1761 | 1761 | Stress rapid server changes. | NOT_STARTED | — |
| OGVPN-1762 | 1762 | Stress large device counts. | NOT_STARTED | — |
| OGVPN-1763 | 1763 | Stress large server counts. | NOT_STARTED | — |
| OGVPN-1764 | 1764 | Stress concurrent users. | NOT_STARTED | — |
| OGVPN-1765 | 1765 | Verify degradation is graceful and observable. | NOT_STARTED | — |
### 80. Soak & Reliability

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1766 | 1766 | Run long-duration web sessions. | NOT_STARTED | — |
| OGVPN-1767 | 1767 | Run long-duration Android VPN sessions. | NOT_STARTED | — |
| OGVPN-1768 | 1768 | Run long-duration Desktop VPN sessions. | NOT_STARTED | — |
| OGVPN-1769 | 1769 | Run long-duration extension usage. | NOT_STARTED | — |
| OGVPN-1770 | 1770 | Monitor memory growth. | NOT_STARTED | — |
| OGVPN-1771 | 1771 | Monitor CPU growth. | NOT_STARTED | — |
| OGVPN-1772 | 1772 | Monitor battery behavior. | NOT_STARTED | — |
| OGVPN-1773 | 1773 | Monitor reconnect count. | NOT_STARTED | — |
| OGVPN-1774 | 1774 | Monitor error count. | NOT_STARTED | — |
| OGVPN-1775 | 1775 | Monitor API latency. | NOT_STARTED | — |
| OGVPN-1776 | 1776 | Monitor database health. | NOT_STARTED | — |
| OGVPN-1777 | 1777 | Monitor queue health. | NOT_STARTED | — |
| OGVPN-1778 | 1778 | Monitor server health. | NOT_STARTED | — |
| OGVPN-1779 | 1779 | Monitor stale sessions. | NOT_STARTED | — |
| OGVPN-1780 | 1780 | Monitor stale connections. | NOT_STARTED | — |
| OGVPN-1781 | 1781 | Monitor orphan resources. | NOT_STARTED | — |
| OGVPN-1782 | 1782 | Test periodic refresh. | NOT_STARTED | — |
| OGVPN-1783 | 1783 | Test repeated navigation. | NOT_STARTED | — |
| OGVPN-1784 | 1784 | Test repeated background/foreground. | NOT_STARTED | — |
| OGVPN-1785 | 1785 | Test repeated sleep/resume. | NOT_STARTED | — |
| OGVPN-1786 | 1786 | Test repeated network switching. | NOT_STARTED | — |
| OGVPN-1787 | 1787 | Test repeated app restart. | NOT_STARTED | — |
| OGVPN-1788 | 1788 | Verify no gradual degradation. | NOT_STARTED | — |
### 81. Backup & Disaster Recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1789 | 1789 | Verify database backups. | NOT_STARTED | — |
| OGVPN-1790 | 1790 | Verify backup encryption. | NOT_STARTED | — |
| OGVPN-1791 | 1791 | Verify backup retention. | NOT_STARTED | — |
| OGVPN-1792 | 1792 | Verify backup restoration. | NOT_STARTED | — |
| OGVPN-1793 | 1793 | Verify point-in-time recovery where supported. | NOT_STARTED | — |
| OGVPN-1794 | 1794 | Verify application configuration backup. | NOT_STARTED | — |
| OGVPN-1795 | 1795 | Verify infrastructure configuration recovery. | NOT_STARTED | — |
| OGVPN-1796 | 1796 | Verify server inventory recovery. | NOT_STARTED | — |
| OGVPN-1797 | 1797 | Verify account data recovery. | NOT_STARTED | — |
| OGVPN-1798 | 1798 | Verify billing data recovery. | NOT_STARTED | — |
| OGVPN-1799 | 1799 | Verify support data recovery. | NOT_STARTED | — |
| OGVPN-1800 | 1800 | Verify analytics recovery policy. | NOT_STARTED | — |
| OGVPN-1801 | 1801 | Verify VPN configuration recovery policy. | NOT_STARTED | — |
| OGVPN-1802 | 1802 | Verify secrets recovery process. | NOT_STARTED | — |
| OGVPN-1803 | 1803 | Verify key rotation after compromise. | NOT_STARTED | — |
| OGVPN-1804 | 1804 | Verify disaster runbook. | NOT_STARTED | — |
| OGVPN-1805 | 1805 | Verify restore in an isolated environment. | NOT_STARTED | — |
| OGVPN-1806 | 1806 | Verify restored application can authenticate. | NOT_STARTED | — |
| OGVPN-1807 | 1807 | Verify restored application can load dashboard. | NOT_STARTED | — |
| OGVPN-1808 | 1808 | Verify restored application can manage devices. | NOT_STARTED | — |
| OGVPN-1809 | 1809 | Verify restored control plane can recover connections. | NOT_STARTED | — |
| OGVPN-1810 | 1810 | Record recovery time and recovery point results. | NOT_STARTED | — |
### 82. Deployment & CI/CD

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1811 | 1811 | Verify CI runs lint. | NOT_STARTED | — |
| OGVPN-1812 | 1812 | Verify CI runs type checks. | NOT_STARTED | — |
| OGVPN-1813 | 1813 | Verify CI runs unit tests. | NOT_STARTED | — |
| OGVPN-1814 | 1814 | Verify CI runs integration tests. | NOT_STARTED | — |
| OGVPN-1815 | 1815 | Verify CI runs API tests. | NOT_STARTED | — |
| OGVPN-1816 | 1816 | Verify CI runs E2E tests. | NOT_STARTED | — |
| OGVPN-1817 | 1817 | Verify CI builds web. | NOT_STARTED | — |
| OGVPN-1818 | 1818 | Verify CI builds Android. | NOT_STARTED | — |
| OGVPN-1819 | 1819 | Verify CI builds Desktop. | NOT_STARTED | — |
| OGVPN-1820 | 1820 | Verify CI builds extension. | NOT_STARTED | — |
| OGVPN-1821 | 1821 | Verify CI scans dependencies. | NOT_STARTED | — |
| OGVPN-1822 | 1822 | Verify CI checks secrets. | NOT_STARTED | — |
| OGVPN-1823 | 1823 | Verify CI generates artifacts. | NOT_STARTED | — |
| OGVPN-1824 | 1824 | Verify artifact integrity. | NOT_STARTED | — |
| OGVPN-1825 | 1825 | Verify staging deployment. | NOT_STARTED | — |
| OGVPN-1826 | 1826 | Verify production deployment. | NOT_STARTED | — |
| OGVPN-1827 | 1827 | Verify deployment health checks. | NOT_STARTED | — |
| OGVPN-1828 | 1828 | Verify migration ordering. | NOT_STARTED | — |
| OGVPN-1829 | 1829 | Verify rollback. | NOT_STARTED | — |
| OGVPN-1830 | 1830 | Verify partial deployment handling. | NOT_STARTED | — |
| OGVPN-1831 | 1831 | Verify release notes. | NOT_STARTED | — |
| OGVPN-1832 | 1832 | Verify version metadata. | NOT_STARTED | — |
| OGVPN-1833 | 1833 | Verify failed deployments stop safely. | NOT_STARTED | — |
| OGVPN-1834 | 1834 | Verify production cannot be deployed from an unreviewed broken state. | NOT_STARTED | — |
### 83. Release & Update

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1835 | 1835 | Verify web release. | NOT_STARTED | — |
| OGVPN-1836 | 1836 | Verify Android APK/AAB release. | NOT_STARTED | — |
| OGVPN-1837 | 1837 | Verify Android update over prior version. | NOT_STARTED | — |
| OGVPN-1838 | 1838 | Verify Desktop installer release. | NOT_STARTED | — |
| OGVPN-1839 | 1839 | Verify Desktop update. | NOT_STARTED | — |
| OGVPN-1840 | 1840 | Verify extension package release. | NOT_STARTED | — |
| OGVPN-1841 | 1841 | Verify extension update. | NOT_STARTED | — |
| OGVPN-1842 | 1842 | Verify backend release. | NOT_STARTED | — |
| OGVPN-1843 | 1843 | Verify database migration release. | NOT_STARTED | — |
| OGVPN-1844 | 1844 | Verify backward compatibility. | NOT_STARTED | — |
| OGVPN-1845 | 1845 | Verify client/server version compatibility. | NOT_STARTED | — |
| OGVPN-1846 | 1846 | Verify old clients receive safe responses. | NOT_STARTED | — |
| OGVPN-1847 | 1847 | Verify forced upgrade behavior if required. | NOT_STARTED | — |
| OGVPN-1848 | 1848 | Verify rollback compatibility. | NOT_STARTED | — |
| OGVPN-1849 | 1849 | Verify signed artifacts. | NOT_STARTED | — |
| OGVPN-1850 | 1850 | Verify checksums where used. | NOT_STARTED | — |
| OGVPN-1851 | 1851 | Verify version display. | NOT_STARTED | — |
| OGVPN-1852 | 1852 | Verify release channels. | NOT_STARTED | — |
| OGVPN-1853 | 1853 | Verify staging smoke test. | NOT_STARTED | — |
| OGVPN-1854 | 1854 | Verify production smoke test. | NOT_STARTED | — |
| OGVPN-1855 | 1855 | Verify crash rate after release. | NOT_STARTED | — |
| OGVPN-1856 | 1856 | Verify authentication after release. | NOT_STARTED | — |
| OGVPN-1857 | 1857 | Verify VPN connection after release. | NOT_STARTED | — |
### 84. Billing Edge Cases

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1858 | 1858 | Test new purchase. | NOT_STARTED | — |
| OGVPN-1859 | 1859 | Test successful renewal. | NOT_STARTED | — |
| OGVPN-1860 | 1860 | Test failed renewal. | NOT_STARTED | — |
| OGVPN-1861 | 1861 | Test payment method failure. | NOT_STARTED | — |
| OGVPN-1862 | 1862 | Test cancellation. | NOT_STARTED | — |
| OGVPN-1863 | 1863 | Test cancellation reversal where supported. | NOT_STARTED | — |
| OGVPN-1864 | 1864 | Test expiration. | NOT_STARTED | — |
| OGVPN-1865 | 1865 | Test trial start. | NOT_STARTED | — |
| OGVPN-1866 | 1866 | Test trial expiration. | NOT_STARTED | — |
| OGVPN-1867 | 1867 | Test upgrade during trial. | NOT_STARTED | — |
| OGVPN-1868 | 1868 | Test downgrade during trial. | NOT_STARTED | — |
| OGVPN-1869 | 1869 | Test upgrade while connected. | NOT_STARTED | — |
| OGVPN-1870 | 1870 | Test downgrade while connected. | NOT_STARTED | — |
| OGVPN-1871 | 1871 | Test entitlement delay. | NOT_STARTED | — |
| OGVPN-1872 | 1872 | Test duplicate webhook. | NOT_STARTED | — |
| OGVPN-1873 | 1873 | Test out-of-order webhook. | NOT_STARTED | — |
| OGVPN-1874 | 1874 | Test missing webhook. | NOT_STARTED | — |
| OGVPN-1875 | 1875 | Test refund. | NOT_STARTED | — |
| OGVPN-1876 | 1876 | Test chargeback handling where applicable. | NOT_STARTED | — |
| OGVPN-1877 | 1877 | Test account with no entitlement. | NOT_STARTED | — |
| OGVPN-1878 | 1878 | Test account with expired entitlement. | NOT_STARTED | — |
| OGVPN-1879 | 1879 | Verify server-side limits always match billing state. | NOT_STARTED | — |
### 85. Product Limits & Abuse

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1880 | 1880 | Verify device limits. | NOT_STARTED | — |
| OGVPN-1881 | 1881 | Verify connection limits. | NOT_STARTED | — |
| OGVPN-1882 | 1882 | Verify plan limits. | NOT_STARTED | — |
| OGVPN-1883 | 1883 | Verify server selection limits. | NOT_STARTED | — |
| OGVPN-1884 | 1884 | Verify configuration-generation limits. | NOT_STARTED | — |
| OGVPN-1885 | 1885 | Verify API rate limits. | NOT_STARTED | — |
| OGVPN-1886 | 1886 | Verify authentication rate limits. | NOT_STARTED | — |
| OGVPN-1887 | 1887 | Verify support submission limits. | NOT_STARTED | — |
| OGVPN-1888 | 1888 | Verify notification abuse controls. | NOT_STARTED | — |
| OGVPN-1889 | 1889 | Verify suspicious request handling. | NOT_STARTED | — |
| OGVPN-1890 | 1890 | Verify repeated failed login handling. | NOT_STARTED | — |
| OGVPN-1891 | 1891 | Verify repeated connection attempts. | NOT_STARTED | — |
| OGVPN-1892 | 1892 | Verify malformed request abuse. | NOT_STARTED | — |
| OGVPN-1893 | 1893 | Verify oversized request abuse. | NOT_STARTED | — |
| OGVPN-1894 | 1894 | Verify resource exhaustion protection. | NOT_STARTED | — |
| OGVPN-1895 | 1895 | Verify user-facing limit messages. | NOT_STARTED | — |
| OGVPN-1896 | 1896 | Verify upgrade path from a limit. | NOT_STARTED | — |
| OGVPN-1897 | 1897 | Verify limits are enforced server-side. | NOT_STARTED | — |
| OGVPN-1898 | 1898 | Verify limit state synchronizes across clients. | NOT_STARTED | — |
| OGVPN-1899 | 1899 | Verify limit resets at the correct time. | NOT_STARTED | — |
| OGVPN-1900 | 1900 | Verify timezone-safe reset behavior. | NOT_STARTED | — |
| OGVPN-1901 | 1901 | Verify abuse controls do not lock legitimate users indefinitely. | NOT_STARTED | — |
### 86. Admin & Operations

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1902 | 1902 | Verify admin authentication. | NOT_STARTED | — |
| OGVPN-1903 | 1903 | Verify admin authorization. | NOT_STARTED | — |
| OGVPN-1904 | 1904 | Verify user search. | NOT_STARTED | — |
| OGVPN-1905 | 1905 | Verify user detail. | NOT_STARTED | — |
| OGVPN-1906 | 1906 | Verify device management. | NOT_STARTED | — |
| OGVPN-1907 | 1907 | Verify server management. | NOT_STARTED | — |
| OGVPN-1908 | 1908 | Verify incident management. | NOT_STARTED | — |
| OGVPN-1909 | 1909 | Verify support-ticket management. | NOT_STARTED | — |
| OGVPN-1910 | 1910 | Verify abuse controls. | NOT_STARTED | — |
| OGVPN-1911 | 1911 | Verify audit logs. | NOT_STARTED | — |
| OGVPN-1912 | 1912 | Verify operational metrics. | NOT_STARTED | — |
| OGVPN-1913 | 1913 | Verify admin action confirmation. | NOT_STARTED | — |
| OGVPN-1914 | 1914 | Verify destructive admin action protection. | NOT_STARTED | — |
| OGVPN-1915 | 1915 | Verify admin actions are audited. | NOT_STARTED | — |
| OGVPN-1916 | 1916 | Verify admin data is isolated. | NOT_STARTED | — |
| OGVPN-1917 | 1917 | Verify pagination. | NOT_STARTED | — |
| OGVPN-1918 | 1918 | Verify filters. | NOT_STARTED | — |
| OGVPN-1919 | 1919 | Verify sorting. | NOT_STARTED | — |
| OGVPN-1920 | 1920 | Verify stale data. | NOT_STARTED | — |
| OGVPN-1921 | 1921 | Verify error recovery. | NOT_STARTED | — |
| OGVPN-1922 | 1922 | Verify admin UI remains usable on smaller screens where supported. | NOT_STARTED | — |
| OGVPN-1923 | 1923 | Verify admin actions update user-facing state correctly. | NOT_STARTED | — |
### 87. Audit & Compliance

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1924 | 1924 | Inventory security-sensitive actions. | NOT_STARTED | — |
| OGVPN-1925 | 1925 | Verify authentication audit events. | NOT_STARTED | — |
| OGVPN-1926 | 1926 | Verify logout audit events. | NOT_STARTED | — |
| OGVPN-1927 | 1927 | Verify device changes. | NOT_STARTED | — |
| OGVPN-1928 | 1928 | Verify configuration generation. | NOT_STARTED | — |
| OGVPN-1929 | 1929 | Verify key changes. | NOT_STARTED | — |
| OGVPN-1930 | 1930 | Verify billing changes. | NOT_STARTED | — |
| OGVPN-1931 | 1931 | Verify account deletion. | NOT_STARTED | — |
| OGVPN-1932 | 1932 | Verify admin actions. | NOT_STARTED | — |
| OGVPN-1933 | 1933 | Verify support access. | NOT_STARTED | — |
| OGVPN-1934 | 1934 | Verify incident actions. | NOT_STARTED | — |
| OGVPN-1935 | 1935 | Verify audit timestamps. | NOT_STARTED | — |
| OGVPN-1936 | 1936 | Verify audit actor identity. | NOT_STARTED | — |
| OGVPN-1937 | 1937 | Verify audit target identity. | NOT_STARTED | — |
| OGVPN-1938 | 1938 | Verify audit immutability policy. | NOT_STARTED | — |
| OGVPN-1939 | 1939 | Verify audit retention. | NOT_STARTED | — |
| OGVPN-1940 | 1940 | Verify sensitive data minimization. | NOT_STARTED | — |
| OGVPN-1941 | 1941 | Verify compliance documentation matches behavior. | NOT_STARTED | — |
| OGVPN-1942 | 1942 | Verify privacy policy matches collection. | NOT_STARTED | — |
| OGVPN-1943 | 1943 | Verify terms match actual functionality. | NOT_STARTED | — |
| OGVPN-1944 | 1944 | Verify consent records where required. | NOT_STARTED | — |
| OGVPN-1945 | 1945 | Verify production evidence is retained appropriately. | NOT_STARTED | — |
### 88. Platform Parity

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1946 | 1946 | Map every web feature to Android applicability. | NOT_STARTED | — |
| OGVPN-1947 | 1947 | Map every web feature to Desktop applicability. | NOT_STARTED | — |
| OGVPN-1948 | 1948 | Map every web feature to Extension applicability. | NOT_STARTED | — |
| OGVPN-1949 | 1949 | Identify intentionally platform-specific features. | NOT_STARTED | — |
| OGVPN-1950 | 1950 | Verify naming consistency across platforms. | NOT_STARTED | — |
| OGVPN-1951 | 1951 | Verify account state consistency. | NOT_STARTED | — |
| OGVPN-1952 | 1952 | Verify device state consistency. | NOT_STARTED | — |
| OGVPN-1953 | 1953 | Verify server state consistency. | NOT_STARTED | — |
| OGVPN-1954 | 1954 | Verify subscription state consistency. | NOT_STARTED | — |
| OGVPN-1955 | 1955 | Verify notification consistency. | NOT_STARTED | — |
| OGVPN-1956 | 1956 | Verify support access consistency. | NOT_STARTED | — |
| OGVPN-1957 | 1957 | Verify settings consistency. | NOT_STARTED | — |
| OGVPN-1958 | 1958 | Verify connection-state semantics. | NOT_STARTED | — |
| OGVPN-1959 | 1959 | Verify error semantics. | NOT_STARTED | — |
| OGVPN-1960 | 1960 | Verify loading semantics. | NOT_STARTED | — |
| OGVPN-1961 | 1961 | Verify offline semantics. | NOT_STARTED | — |
| OGVPN-1962 | 1962 | Verify entitlement semantics. | NOT_STARTED | — |
| OGVPN-1963 | 1963 | Verify terminology. | NOT_STARTED | — |
| OGVPN-1964 | 1964 | Verify deep-link behavior. | NOT_STARTED | — |
| OGVPN-1965 | 1965 | Verify logout propagation. | NOT_STARTED | — |
| OGVPN-1966 | 1966 | Verify revoked-device behavior. | NOT_STARTED | — |
| OGVPN-1967 | 1967 | Document any justified parity exceptions. | NOT_STARTED | — |
### 89. Cross-Platform Session Handoff

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1968 | 1968 | Login on web then open Android. | NOT_STARTED | — |
| OGVPN-1969 | 1969 | Login on web then open Desktop. | NOT_STARTED | — |
| OGVPN-1970 | 1970 | Login on web then open Extension. | NOT_STARTED | — |
| OGVPN-1971 | 1971 | Login on Android then open web. | NOT_STARTED | — |
| OGVPN-1972 | 1972 | Login on Desktop then open web. | NOT_STARTED | — |
| OGVPN-1973 | 1973 | Login on Extension then open web. | NOT_STARTED | — |
| OGVPN-1974 | 1974 | Logout on web. | NOT_STARTED | — |
| OGVPN-1975 | 1975 | Verify Android responds to remote logout as intended. | NOT_STARTED | — |
| OGVPN-1976 | 1976 | Verify Desktop responds to remote logout as intended. | NOT_STARTED | — |
| OGVPN-1977 | 1977 | Verify Extension responds to remote logout as intended. | NOT_STARTED | — |
| OGVPN-1978 | 1978 | Revoke a session remotely. | NOT_STARTED | — |
| OGVPN-1979 | 1979 | Verify revoked session behavior. | NOT_STARTED | — |
| OGVPN-1980 | 1980 | Change password. | NOT_STARTED | — |
| OGVPN-1981 | 1981 | Verify session invalidation policy. | NOT_STARTED | — |
| OGVPN-1982 | 1982 | Change subscription. | NOT_STARTED | — |
| OGVPN-1983 | 1983 | Verify entitlement propagation. | NOT_STARTED | — |
| OGVPN-1984 | 1984 | Change device state. | NOT_STARTED | — |
| OGVPN-1985 | 1985 | Verify cross-platform device state. | NOT_STARTED | — |
| OGVPN-1986 | 1986 | Change VPN settings. | NOT_STARTED | — |
| OGVPN-1987 | 1987 | Verify cross-platform settings. | NOT_STARTED | — |
| OGVPN-1988 | 1988 | Connect from one platform. | NOT_STARTED | — |
| OGVPN-1989 | 1989 | Verify status appears correctly on other platforms. | NOT_STARTED | — |
### 90. UX Consistency System

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-1990 | 1990 | Verify terminology consistency. | NOT_STARTED | — |
| OGVPN-1991 | 1991 | Verify action-label consistency. | NOT_STARTED | — |
| OGVPN-1992 | 1992 | Verify status-label consistency. | NOT_STARTED | — |
| OGVPN-1993 | 1993 | Verify error-message consistency. | NOT_STARTED | — |
| OGVPN-1994 | 1994 | Verify confirmation-message consistency. | NOT_STARTED | — |
| OGVPN-1995 | 1995 | Verify loading-message consistency. | NOT_STARTED | — |
| OGVPN-1996 | 1996 | Verify empty-state consistency. | NOT_STARTED | — |
| OGVPN-1997 | 1997 | Verify offline-state consistency. | NOT_STARTED | — |
| OGVPN-1998 | 1998 | Verify connection-state consistency. | NOT_STARTED | — |
| OGVPN-1999 | 1999 | Verify device-state consistency. | NOT_STARTED | — |
| OGVPN-2000 | 2000 | Verify server-state consistency. | NOT_STARTED | — |
| OGVPN-2001 | 2001 | Verify subscription-state consistency. | NOT_STARTED | — |
| OGVPN-2002 | 2002 | Verify navigation naming. | NOT_STARTED | — |
| OGVPN-2003 | 2003 | Verify back behavior. | NOT_STARTED | — |
| OGVPN-2004 | 2004 | Verify cancel behavior. | NOT_STARTED | — |
| OGVPN-2005 | 2005 | Verify retry behavior. | NOT_STARTED | — |
| OGVPN-2006 | 2006 | Verify destructive-action language. | NOT_STARTED | — |
| OGVPN-2007 | 2007 | Verify accessibility labels. | NOT_STARTED | — |
| OGVPN-2008 | 2008 | Verify date/time presentation. | NOT_STARTED | — |
| OGVPN-2009 | 2009 | Verify support language. | NOT_STARTED | — |
| OGVPN-2010 | 2010 | Verify platform-specific adaptations preserve the same mental model. | NOT_STARTED | — |
| OGVPN-2011 | 2011 | Remove contradictory wording. | NOT_STARTED | — |
### 91. Component State Matrix

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2012 | 2012 | Enumerate every component. | NOT_STARTED | — |
| OGVPN-2013 | 2013 | Test default state. | NOT_STARTED | — |
| OGVPN-2014 | 2014 | Test hover state where applicable. | NOT_STARTED | — |
| OGVPN-2015 | 2015 | Test focus state. | NOT_STARTED | — |
| OGVPN-2016 | 2016 | Test pressed state. | NOT_STARTED | — |
| OGVPN-2017 | 2017 | Test active state. | NOT_STARTED | — |
| OGVPN-2018 | 2018 | Test selected state. | NOT_STARTED | — |
| OGVPN-2019 | 2019 | Test disabled state. | NOT_STARTED | — |
| OGVPN-2020 | 2020 | Test loading state. | NOT_STARTED | — |
| OGVPN-2021 | 2021 | Test success state. | NOT_STARTED | — |
| OGVPN-2022 | 2022 | Test error state. | NOT_STARTED | — |
| OGVPN-2023 | 2023 | Test empty state. | NOT_STARTED | — |
| OGVPN-2024 | 2024 | Test stale state. | NOT_STARTED | — |
| OGVPN-2025 | 2025 | Test offline state. | NOT_STARTED | — |
| OGVPN-2026 | 2026 | Test long-content state. | NOT_STARTED | — |
| OGVPN-2027 | 2027 | Test narrow-width state. | NOT_STARTED | — |
| OGVPN-2028 | 2028 | Test large-text state. | NOT_STARTED | — |
| OGVPN-2029 | 2029 | Test keyboard state. | NOT_STARTED | — |
| OGVPN-2030 | 2030 | Test touch state. | NOT_STARTED | — |
| OGVPN-2031 | 2031 | Test async-update state. | NOT_STARTED | — |
| OGVPN-2032 | 2032 | Test permission-denied state. | NOT_STARTED | — |
| OGVPN-2033 | 2033 | Test recovery state. | NOT_STARTED | — |
### 92. Scroll Integrity

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2034 | 2034 | Verify body scroll on public pages. | NOT_STARTED | — |
| OGVPN-2035 | 2035 | Verify body scroll on authenticated pages. | NOT_STARTED | — |
| OGVPN-2036 | 2036 | Verify body scroll on settings. | NOT_STARTED | — |
| OGVPN-2037 | 2037 | Verify body scroll on support. | NOT_STARTED | — |
| OGVPN-2038 | 2038 | Verify body scroll on billing. | NOT_STARTED | — |
| OGVPN-2039 | 2039 | Verify body scroll on device screens. | NOT_STARTED | — |
| OGVPN-2040 | 2040 | Verify body scroll on server screens. | NOT_STARTED | — |
| OGVPN-2041 | 2041 | Verify body scroll on mobile. | NOT_STARTED | — |
| OGVPN-2042 | 2042 | Verify body scroll on tablet. | NOT_STARTED | — |
| OGVPN-2043 | 2043 | Verify body scroll on desktop. | NOT_STARTED | — |
| OGVPN-2044 | 2044 | Verify modal internal scroll. | NOT_STARTED | — |
| OGVPN-2045 | 2045 | Verify drawer internal scroll. | NOT_STARTED | — |
| OGVPN-2046 | 2046 | Verify sidebar internal scroll. | NOT_STARTED | — |
| OGVPN-2047 | 2047 | Verify menu internal scroll. | NOT_STARTED | — |
| OGVPN-2048 | 2048 | Verify table horizontal scroll where necessary. | NOT_STARTED | — |
| OGVPN-2049 | 2049 | Verify no accidental page horizontal scroll. | NOT_STARTED | — |
| OGVPN-2050 | 2050 | Verify scroll lock only while a real overlay is active. | NOT_STARTED | — |
| OGVPN-2051 | 2051 | Verify scroll lock restores after overlay close. | NOT_STARTED | — |
| OGVPN-2052 | 2052 | Verify nested scrolling has clear ownership. | NOT_STARTED | — |
| OGVPN-2053 | 2053 | Verify overscroll behavior does not create traps. | NOT_STARTED | — |
| OGVPN-2054 | 2054 | Verify keyboard scrolling. | NOT_STARTED | — |
| OGVPN-2055 | 2055 | Verify touch scrolling. | NOT_STARTED | — |
| OGVPN-2056 | 2056 | Verify long content reaches its end. | NOT_STARTED | — |
### 93. Mobile Menu/Header Diagnostics

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2057 | 2057 | Verify header is not accidentally fixed. | NOT_STARTED | — |
| OGVPN-2058 | 2058 | Verify header does not cover content. | NOT_STARTED | — |
| OGVPN-2059 | 2059 | Verify header does not consume unexpected scroll space. | NOT_STARTED | — |
| OGVPN-2060 | 2060 | Verify menu trigger remains accessible. | NOT_STARTED | — |
| OGVPN-2061 | 2061 | Verify menu close remains accessible. | NOT_STARTED | — |
| OGVPN-2062 | 2062 | Verify menu backdrop covers the intended viewport. | NOT_STARTED | — |
| OGVPN-2063 | 2063 | Verify menu respects safe areas. | NOT_STARTED | — |
| OGVPN-2064 | 2064 | Verify menu scrolls internally. | NOT_STARTED | — |
| OGVPN-2065 | 2065 | Verify page does not scroll behind the menu. | NOT_STARTED | — |
| OGVPN-2066 | 2066 | Verify page scroll restores after close. | NOT_STARTED | — |
| OGVPN-2067 | 2067 | Verify Escape closes. | NOT_STARTED | — |
| OGVPN-2068 | 2068 | Verify Android back closes. | NOT_STARTED | — |
| OGVPN-2069 | 2069 | Verify focus enters. | NOT_STARTED | — |
| OGVPN-2070 | 2070 | Verify focus restores. | NOT_STARTED | — |
| OGVPN-2071 | 2071 | Verify opening animation does not block interaction. | NOT_STARTED | — |
| OGVPN-2072 | 2072 | Verify closing animation does not leave a blocker. | NOT_STARTED | — |
| OGVPN-2073 | 2073 | Verify rapid open/close is safe. | NOT_STARTED | — |
| OGVPN-2074 | 2074 | Verify navigation closes the menu. | NOT_STARTED | — |
| OGVPN-2075 | 2075 | Verify menu survives orientation changes. | NOT_STARTED | — |
| OGVPN-2076 | 2076 | Verify menu handles long labels. | NOT_STARTED | — |
| OGVPN-2077 | 2077 | Verify menu handles long lists. | NOT_STARTED | — |
| OGVPN-2078 | 2078 | Verify menu never renders partially offscreen. | NOT_STARTED | — |
### 94. API-to-UI Handshake

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2079 | 2079 | For every API call, identify its loading state. | NOT_STARTED | — |
| OGVPN-2080 | 2080 | For every API call, identify its success state. | NOT_STARTED | — |
| OGVPN-2081 | 2081 | For every API call, identify its error state. | NOT_STARTED | — |
| OGVPN-2082 | 2082 | For every API call, identify its timeout. | NOT_STARTED | — |
| OGVPN-2083 | 2083 | For every API call, identify retry. | NOT_STARTED | — |
| OGVPN-2084 | 2084 | For every API call, identify offline behavior. | NOT_STARTED | — |
| OGVPN-2085 | 2085 | For every API call, identify duplicate protection. | NOT_STARTED | — |
| OGVPN-2086 | 2086 | For every API call, verify request schema. | NOT_STARTED | — |
| OGVPN-2087 | 2087 | For every API call, verify response schema. | NOT_STARTED | — |
| OGVPN-2088 | 2088 | For every API call, verify authentication. | NOT_STARTED | — |
| OGVPN-2089 | 2089 | For every API call, verify authorization. | NOT_STARTED | — |
| OGVPN-2090 | 2090 | For every API call, verify stale-response handling. | NOT_STARTED | — |
| OGVPN-2091 | 2091 | For every API call, verify cancellation. | NOT_STARTED | — |
| OGVPN-2092 | 2092 | For every API call, verify cleanup. | NOT_STARTED | — |
| OGVPN-2093 | 2093 | For every API call, verify UI state transition. | NOT_STARTED | — |
| OGVPN-2094 | 2094 | For every API call, verify server-side persistence. | NOT_STARTED | — |
| OGVPN-2095 | 2095 | For every API call, verify client-side persistence where applicable. | NOT_STARTED | — |
| OGVPN-2096 | 2096 | For every API call, verify refresh behavior. | NOT_STARTED | — |
| OGVPN-2097 | 2097 | For every API call, verify cross-platform behavior. | NOT_STARTED | — |
| OGVPN-2098 | 2098 | For every API call, verify analytics if meaningful. | NOT_STARTED | — |
| OGVPN-2099 | 2099 | For every API call, verify logs are safe. | NOT_STARTED | — |
| OGVPN-2100 | 2100 | For every API call, verify end-to-end evidence. | NOT_STARTED | — |
### 95. End-to-End User Journeys

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2101 | 2101 | Complete first visit. | NOT_STARTED | — |
| OGVPN-2102 | 2102 | Complete signup. | NOT_STARTED | — |
| OGVPN-2103 | 2103 | Complete email verification where applicable. | NOT_STARTED | — |
| OGVPN-2104 | 2104 | Complete login. | NOT_STARTED | — |
| OGVPN-2105 | 2105 | Complete logout. | NOT_STARTED | — |
| OGVPN-2106 | 2106 | Complete password reset. | NOT_STARTED | — |
| OGVPN-2107 | 2107 | Complete MFA where applicable. | NOT_STARTED | — |
| OGVPN-2108 | 2108 | Complete dashboard inspection. | NOT_STARTED | — |
| OGVPN-2109 | 2109 | Complete server selection. | NOT_STARTED | — |
| OGVPN-2110 | 2110 | Complete VPN connection. | NOT_STARTED | — |
| OGVPN-2111 | 2111 | Complete VPN disconnection. | NOT_STARTED | — |
| OGVPN-2112 | 2112 | Complete device enrollment. | NOT_STARTED | — |
| OGVPN-2113 | 2113 | Complete device configuration. | NOT_STARTED | — |
| OGVPN-2114 | 2114 | Complete device revocation. | NOT_STARTED | — |
| OGVPN-2115 | 2115 | Complete subscription purchase. | NOT_STARTED | — |
| OGVPN-2116 | 2116 | Complete subscription cancellation. | NOT_STARTED | — |
| OGVPN-2117 | 2117 | Complete settings update. | NOT_STARTED | — |
| OGVPN-2118 | 2118 | Complete notification preference update. | NOT_STARTED | — |
| OGVPN-2119 | 2119 | Complete support ticket. | NOT_STARTED | — |
| OGVPN-2120 | 2120 | Complete account deletion. | NOT_STARTED | — |
| OGVPN-2121 | 2121 | Repeat the primary journey after a network interruption. | NOT_STARTED | — |
| OGVPN-2122 | 2122 | Repeat the primary journey after session expiry. | NOT_STARTED | — |
### 96. Android End-to-End

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2123 | 2123 | Install Android app. | NOT_STARTED | — |
| OGVPN-2124 | 2124 | Launch Android app. | NOT_STARTED | — |
| OGVPN-2125 | 2125 | Create or access an account. | NOT_STARTED | — |
| OGVPN-2126 | 2126 | Login. | NOT_STARTED | — |
| OGVPN-2127 | 2127 | Reach dashboard. | NOT_STARTED | — |
| OGVPN-2128 | 2128 | Load server list. | NOT_STARTED | — |
| OGVPN-2129 | 2129 | Select server. | NOT_STARTED | — |
| OGVPN-2130 | 2130 | Grant VPN permission. | NOT_STARTED | — |
| OGVPN-2131 | 2131 | Connect VPN. | NOT_STARTED | — |
| OGVPN-2132 | 2132 | Verify actual tunnel. | NOT_STARTED | — |
| OGVPN-2133 | 2133 | Verify actual traffic. | NOT_STARTED | — |
| OGVPN-2134 | 2134 | Disconnect. | NOT_STARTED | — |
| OGVPN-2135 | 2135 | Reconnect. | NOT_STARTED | — |
| OGVPN-2136 | 2136 | Switch network while connected. | NOT_STARTED | — |
| OGVPN-2137 | 2137 | Background app. | NOT_STARTED | — |
| OGVPN-2138 | 2138 | Resume app. | NOT_STARTED | — |
| OGVPN-2139 | 2139 | Restart app. | NOT_STARTED | — |
| OGVPN-2140 | 2140 | Revoke device. | NOT_STARTED | — |
| OGVPN-2141 | 2141 | Refresh configuration. | NOT_STARTED | — |
| OGVPN-2142 | 2142 | Logout. | NOT_STARTED | — |
| OGVPN-2143 | 2143 | Login again. | NOT_STARTED | — |
| OGVPN-2144 | 2144 | Upgrade app. | NOT_STARTED | — |
| OGVPN-2145 | 2145 | Verify state survives upgrade. | NOT_STARTED | — |
### 97. Desktop End-to-End

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2146 | 2146 | Install Desktop app. | NOT_STARTED | — |
| OGVPN-2147 | 2147 | Launch Desktop app. | NOT_STARTED | — |
| OGVPN-2148 | 2148 | Login. | NOT_STARTED | — |
| OGVPN-2149 | 2149 | Reach dashboard. | NOT_STARTED | — |
| OGVPN-2150 | 2150 | Load servers. | NOT_STARTED | — |
| OGVPN-2151 | 2151 | Select server. | NOT_STARTED | — |
| OGVPN-2152 | 2152 | Start VPN. | NOT_STARTED | — |
| OGVPN-2153 | 2153 | Verify actual tunnel. | NOT_STARTED | — |
| OGVPN-2154 | 2154 | Verify actual traffic. | NOT_STARTED | — |
| OGVPN-2155 | 2155 | Disconnect. | NOT_STARTED | — |
| OGVPN-2156 | 2156 | Reconnect. | NOT_STARTED | — |
| OGVPN-2157 | 2157 | Switch network. | NOT_STARTED | — |
| OGVPN-2158 | 2158 | Sleep device. | NOT_STARTED | — |
| OGVPN-2159 | 2159 | Resume device. | NOT_STARTED | — |
| OGVPN-2160 | 2160 | Restart app. | NOT_STARTED | — |
| OGVPN-2161 | 2161 | Restart OS. | NOT_STARTED | — |
| OGVPN-2162 | 2162 | Update app. | NOT_STARTED | — |
| OGVPN-2163 | 2163 | Verify VPN state after update. | NOT_STARTED | — |
| OGVPN-2164 | 2164 | Manage device. | NOT_STARTED | — |
| OGVPN-2165 | 2165 | Open settings. | NOT_STARTED | — |
| OGVPN-2166 | 2166 | Logout. | NOT_STARTED | — |
| OGVPN-2167 | 2167 | Login again. | NOT_STARTED | — |
| OGVPN-2168 | 2168 | Uninstall and verify cleanup. | NOT_STARTED | — |
### 98. Extension End-to-End

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2169 | 2169 | Install extension. | NOT_STARTED | — |
| OGVPN-2170 | 2170 | Grant required permissions. | NOT_STARTED | — |
| OGVPN-2171 | 2171 | Open popup. | NOT_STARTED | — |
| OGVPN-2172 | 2172 | Login. | NOT_STARTED | — |
| OGVPN-2173 | 2173 | Load server list. | NOT_STARTED | — |
| OGVPN-2174 | 2174 | Select server. | NOT_STARTED | — |
| OGVPN-2175 | 2175 | Connect. | NOT_STARTED | — |
| OGVPN-2176 | 2176 | Verify connection state. | NOT_STARTED | — |
| OGVPN-2177 | 2177 | Open dashboard. | NOT_STARTED | — |
| OGVPN-2178 | 2178 | Disconnect. | NOT_STARTED | — |
| OGVPN-2179 | 2179 | Reconnect. | NOT_STARTED | — |
| OGVPN-2180 | 2180 | Restart browser. | NOT_STARTED | — |
| OGVPN-2181 | 2181 | Verify extension state. | NOT_STARTED | — |
| OGVPN-2182 | 2182 | Reload extension. | NOT_STARTED | — |
| OGVPN-2183 | 2183 | Verify recovery. | NOT_STARTED | — |
| OGVPN-2184 | 2184 | Switch network. | NOT_STARTED | — |
| OGVPN-2185 | 2185 | Verify recovery. | NOT_STARTED | — |
| OGVPN-2186 | 2186 | Expire session. | NOT_STARTED | — |
| OGVPN-2187 | 2187 | Verify reauthentication. | NOT_STARTED | — |
| OGVPN-2188 | 2188 | Logout. | NOT_STARTED | — |
| OGVPN-2189 | 2189 | Verify private data disappears. | NOT_STARTED | — |
| OGVPN-2190 | 2190 | Update extension. | NOT_STARTED | — |
| OGVPN-2191 | 2191 | Verify migration. | NOT_STARTED | — |
### 99. Regression & Defect Closure

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2192 | 2192 | Re-run the original authentication-loop reproduction. | NOT_STARTED | — |
| OGVPN-2193 | 2193 | Verify valid login never returns to login unexpectedly. | NOT_STARTED | — |
| OGVPN-2194 | 2194 | Verify refresh after login remains authenticated. | NOT_STARTED | — |
| OGVPN-2195 | 2195 | Verify browser back after login behaves correctly. | NOT_STARTED | — |
| OGVPN-2196 | 2196 | Verify expired session redirects correctly. | NOT_STARTED | — |
| OGVPN-2197 | 2197 | Verify logout does not accidentally log back in. | NOT_STARTED | — |
| OGVPN-2198 | 2198 | Verify Android login and session behavior. | NOT_STARTED | — |
| OGVPN-2199 | 2199 | Verify Desktop login and session behavior. | NOT_STARTED | — |
| OGVPN-2200 | 2200 | Verify extension login and session behavior. | NOT_STARTED | — |
| OGVPN-2201 | 2201 | Re-run every previously fixed defect. | NOT_STARTED | — |
| OGVPN-2202 | 2202 | Re-run every failed automated test. | NOT_STARTED | — |
| OGVPN-2203 | 2203 | Re-run every failed manual test. | NOT_STARTED | — |
| OGVPN-2204 | 2204 | Re-run every high-risk VPN test. | NOT_STARTED | — |
| OGVPN-2205 | 2205 | Re-run every security test affected by changes. | NOT_STARTED | — |
| OGVPN-2206 | 2206 | Re-run every responsive viewport test affected by UI changes. | NOT_STARTED | — |
| OGVPN-2207 | 2207 | Re-run every overlay test affected by layout changes. | NOT_STARTED | — |
| OGVPN-2208 | 2208 | Re-run every cross-platform sync test affected by state changes. | NOT_STARTED | — |
| OGVPN-2209 | 2209 | Verify no new console errors. | NOT_STARTED | — |
| OGVPN-2210 | 2210 | Verify no new runtime crashes. | NOT_STARTED | — |
| OGVPN-2211 | 2211 | Verify no new network errors. | NOT_STARTED | — |
| OGVPN-2212 | 2212 | Verify no new accessibility regressions. | NOT_STARTED | — |
| OGVPN-2213 | 2213 | Verify no new performance regressions. | NOT_STARTED | — |
| OGVPN-2214 | 2214 | Close only defects with verified evidence. | NOT_STARTED | — |
### 100. Final Production Acceptance

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2215 | 2215 | Confirm every requirement has an owner and verification result. | NOT_STARTED | — |
| OGVPN-2216 | 2216 | Confirm every screen is implemented. | NOT_STARTED | — |
| OGVPN-2217 | 2217 | Confirm every screen is reachable. | NOT_STARTED | — |
| OGVPN-2218 | 2218 | Confirm every component is functional. | NOT_STARTED | — |
| OGVPN-2219 | 2219 | Confirm every interaction is functional. | NOT_STARTED | — |
| OGVPN-2220 | 2220 | Confirm every API contract is tested. | NOT_STARTED | — |
| OGVPN-2221 | 2221 | Confirm every important state is tested. | NOT_STARTED | — |
| OGVPN-2222 | 2222 | Confirm Android is a real built application. | NOT_STARTED | — |
| OGVPN-2223 | 2223 | Confirm Desktop is a real built application. | NOT_STARTED | — |
| OGVPN-2224 | 2224 | Confirm Chrome extension is a real built package. | NOT_STARTED | — |
| OGVPN-2225 | 2225 | Confirm web production build works. | NOT_STARTED | — |
| OGVPN-2226 | 2226 | Confirm backend production configuration works. | NOT_STARTED | — |
| OGVPN-2227 | 2227 | Confirm database migrations work. | NOT_STARTED | — |
| OGVPN-2228 | 2228 | Confirm VPN connections are real rather than simulated. | NOT_STARTED | — |
| OGVPN-2229 | 2229 | Confirm authentication works end-to-end. | NOT_STARTED | — |
| OGVPN-2230 | 2230 | Confirm billing works end-to-end where enabled. | NOT_STARTED | — |
| OGVPN-2231 | 2231 | Confirm device management works end-to-end. | NOT_STARTED | — |
| OGVPN-2232 | 2232 | Confirm server management works end-to-end. | NOT_STARTED | — |
| OGVPN-2233 | 2233 | Confirm offline and recovery behavior. | NOT_STARTED | — |
| OGVPN-2234 | 2234 | Confirm accessibility. | NOT_STARTED | — |
| OGVPN-2235 | 2235 | Confirm responsive behavior. | NOT_STARTED | — |
| OGVPN-2236 | 2236 | Confirm security checks. | NOT_STARTED | — |
| OGVPN-2237 | 2237 | Confirm performance checks. | NOT_STARTED | — |
| OGVPN-2238 | 2238 | Confirm deployment and rollback. | NOT_STARTED | — |
| OGVPN-2239 | 2239 | Do not declare production-ready until every applicable checklist item is checked and evidenced. | NOT_STARTED | — |
### 101. Matrix: Web / authentication

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2240 | 2240 | Web: authentication --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2241 | 2241 | Web: authentication --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2242 | 2242 | Web: authentication --- verify success path. | NOT_STARTED | — |
| OGVPN-2243 | 2243 | Web: authentication --- verify failure path. | NOT_STARTED | — |
| OGVPN-2244 | 2244 | Web: authentication --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2245 | 2245 | Web: authentication --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2246 | 2246 | Web: authentication --- verify retry path. | NOT_STARTED | — |
| OGVPN-2247 | 2247 | Web: authentication --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2248 | 2248 | Web: authentication --- verify offline path. | NOT_STARTED | — |
| OGVPN-2249 | 2249 | Web: authentication --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / session persistence

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2250 | 2250 | Web: session persistence --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2251 | 2251 | Web: session persistence --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2252 | 2252 | Web: session persistence --- verify success path. | NOT_STARTED | — |
| OGVPN-2253 | 2253 | Web: session persistence --- verify failure path. | NOT_STARTED | — |
| OGVPN-2254 | 2254 | Web: session persistence --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2255 | 2255 | Web: session persistence --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2256 | 2256 | Web: session persistence --- verify retry path. | NOT_STARTED | — |
| OGVPN-2257 | 2257 | Web: session persistence --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2258 | 2258 | Web: session persistence --- verify offline path. | NOT_STARTED | — |
| OGVPN-2259 | 2259 | Web: session persistence --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / navigation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2260 | 2260 | Web: navigation --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2261 | 2261 | Web: navigation --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2262 | 2262 | Web: navigation --- verify success path. | NOT_STARTED | — |
| OGVPN-2263 | 2263 | Web: navigation --- verify failure path. | NOT_STARTED | — |
| OGVPN-2264 | 2264 | Web: navigation --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2265 | 2265 | Web: navigation --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2266 | 2266 | Web: navigation --- verify retry path. | NOT_STARTED | — |
| OGVPN-2267 | 2267 | Web: navigation --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2268 | 2268 | Web: navigation --- verify offline path. | NOT_STARTED | — |
| OGVPN-2269 | 2269 | Web: navigation --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / forms

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2270 | 2270 | Web: forms --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2271 | 2271 | Web: forms --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2272 | 2272 | Web: forms --- verify success path. | NOT_STARTED | — |
| OGVPN-2273 | 2273 | Web: forms --- verify failure path. | NOT_STARTED | — |
| OGVPN-2274 | 2274 | Web: forms --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2275 | 2275 | Web: forms --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2276 | 2276 | Web: forms --- verify retry path. | NOT_STARTED | — |
| OGVPN-2277 | 2277 | Web: forms --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2278 | 2278 | Web: forms --- verify offline path. | NOT_STARTED | — |
| OGVPN-2279 | 2279 | Web: forms --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / loading states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2280 | 2280 | Web: loading states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2281 | 2281 | Web: loading states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2282 | 2282 | Web: loading states --- verify success path. | NOT_STARTED | — |
| OGVPN-2283 | 2283 | Web: loading states --- verify failure path. | NOT_STARTED | — |
| OGVPN-2284 | 2284 | Web: loading states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2285 | 2285 | Web: loading states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2286 | 2286 | Web: loading states --- verify retry path. | NOT_STARTED | — |
| OGVPN-2287 | 2287 | Web: loading states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2288 | 2288 | Web: loading states --- verify offline path. | NOT_STARTED | — |
| OGVPN-2289 | 2289 | Web: loading states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / error states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2290 | 2290 | Web: error states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2291 | 2291 | Web: error states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2292 | 2292 | Web: error states --- verify success path. | NOT_STARTED | — |
| OGVPN-2293 | 2293 | Web: error states --- verify failure path. | NOT_STARTED | — |
| OGVPN-2294 | 2294 | Web: error states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2295 | 2295 | Web: error states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2296 | 2296 | Web: error states --- verify retry path. | NOT_STARTED | — |
| OGVPN-2297 | 2297 | Web: error states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2298 | 2298 | Web: error states --- verify offline path. | NOT_STARTED | — |
| OGVPN-2299 | 2299 | Web: error states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / offline recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2300 | 2300 | Web: offline recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2301 | 2301 | Web: offline recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2302 | 2302 | Web: offline recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-2303 | 2303 | Web: offline recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-2304 | 2304 | Web: offline recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2305 | 2305 | Web: offline recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2306 | 2306 | Web: offline recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-2307 | 2307 | Web: offline recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2308 | 2308 | Web: offline recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-2309 | 2309 | Web: offline recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / network switching

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2310 | 2310 | Web: network switching --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2311 | 2311 | Web: network switching --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2312 | 2312 | Web: network switching --- verify success path. | NOT_STARTED | — |
| OGVPN-2313 | 2313 | Web: network switching --- verify failure path. | NOT_STARTED | — |
| OGVPN-2314 | 2314 | Web: network switching --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2315 | 2315 | Web: network switching --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2316 | 2316 | Web: network switching --- verify retry path. | NOT_STARTED | — |
| OGVPN-2317 | 2317 | Web: network switching --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2318 | 2318 | Web: network switching --- verify offline path. | NOT_STARTED | — |
| OGVPN-2319 | 2319 | Web: network switching --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / VPN connection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2320 | 2320 | Web: VPN connection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2321 | 2321 | Web: VPN connection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2322 | 2322 | Web: VPN connection --- verify success path. | NOT_STARTED | — |
| OGVPN-2323 | 2323 | Web: VPN connection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2324 | 2324 | Web: VPN connection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2325 | 2325 | Web: VPN connection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2326 | 2326 | Web: VPN connection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2327 | 2327 | Web: VPN connection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2328 | 2328 | Web: VPN connection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2329 | 2329 | Web: VPN connection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / VPN disconnection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2330 | 2330 | Web: VPN disconnection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2331 | 2331 | Web: VPN disconnection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2332 | 2332 | Web: VPN disconnection --- verify success path. | NOT_STARTED | — |
| OGVPN-2333 | 2333 | Web: VPN disconnection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2334 | 2334 | Web: VPN disconnection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2335 | 2335 | Web: VPN disconnection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2336 | 2336 | Web: VPN disconnection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2337 | 2337 | Web: VPN disconnection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2338 | 2338 | Web: VPN disconnection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2339 | 2339 | Web: VPN disconnection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / server selection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2340 | 2340 | Web: server selection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2341 | 2341 | Web: server selection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2342 | 2342 | Web: server selection --- verify success path. | NOT_STARTED | — |
| OGVPN-2343 | 2343 | Web: server selection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2344 | 2344 | Web: server selection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2345 | 2345 | Web: server selection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2346 | 2346 | Web: server selection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2347 | 2347 | Web: server selection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2348 | 2348 | Web: server selection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2349 | 2349 | Web: server selection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / device management

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2350 | 2350 | Web: device management --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2351 | 2351 | Web: device management --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2352 | 2352 | Web: device management --- verify success path. | NOT_STARTED | — |
| OGVPN-2353 | 2353 | Web: device management --- verify failure path. | NOT_STARTED | — |
| OGVPN-2354 | 2354 | Web: device management --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2355 | 2355 | Web: device management --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2356 | 2356 | Web: device management --- verify retry path. | NOT_STARTED | — |
| OGVPN-2357 | 2357 | Web: device management --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2358 | 2358 | Web: device management --- verify offline path. | NOT_STARTED | — |
| OGVPN-2359 | 2359 | Web: device management --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / settings

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2360 | 2360 | Web: settings --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2361 | 2361 | Web: settings --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2362 | 2362 | Web: settings --- verify success path. | NOT_STARTED | — |
| OGVPN-2363 | 2363 | Web: settings --- verify failure path. | NOT_STARTED | — |
| OGVPN-2364 | 2364 | Web: settings --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2365 | 2365 | Web: settings --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2366 | 2366 | Web: settings --- verify retry path. | NOT_STARTED | — |
| OGVPN-2367 | 2367 | Web: settings --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2368 | 2368 | Web: settings --- verify offline path. | NOT_STARTED | — |
| OGVPN-2369 | 2369 | Web: settings --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / notifications

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2370 | 2370 | Web: notifications --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2371 | 2371 | Web: notifications --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2372 | 2372 | Web: notifications --- verify success path. | NOT_STARTED | — |
| OGVPN-2373 | 2373 | Web: notifications --- verify failure path. | NOT_STARTED | — |
| OGVPN-2374 | 2374 | Web: notifications --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2375 | 2375 | Web: notifications --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2376 | 2376 | Web: notifications --- verify retry path. | NOT_STARTED | — |
| OGVPN-2377 | 2377 | Web: notifications --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2378 | 2378 | Web: notifications --- verify offline path. | NOT_STARTED | — |
| OGVPN-2379 | 2379 | Web: notifications --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / billing

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2380 | 2380 | Web: billing --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2381 | 2381 | Web: billing --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2382 | 2382 | Web: billing --- verify success path. | NOT_STARTED | — |
| OGVPN-2383 | 2383 | Web: billing --- verify failure path. | NOT_STARTED | — |
| OGVPN-2384 | 2384 | Web: billing --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2385 | 2385 | Web: billing --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2386 | 2386 | Web: billing --- verify retry path. | NOT_STARTED | — |
| OGVPN-2387 | 2387 | Web: billing --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2388 | 2388 | Web: billing --- verify offline path. | NOT_STARTED | — |
| OGVPN-2389 | 2389 | Web: billing --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / support

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2390 | 2390 | Web: support --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2391 | 2391 | Web: support --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2392 | 2392 | Web: support --- verify success path. | NOT_STARTED | — |
| OGVPN-2393 | 2393 | Web: support --- verify failure path. | NOT_STARTED | — |
| OGVPN-2394 | 2394 | Web: support --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2395 | 2395 | Web: support --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2396 | 2396 | Web: support --- verify retry path. | NOT_STARTED | — |
| OGVPN-2397 | 2397 | Web: support --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2398 | 2398 | Web: support --- verify offline path. | NOT_STARTED | — |
| OGVPN-2399 | 2399 | Web: support --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / accessibility

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2400 | 2400 | Web: accessibility --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2401 | 2401 | Web: accessibility --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2402 | 2402 | Web: accessibility --- verify success path. | NOT_STARTED | — |
| OGVPN-2403 | 2403 | Web: accessibility --- verify failure path. | NOT_STARTED | — |
| OGVPN-2404 | 2404 | Web: accessibility --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2405 | 2405 | Web: accessibility --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2406 | 2406 | Web: accessibility --- verify retry path. | NOT_STARTED | — |
| OGVPN-2407 | 2407 | Web: accessibility --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2408 | 2408 | Web: accessibility --- verify offline path. | NOT_STARTED | — |
| OGVPN-2409 | 2409 | Web: accessibility --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / responsive behavior

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2410 | 2410 | Web: responsive behavior --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2411 | 2411 | Web: responsive behavior --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2412 | 2412 | Web: responsive behavior --- verify success path. | NOT_STARTED | — |
| OGVPN-2413 | 2413 | Web: responsive behavior --- verify failure path. | NOT_STARTED | — |
| OGVPN-2414 | 2414 | Web: responsive behavior --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2415 | 2415 | Web: responsive behavior --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2416 | 2416 | Web: responsive behavior --- verify retry path. | NOT_STARTED | — |
| OGVPN-2417 | 2417 | Web: responsive behavior --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2418 | 2418 | Web: responsive behavior --- verify offline path. | NOT_STARTED | — |
| OGVPN-2419 | 2419 | Web: responsive behavior --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / keyboard/input

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2420 | 2420 | Web: keyboard/input --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2421 | 2421 | Web: keyboard/input --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2422 | 2422 | Web: keyboard/input --- verify success path. | NOT_STARTED | — |
| OGVPN-2423 | 2423 | Web: keyboard/input --- verify failure path. | NOT_STARTED | — |
| OGVPN-2424 | 2424 | Web: keyboard/input --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2425 | 2425 | Web: keyboard/input --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2426 | 2426 | Web: keyboard/input --- verify retry path. | NOT_STARTED | — |
| OGVPN-2427 | 2427 | Web: keyboard/input --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2428 | 2428 | Web: keyboard/input --- verify offline path. | NOT_STARTED | — |
| OGVPN-2429 | 2429 | Web: keyboard/input --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / permissions

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2430 | 2430 | Web: permissions --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2431 | 2431 | Web: permissions --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2432 | 2432 | Web: permissions --- verify success path. | NOT_STARTED | — |
| OGVPN-2433 | 2433 | Web: permissions --- verify failure path. | NOT_STARTED | — |
| OGVPN-2434 | 2434 | Web: permissions --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2435 | 2435 | Web: permissions --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2436 | 2436 | Web: permissions --- verify retry path. | NOT_STARTED | — |
| OGVPN-2437 | 2437 | Web: permissions --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2438 | 2438 | Web: permissions --- verify offline path. | NOT_STARTED | — |
| OGVPN-2439 | 2439 | Web: permissions --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / deep links

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2440 | 2440 | Web: deep links --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2441 | 2441 | Web: deep links --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2442 | 2442 | Web: deep links --- verify success path. | NOT_STARTED | — |
| OGVPN-2443 | 2443 | Web: deep links --- verify failure path. | NOT_STARTED | — |
| OGVPN-2444 | 2444 | Web: deep links --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2445 | 2445 | Web: deep links --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2446 | 2446 | Web: deep links --- verify retry path. | NOT_STARTED | — |
| OGVPN-2447 | 2447 | Web: deep links --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2448 | 2448 | Web: deep links --- verify offline path. | NOT_STARTED | — |
| OGVPN-2449 | 2449 | Web: deep links --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / logging

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2450 | 2450 | Web: logging --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2451 | 2451 | Web: logging --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2452 | 2452 | Web: logging --- verify success path. | NOT_STARTED | — |
| OGVPN-2453 | 2453 | Web: logging --- verify failure path. | NOT_STARTED | — |
| OGVPN-2454 | 2454 | Web: logging --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2455 | 2455 | Web: logging --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2456 | 2456 | Web: logging --- verify retry path. | NOT_STARTED | — |
| OGVPN-2457 | 2457 | Web: logging --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2458 | 2458 | Web: logging --- verify offline path. | NOT_STARTED | — |
| OGVPN-2459 | 2459 | Web: logging --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / analytics

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2460 | 2460 | Web: analytics --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2461 | 2461 | Web: analytics --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2462 | 2462 | Web: analytics --- verify success path. | NOT_STARTED | — |
| OGVPN-2463 | 2463 | Web: analytics --- verify failure path. | NOT_STARTED | — |
| OGVPN-2464 | 2464 | Web: analytics --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2465 | 2465 | Web: analytics --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2466 | 2466 | Web: analytics --- verify retry path. | NOT_STARTED | — |
| OGVPN-2467 | 2467 | Web: analytics --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2468 | 2468 | Web: analytics --- verify offline path. | NOT_STARTED | — |
| OGVPN-2469 | 2469 | Web: analytics --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2470 | 2470 | Web: security --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2471 | 2471 | Web: security --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2472 | 2472 | Web: security --- verify success path. | NOT_STARTED | — |
| OGVPN-2473 | 2473 | Web: security --- verify failure path. | NOT_STARTED | — |
| OGVPN-2474 | 2474 | Web: security --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2475 | 2475 | Web: security --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2476 | 2476 | Web: security --- verify retry path. | NOT_STARTED | — |
| OGVPN-2477 | 2477 | Web: security --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2478 | 2478 | Web: security --- verify offline path. | NOT_STARTED | — |
| OGVPN-2479 | 2479 | Web: security --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / performance

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2480 | 2480 | Web: performance --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2481 | 2481 | Web: performance --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2482 | 2482 | Web: performance --- verify success path. | NOT_STARTED | — |
| OGVPN-2483 | 2483 | Web: performance --- verify failure path. | NOT_STARTED | — |
| OGVPN-2484 | 2484 | Web: performance --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2485 | 2485 | Web: performance --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2486 | 2486 | Web: performance --- verify retry path. | NOT_STARTED | — |
| OGVPN-2487 | 2487 | Web: performance --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2488 | 2488 | Web: performance --- verify offline path. | NOT_STARTED | — |
| OGVPN-2489 | 2489 | Web: performance --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / state synchronization

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2490 | 2490 | Web: state synchronization --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2491 | 2491 | Web: state synchronization --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2492 | 2492 | Web: state synchronization --- verify success path. | NOT_STARTED | — |
| OGVPN-2493 | 2493 | Web: state synchronization --- verify failure path. | NOT_STARTED | — |
| OGVPN-2494 | 2494 | Web: state synchronization --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2495 | 2495 | Web: state synchronization --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2496 | 2496 | Web: state synchronization --- verify retry path. | NOT_STARTED | — |
| OGVPN-2497 | 2497 | Web: state synchronization --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2498 | 2498 | Web: state synchronization --- verify offline path. | NOT_STARTED | — |
| OGVPN-2499 | 2499 | Web: state synchronization --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / update/restart recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2500 | 2500 | Web: update/restart recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2501 | 2501 | Web: update/restart recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2502 | 2502 | Web: update/restart recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-2503 | 2503 | Web: update/restart recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-2504 | 2504 | Web: update/restart recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2505 | 2505 | Web: update/restart recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2506 | 2506 | Web: update/restart recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-2507 | 2507 | Web: update/restart recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2508 | 2508 | Web: update/restart recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-2509 | 2509 | Web: update/restart recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / duplicate-action protection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2510 | 2510 | Web: duplicate-action protection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2511 | 2511 | Web: duplicate-action protection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2512 | 2512 | Web: duplicate-action protection --- verify success path. | NOT_STARTED | — |
| OGVPN-2513 | 2513 | Web: duplicate-action protection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2514 | 2514 | Web: duplicate-action protection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2515 | 2515 | Web: duplicate-action protection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2516 | 2516 | Web: duplicate-action protection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2517 | 2517 | Web: duplicate-action protection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2518 | 2518 | Web: duplicate-action protection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2519 | 2519 | Web: duplicate-action protection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Web / API contract handling

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2520 | 2520 | Web: API contract handling --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2521 | 2521 | Web: API contract handling --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2522 | 2522 | Web: API contract handling --- verify success path. | NOT_STARTED | — |
| OGVPN-2523 | 2523 | Web: API contract handling --- verify failure path. | NOT_STARTED | — |
| OGVPN-2524 | 2524 | Web: API contract handling --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2525 | 2525 | Web: API contract handling --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2526 | 2526 | Web: API contract handling --- verify retry path. | NOT_STARTED | — |
| OGVPN-2527 | 2527 | Web: API contract handling --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2528 | 2528 | Web: API contract handling --- verify offline path. | NOT_STARTED | — |
| OGVPN-2529 | 2529 | Web: API contract handling --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / authentication

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2530 | 2530 | Android: authentication --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2531 | 2531 | Android: authentication --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2532 | 2532 | Android: authentication --- verify success path. | NOT_STARTED | — |
| OGVPN-2533 | 2533 | Android: authentication --- verify failure path. | NOT_STARTED | — |
| OGVPN-2534 | 2534 | Android: authentication --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2535 | 2535 | Android: authentication --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2536 | 2536 | Android: authentication --- verify retry path. | NOT_STARTED | — |
| OGVPN-2537 | 2537 | Android: authentication --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2538 | 2538 | Android: authentication --- verify offline path. | NOT_STARTED | — |
| OGVPN-2539 | 2539 | Android: authentication --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / session persistence

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2540 | 2540 | Android: session persistence --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2541 | 2541 | Android: session persistence --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2542 | 2542 | Android: session persistence --- verify success path. | NOT_STARTED | — |
| OGVPN-2543 | 2543 | Android: session persistence --- verify failure path. | NOT_STARTED | — |
| OGVPN-2544 | 2544 | Android: session persistence --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2545 | 2545 | Android: session persistence --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2546 | 2546 | Android: session persistence --- verify retry path. | NOT_STARTED | — |
| OGVPN-2547 | 2547 | Android: session persistence --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2548 | 2548 | Android: session persistence --- verify offline path. | NOT_STARTED | — |
| OGVPN-2549 | 2549 | Android: session persistence --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / navigation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2550 | 2550 | Android: navigation --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2551 | 2551 | Android: navigation --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2552 | 2552 | Android: navigation --- verify success path. | NOT_STARTED | — |
| OGVPN-2553 | 2553 | Android: navigation --- verify failure path. | NOT_STARTED | — |
| OGVPN-2554 | 2554 | Android: navigation --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2555 | 2555 | Android: navigation --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2556 | 2556 | Android: navigation --- verify retry path. | NOT_STARTED | — |
| OGVPN-2557 | 2557 | Android: navigation --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2558 | 2558 | Android: navigation --- verify offline path. | NOT_STARTED | — |
| OGVPN-2559 | 2559 | Android: navigation --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / forms

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2560 | 2560 | Android: forms --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2561 | 2561 | Android: forms --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2562 | 2562 | Android: forms --- verify success path. | NOT_STARTED | — |
| OGVPN-2563 | 2563 | Android: forms --- verify failure path. | NOT_STARTED | — |
| OGVPN-2564 | 2564 | Android: forms --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2565 | 2565 | Android: forms --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2566 | 2566 | Android: forms --- verify retry path. | NOT_STARTED | — |
| OGVPN-2567 | 2567 | Android: forms --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2568 | 2568 | Android: forms --- verify offline path. | NOT_STARTED | — |
| OGVPN-2569 | 2569 | Android: forms --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / loading states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2570 | 2570 | Android: loading states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2571 | 2571 | Android: loading states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2572 | 2572 | Android: loading states --- verify success path. | NOT_STARTED | — |
| OGVPN-2573 | 2573 | Android: loading states --- verify failure path. | NOT_STARTED | — |
| OGVPN-2574 | 2574 | Android: loading states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2575 | 2575 | Android: loading states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2576 | 2576 | Android: loading states --- verify retry path. | NOT_STARTED | — |
| OGVPN-2577 | 2577 | Android: loading states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2578 | 2578 | Android: loading states --- verify offline path. | NOT_STARTED | — |
| OGVPN-2579 | 2579 | Android: loading states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / error states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2580 | 2580 | Android: error states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2581 | 2581 | Android: error states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2582 | 2582 | Android: error states --- verify success path. | NOT_STARTED | — |
| OGVPN-2583 | 2583 | Android: error states --- verify failure path. | NOT_STARTED | — |
| OGVPN-2584 | 2584 | Android: error states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2585 | 2585 | Android: error states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2586 | 2586 | Android: error states --- verify retry path. | NOT_STARTED | — |
| OGVPN-2587 | 2587 | Android: error states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2588 | 2588 | Android: error states --- verify offline path. | NOT_STARTED | — |
| OGVPN-2589 | 2589 | Android: error states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / offline recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2590 | 2590 | Android: offline recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2591 | 2591 | Android: offline recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2592 | 2592 | Android: offline recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-2593 | 2593 | Android: offline recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-2594 | 2594 | Android: offline recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2595 | 2595 | Android: offline recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2596 | 2596 | Android: offline recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-2597 | 2597 | Android: offline recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2598 | 2598 | Android: offline recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-2599 | 2599 | Android: offline recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / network switching

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2600 | 2600 | Android: network switching --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2601 | 2601 | Android: network switching --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2602 | 2602 | Android: network switching --- verify success path. | NOT_STARTED | — |
| OGVPN-2603 | 2603 | Android: network switching --- verify failure path. | NOT_STARTED | — |
| OGVPN-2604 | 2604 | Android: network switching --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2605 | 2605 | Android: network switching --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2606 | 2606 | Android: network switching --- verify retry path. | NOT_STARTED | — |
| OGVPN-2607 | 2607 | Android: network switching --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2608 | 2608 | Android: network switching --- verify offline path. | NOT_STARTED | — |
| OGVPN-2609 | 2609 | Android: network switching --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / VPN connection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2610 | 2610 | Android: VPN connection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2611 | 2611 | Android: VPN connection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2612 | 2612 | Android: VPN connection --- verify success path. | NOT_STARTED | — |
| OGVPN-2613 | 2613 | Android: VPN connection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2614 | 2614 | Android: VPN connection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2615 | 2615 | Android: VPN connection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2616 | 2616 | Android: VPN connection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2617 | 2617 | Android: VPN connection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2618 | 2618 | Android: VPN connection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2619 | 2619 | Android: VPN connection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / VPN disconnection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2620 | 2620 | Android: VPN disconnection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2621 | 2621 | Android: VPN disconnection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2622 | 2622 | Android: VPN disconnection --- verify success path. | NOT_STARTED | — |
| OGVPN-2623 | 2623 | Android: VPN disconnection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2624 | 2624 | Android: VPN disconnection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2625 | 2625 | Android: VPN disconnection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2626 | 2626 | Android: VPN disconnection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2627 | 2627 | Android: VPN disconnection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2628 | 2628 | Android: VPN disconnection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2629 | 2629 | Android: VPN disconnection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / server selection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2630 | 2630 | Android: server selection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2631 | 2631 | Android: server selection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2632 | 2632 | Android: server selection --- verify success path. | NOT_STARTED | — |
| OGVPN-2633 | 2633 | Android: server selection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2634 | 2634 | Android: server selection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2635 | 2635 | Android: server selection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2636 | 2636 | Android: server selection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2637 | 2637 | Android: server selection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2638 | 2638 | Android: server selection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2639 | 2639 | Android: server selection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / device management

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2640 | 2640 | Android: device management --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2641 | 2641 | Android: device management --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2642 | 2642 | Android: device management --- verify success path. | NOT_STARTED | — |
| OGVPN-2643 | 2643 | Android: device management --- verify failure path. | NOT_STARTED | — |
| OGVPN-2644 | 2644 | Android: device management --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2645 | 2645 | Android: device management --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2646 | 2646 | Android: device management --- verify retry path. | NOT_STARTED | — |
| OGVPN-2647 | 2647 | Android: device management --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2648 | 2648 | Android: device management --- verify offline path. | NOT_STARTED | — |
| OGVPN-2649 | 2649 | Android: device management --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / settings

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2650 | 2650 | Android: settings --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2651 | 2651 | Android: settings --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2652 | 2652 | Android: settings --- verify success path. | NOT_STARTED | — |
| OGVPN-2653 | 2653 | Android: settings --- verify failure path. | NOT_STARTED | — |
| OGVPN-2654 | 2654 | Android: settings --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2655 | 2655 | Android: settings --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2656 | 2656 | Android: settings --- verify retry path. | NOT_STARTED | — |
| OGVPN-2657 | 2657 | Android: settings --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2658 | 2658 | Android: settings --- verify offline path. | NOT_STARTED | — |
| OGVPN-2659 | 2659 | Android: settings --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / notifications

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2660 | 2660 | Android: notifications --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2661 | 2661 | Android: notifications --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2662 | 2662 | Android: notifications --- verify success path. | NOT_STARTED | — |
| OGVPN-2663 | 2663 | Android: notifications --- verify failure path. | NOT_STARTED | — |
| OGVPN-2664 | 2664 | Android: notifications --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2665 | 2665 | Android: notifications --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2666 | 2666 | Android: notifications --- verify retry path. | NOT_STARTED | — |
| OGVPN-2667 | 2667 | Android: notifications --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2668 | 2668 | Android: notifications --- verify offline path. | NOT_STARTED | — |
| OGVPN-2669 | 2669 | Android: notifications --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / billing

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2670 | 2670 | Android: billing --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2671 | 2671 | Android: billing --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2672 | 2672 | Android: billing --- verify success path. | NOT_STARTED | — |
| OGVPN-2673 | 2673 | Android: billing --- verify failure path. | NOT_STARTED | — |
| OGVPN-2674 | 2674 | Android: billing --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2675 | 2675 | Android: billing --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2676 | 2676 | Android: billing --- verify retry path. | NOT_STARTED | — |
| OGVPN-2677 | 2677 | Android: billing --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2678 | 2678 | Android: billing --- verify offline path. | NOT_STARTED | — |
| OGVPN-2679 | 2679 | Android: billing --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / support

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2680 | 2680 | Android: support --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2681 | 2681 | Android: support --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2682 | 2682 | Android: support --- verify success path. | NOT_STARTED | — |
| OGVPN-2683 | 2683 | Android: support --- verify failure path. | NOT_STARTED | — |
| OGVPN-2684 | 2684 | Android: support --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2685 | 2685 | Android: support --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2686 | 2686 | Android: support --- verify retry path. | NOT_STARTED | — |
| OGVPN-2687 | 2687 | Android: support --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2688 | 2688 | Android: support --- verify offline path. | NOT_STARTED | — |
| OGVPN-2689 | 2689 | Android: support --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / accessibility

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2690 | 2690 | Android: accessibility --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2691 | 2691 | Android: accessibility --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2692 | 2692 | Android: accessibility --- verify success path. | NOT_STARTED | — |
| OGVPN-2693 | 2693 | Android: accessibility --- verify failure path. | NOT_STARTED | — |
| OGVPN-2694 | 2694 | Android: accessibility --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2695 | 2695 | Android: accessibility --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2696 | 2696 | Android: accessibility --- verify retry path. | NOT_STARTED | — |
| OGVPN-2697 | 2697 | Android: accessibility --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2698 | 2698 | Android: accessibility --- verify offline path. | NOT_STARTED | — |
| OGVPN-2699 | 2699 | Android: accessibility --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / responsive behavior

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2700 | 2700 | Android: responsive behavior --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2701 | 2701 | Android: responsive behavior --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2702 | 2702 | Android: responsive behavior --- verify success path. | NOT_STARTED | — |
| OGVPN-2703 | 2703 | Android: responsive behavior --- verify failure path. | NOT_STARTED | — |
| OGVPN-2704 | 2704 | Android: responsive behavior --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2705 | 2705 | Android: responsive behavior --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2706 | 2706 | Android: responsive behavior --- verify retry path. | NOT_STARTED | — |
| OGVPN-2707 | 2707 | Android: responsive behavior --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2708 | 2708 | Android: responsive behavior --- verify offline path. | NOT_STARTED | — |
| OGVPN-2709 | 2709 | Android: responsive behavior --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / keyboard/input

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2710 | 2710 | Android: keyboard/input --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2711 | 2711 | Android: keyboard/input --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2712 | 2712 | Android: keyboard/input --- verify success path. | NOT_STARTED | — |
| OGVPN-2713 | 2713 | Android: keyboard/input --- verify failure path. | NOT_STARTED | — |
| OGVPN-2714 | 2714 | Android: keyboard/input --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2715 | 2715 | Android: keyboard/input --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2716 | 2716 | Android: keyboard/input --- verify retry path. | NOT_STARTED | — |
| OGVPN-2717 | 2717 | Android: keyboard/input --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2718 | 2718 | Android: keyboard/input --- verify offline path. | NOT_STARTED | — |
| OGVPN-2719 | 2719 | Android: keyboard/input --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / permissions

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2720 | 2720 | Android: permissions --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2721 | 2721 | Android: permissions --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2722 | 2722 | Android: permissions --- verify success path. | NOT_STARTED | — |
| OGVPN-2723 | 2723 | Android: permissions --- verify failure path. | NOT_STARTED | — |
| OGVPN-2724 | 2724 | Android: permissions --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2725 | 2725 | Android: permissions --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2726 | 2726 | Android: permissions --- verify retry path. | NOT_STARTED | — |
| OGVPN-2727 | 2727 | Android: permissions --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2728 | 2728 | Android: permissions --- verify offline path. | NOT_STARTED | — |
| OGVPN-2729 | 2729 | Android: permissions --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / deep links

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2730 | 2730 | Android: deep links --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2731 | 2731 | Android: deep links --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2732 | 2732 | Android: deep links --- verify success path. | NOT_STARTED | — |
| OGVPN-2733 | 2733 | Android: deep links --- verify failure path. | NOT_STARTED | — |
| OGVPN-2734 | 2734 | Android: deep links --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2735 | 2735 | Android: deep links --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2736 | 2736 | Android: deep links --- verify retry path. | NOT_STARTED | — |
| OGVPN-2737 | 2737 | Android: deep links --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2738 | 2738 | Android: deep links --- verify offline path. | NOT_STARTED | — |
| OGVPN-2739 | 2739 | Android: deep links --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / logging

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2740 | 2740 | Android: logging --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2741 | 2741 | Android: logging --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2742 | 2742 | Android: logging --- verify success path. | NOT_STARTED | — |
| OGVPN-2743 | 2743 | Android: logging --- verify failure path. | NOT_STARTED | — |
| OGVPN-2744 | 2744 | Android: logging --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2745 | 2745 | Android: logging --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2746 | 2746 | Android: logging --- verify retry path. | NOT_STARTED | — |
| OGVPN-2747 | 2747 | Android: logging --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2748 | 2748 | Android: logging --- verify offline path. | NOT_STARTED | — |
| OGVPN-2749 | 2749 | Android: logging --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / analytics

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2750 | 2750 | Android: analytics --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2751 | 2751 | Android: analytics --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2752 | 2752 | Android: analytics --- verify success path. | NOT_STARTED | — |
| OGVPN-2753 | 2753 | Android: analytics --- verify failure path. | NOT_STARTED | — |
| OGVPN-2754 | 2754 | Android: analytics --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2755 | 2755 | Android: analytics --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2756 | 2756 | Android: analytics --- verify retry path. | NOT_STARTED | — |
| OGVPN-2757 | 2757 | Android: analytics --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2758 | 2758 | Android: analytics --- verify offline path. | NOT_STARTED | — |
| OGVPN-2759 | 2759 | Android: analytics --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2760 | 2760 | Android: security --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2761 | 2761 | Android: security --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2762 | 2762 | Android: security --- verify success path. | NOT_STARTED | — |
| OGVPN-2763 | 2763 | Android: security --- verify failure path. | NOT_STARTED | — |
| OGVPN-2764 | 2764 | Android: security --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2765 | 2765 | Android: security --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2766 | 2766 | Android: security --- verify retry path. | NOT_STARTED | — |
| OGVPN-2767 | 2767 | Android: security --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2768 | 2768 | Android: security --- verify offline path. | NOT_STARTED | — |
| OGVPN-2769 | 2769 | Android: security --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / performance

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2770 | 2770 | Android: performance --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2771 | 2771 | Android: performance --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2772 | 2772 | Android: performance --- verify success path. | NOT_STARTED | — |
| OGVPN-2773 | 2773 | Android: performance --- verify failure path. | NOT_STARTED | — |
| OGVPN-2774 | 2774 | Android: performance --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2775 | 2775 | Android: performance --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2776 | 2776 | Android: performance --- verify retry path. | NOT_STARTED | — |
| OGVPN-2777 | 2777 | Android: performance --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2778 | 2778 | Android: performance --- verify offline path. | NOT_STARTED | — |
| OGVPN-2779 | 2779 | Android: performance --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / state synchronization

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2780 | 2780 | Android: state synchronization --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2781 | 2781 | Android: state synchronization --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2782 | 2782 | Android: state synchronization --- verify success path. | NOT_STARTED | — |
| OGVPN-2783 | 2783 | Android: state synchronization --- verify failure path. | NOT_STARTED | — |
| OGVPN-2784 | 2784 | Android: state synchronization --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2785 | 2785 | Android: state synchronization --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2786 | 2786 | Android: state synchronization --- verify retry path. | NOT_STARTED | — |
| OGVPN-2787 | 2787 | Android: state synchronization --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2788 | 2788 | Android: state synchronization --- verify offline path. | NOT_STARTED | — |
| OGVPN-2789 | 2789 | Android: state synchronization --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / update/restart recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2790 | 2790 | Android: update/restart recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2791 | 2791 | Android: update/restart recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2792 | 2792 | Android: update/restart recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-2793 | 2793 | Android: update/restart recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-2794 | 2794 | Android: update/restart recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2795 | 2795 | Android: update/restart recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2796 | 2796 | Android: update/restart recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-2797 | 2797 | Android: update/restart recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2798 | 2798 | Android: update/restart recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-2799 | 2799 | Android: update/restart recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / duplicate-action protection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2800 | 2800 | Android: duplicate-action protection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2801 | 2801 | Android: duplicate-action protection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2802 | 2802 | Android: duplicate-action protection --- verify success path. | NOT_STARTED | — |
| OGVPN-2803 | 2803 | Android: duplicate-action protection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2804 | 2804 | Android: duplicate-action protection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2805 | 2805 | Android: duplicate-action protection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2806 | 2806 | Android: duplicate-action protection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2807 | 2807 | Android: duplicate-action protection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2808 | 2808 | Android: duplicate-action protection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2809 | 2809 | Android: duplicate-action protection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Android / API contract handling

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2810 | 2810 | Android: API contract handling --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2811 | 2811 | Android: API contract handling --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2812 | 2812 | Android: API contract handling --- verify success path. | NOT_STARTED | — |
| OGVPN-2813 | 2813 | Android: API contract handling --- verify failure path. | NOT_STARTED | — |
| OGVPN-2814 | 2814 | Android: API contract handling --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2815 | 2815 | Android: API contract handling --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2816 | 2816 | Android: API contract handling --- verify retry path. | NOT_STARTED | — |
| OGVPN-2817 | 2817 | Android: API contract handling --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2818 | 2818 | Android: API contract handling --- verify offline path. | NOT_STARTED | — |
| OGVPN-2819 | 2819 | Android: API contract handling --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / authentication

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2820 | 2820 | Desktop: authentication --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2821 | 2821 | Desktop: authentication --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2822 | 2822 | Desktop: authentication --- verify success path. | NOT_STARTED | — |
| OGVPN-2823 | 2823 | Desktop: authentication --- verify failure path. | NOT_STARTED | — |
| OGVPN-2824 | 2824 | Desktop: authentication --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2825 | 2825 | Desktop: authentication --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2826 | 2826 | Desktop: authentication --- verify retry path. | NOT_STARTED | — |
| OGVPN-2827 | 2827 | Desktop: authentication --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2828 | 2828 | Desktop: authentication --- verify offline path. | NOT_STARTED | — |
| OGVPN-2829 | 2829 | Desktop: authentication --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / session persistence

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2830 | 2830 | Desktop: session persistence --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2831 | 2831 | Desktop: session persistence --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2832 | 2832 | Desktop: session persistence --- verify success path. | NOT_STARTED | — |
| OGVPN-2833 | 2833 | Desktop: session persistence --- verify failure path. | NOT_STARTED | — |
| OGVPN-2834 | 2834 | Desktop: session persistence --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2835 | 2835 | Desktop: session persistence --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2836 | 2836 | Desktop: session persistence --- verify retry path. | NOT_STARTED | — |
| OGVPN-2837 | 2837 | Desktop: session persistence --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2838 | 2838 | Desktop: session persistence --- verify offline path. | NOT_STARTED | — |
| OGVPN-2839 | 2839 | Desktop: session persistence --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / navigation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2840 | 2840 | Desktop: navigation --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2841 | 2841 | Desktop: navigation --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2842 | 2842 | Desktop: navigation --- verify success path. | NOT_STARTED | — |
| OGVPN-2843 | 2843 | Desktop: navigation --- verify failure path. | NOT_STARTED | — |
| OGVPN-2844 | 2844 | Desktop: navigation --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2845 | 2845 | Desktop: navigation --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2846 | 2846 | Desktop: navigation --- verify retry path. | NOT_STARTED | — |
| OGVPN-2847 | 2847 | Desktop: navigation --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2848 | 2848 | Desktop: navigation --- verify offline path. | NOT_STARTED | — |
| OGVPN-2849 | 2849 | Desktop: navigation --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / forms

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2850 | 2850 | Desktop: forms --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2851 | 2851 | Desktop: forms --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2852 | 2852 | Desktop: forms --- verify success path. | NOT_STARTED | — |
| OGVPN-2853 | 2853 | Desktop: forms --- verify failure path. | NOT_STARTED | — |
| OGVPN-2854 | 2854 | Desktop: forms --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2855 | 2855 | Desktop: forms --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2856 | 2856 | Desktop: forms --- verify retry path. | NOT_STARTED | — |
| OGVPN-2857 | 2857 | Desktop: forms --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2858 | 2858 | Desktop: forms --- verify offline path. | NOT_STARTED | — |
| OGVPN-2859 | 2859 | Desktop: forms --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / loading states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2860 | 2860 | Desktop: loading states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2861 | 2861 | Desktop: loading states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2862 | 2862 | Desktop: loading states --- verify success path. | NOT_STARTED | — |
| OGVPN-2863 | 2863 | Desktop: loading states --- verify failure path. | NOT_STARTED | — |
| OGVPN-2864 | 2864 | Desktop: loading states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2865 | 2865 | Desktop: loading states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2866 | 2866 | Desktop: loading states --- verify retry path. | NOT_STARTED | — |
| OGVPN-2867 | 2867 | Desktop: loading states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2868 | 2868 | Desktop: loading states --- verify offline path. | NOT_STARTED | — |
| OGVPN-2869 | 2869 | Desktop: loading states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / error states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2870 | 2870 | Desktop: error states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2871 | 2871 | Desktop: error states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2872 | 2872 | Desktop: error states --- verify success path. | NOT_STARTED | — |
| OGVPN-2873 | 2873 | Desktop: error states --- verify failure path. | NOT_STARTED | — |
| OGVPN-2874 | 2874 | Desktop: error states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2875 | 2875 | Desktop: error states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2876 | 2876 | Desktop: error states --- verify retry path. | NOT_STARTED | — |
| OGVPN-2877 | 2877 | Desktop: error states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2878 | 2878 | Desktop: error states --- verify offline path. | NOT_STARTED | — |
| OGVPN-2879 | 2879 | Desktop: error states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / offline recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2880 | 2880 | Desktop: offline recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2881 | 2881 | Desktop: offline recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2882 | 2882 | Desktop: offline recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-2883 | 2883 | Desktop: offline recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-2884 | 2884 | Desktop: offline recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2885 | 2885 | Desktop: offline recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2886 | 2886 | Desktop: offline recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-2887 | 2887 | Desktop: offline recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2888 | 2888 | Desktop: offline recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-2889 | 2889 | Desktop: offline recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / network switching

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2890 | 2890 | Desktop: network switching --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2891 | 2891 | Desktop: network switching --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2892 | 2892 | Desktop: network switching --- verify success path. | NOT_STARTED | — |
| OGVPN-2893 | 2893 | Desktop: network switching --- verify failure path. | NOT_STARTED | — |
| OGVPN-2894 | 2894 | Desktop: network switching --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2895 | 2895 | Desktop: network switching --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2896 | 2896 | Desktop: network switching --- verify retry path. | NOT_STARTED | — |
| OGVPN-2897 | 2897 | Desktop: network switching --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2898 | 2898 | Desktop: network switching --- verify offline path. | NOT_STARTED | — |
| OGVPN-2899 | 2899 | Desktop: network switching --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / VPN connection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2900 | 2900 | Desktop: VPN connection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2901 | 2901 | Desktop: VPN connection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2902 | 2902 | Desktop: VPN connection --- verify success path. | NOT_STARTED | — |
| OGVPN-2903 | 2903 | Desktop: VPN connection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2904 | 2904 | Desktop: VPN connection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2905 | 2905 | Desktop: VPN connection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2906 | 2906 | Desktop: VPN connection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2907 | 2907 | Desktop: VPN connection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2908 | 2908 | Desktop: VPN connection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2909 | 2909 | Desktop: VPN connection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / VPN disconnection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2910 | 2910 | Desktop: VPN disconnection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2911 | 2911 | Desktop: VPN disconnection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2912 | 2912 | Desktop: VPN disconnection --- verify success path. | NOT_STARTED | — |
| OGVPN-2913 | 2913 | Desktop: VPN disconnection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2914 | 2914 | Desktop: VPN disconnection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2915 | 2915 | Desktop: VPN disconnection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2916 | 2916 | Desktop: VPN disconnection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2917 | 2917 | Desktop: VPN disconnection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2918 | 2918 | Desktop: VPN disconnection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2919 | 2919 | Desktop: VPN disconnection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / server selection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2920 | 2920 | Desktop: server selection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2921 | 2921 | Desktop: server selection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2922 | 2922 | Desktop: server selection --- verify success path. | NOT_STARTED | — |
| OGVPN-2923 | 2923 | Desktop: server selection --- verify failure path. | NOT_STARTED | — |
| OGVPN-2924 | 2924 | Desktop: server selection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2925 | 2925 | Desktop: server selection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2926 | 2926 | Desktop: server selection --- verify retry path. | NOT_STARTED | — |
| OGVPN-2927 | 2927 | Desktop: server selection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2928 | 2928 | Desktop: server selection --- verify offline path. | NOT_STARTED | — |
| OGVPN-2929 | 2929 | Desktop: server selection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / device management

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2930 | 2930 | Desktop: device management --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2931 | 2931 | Desktop: device management --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2932 | 2932 | Desktop: device management --- verify success path. | NOT_STARTED | — |
| OGVPN-2933 | 2933 | Desktop: device management --- verify failure path. | NOT_STARTED | — |
| OGVPN-2934 | 2934 | Desktop: device management --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2935 | 2935 | Desktop: device management --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2936 | 2936 | Desktop: device management --- verify retry path. | NOT_STARTED | — |
| OGVPN-2937 | 2937 | Desktop: device management --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2938 | 2938 | Desktop: device management --- verify offline path. | NOT_STARTED | — |
| OGVPN-2939 | 2939 | Desktop: device management --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / settings

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2940 | 2940 | Desktop: settings --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2941 | 2941 | Desktop: settings --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2942 | 2942 | Desktop: settings --- verify success path. | NOT_STARTED | — |
| OGVPN-2943 | 2943 | Desktop: settings --- verify failure path. | NOT_STARTED | — |
| OGVPN-2944 | 2944 | Desktop: settings --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2945 | 2945 | Desktop: settings --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2946 | 2946 | Desktop: settings --- verify retry path. | NOT_STARTED | — |
| OGVPN-2947 | 2947 | Desktop: settings --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2948 | 2948 | Desktop: settings --- verify offline path. | NOT_STARTED | — |
| OGVPN-2949 | 2949 | Desktop: settings --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / notifications

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2950 | 2950 | Desktop: notifications --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2951 | 2951 | Desktop: notifications --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2952 | 2952 | Desktop: notifications --- verify success path. | NOT_STARTED | — |
| OGVPN-2953 | 2953 | Desktop: notifications --- verify failure path. | NOT_STARTED | — |
| OGVPN-2954 | 2954 | Desktop: notifications --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2955 | 2955 | Desktop: notifications --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2956 | 2956 | Desktop: notifications --- verify retry path. | NOT_STARTED | — |
| OGVPN-2957 | 2957 | Desktop: notifications --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2958 | 2958 | Desktop: notifications --- verify offline path. | NOT_STARTED | — |
| OGVPN-2959 | 2959 | Desktop: notifications --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / billing

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2960 | 2960 | Desktop: billing --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2961 | 2961 | Desktop: billing --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2962 | 2962 | Desktop: billing --- verify success path. | NOT_STARTED | — |
| OGVPN-2963 | 2963 | Desktop: billing --- verify failure path. | NOT_STARTED | — |
| OGVPN-2964 | 2964 | Desktop: billing --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2965 | 2965 | Desktop: billing --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2966 | 2966 | Desktop: billing --- verify retry path. | NOT_STARTED | — |
| OGVPN-2967 | 2967 | Desktop: billing --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2968 | 2968 | Desktop: billing --- verify offline path. | NOT_STARTED | — |
| OGVPN-2969 | 2969 | Desktop: billing --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / support

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2970 | 2970 | Desktop: support --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2971 | 2971 | Desktop: support --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2972 | 2972 | Desktop: support --- verify success path. | NOT_STARTED | — |
| OGVPN-2973 | 2973 | Desktop: support --- verify failure path. | NOT_STARTED | — |
| OGVPN-2974 | 2974 | Desktop: support --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2975 | 2975 | Desktop: support --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2976 | 2976 | Desktop: support --- verify retry path. | NOT_STARTED | — |
| OGVPN-2977 | 2977 | Desktop: support --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2978 | 2978 | Desktop: support --- verify offline path. | NOT_STARTED | — |
| OGVPN-2979 | 2979 | Desktop: support --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / accessibility

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2980 | 2980 | Desktop: accessibility --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2981 | 2981 | Desktop: accessibility --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2982 | 2982 | Desktop: accessibility --- verify success path. | NOT_STARTED | — |
| OGVPN-2983 | 2983 | Desktop: accessibility --- verify failure path. | NOT_STARTED | — |
| OGVPN-2984 | 2984 | Desktop: accessibility --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2985 | 2985 | Desktop: accessibility --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2986 | 2986 | Desktop: accessibility --- verify retry path. | NOT_STARTED | — |
| OGVPN-2987 | 2987 | Desktop: accessibility --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2988 | 2988 | Desktop: accessibility --- verify offline path. | NOT_STARTED | — |
| OGVPN-2989 | 2989 | Desktop: accessibility --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / responsive behavior

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-2990 | 2990 | Desktop: responsive behavior --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-2991 | 2991 | Desktop: responsive behavior --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-2992 | 2992 | Desktop: responsive behavior --- verify success path. | NOT_STARTED | — |
| OGVPN-2993 | 2993 | Desktop: responsive behavior --- verify failure path. | NOT_STARTED | — |
| OGVPN-2994 | 2994 | Desktop: responsive behavior --- verify timeout path. | NOT_STARTED | — |
| OGVPN-2995 | 2995 | Desktop: responsive behavior --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-2996 | 2996 | Desktop: responsive behavior --- verify retry path. | NOT_STARTED | — |
| OGVPN-2997 | 2997 | Desktop: responsive behavior --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-2998 | 2998 | Desktop: responsive behavior --- verify offline path. | NOT_STARTED | — |
| OGVPN-2999 | 2999 | Desktop: responsive behavior --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / keyboard/input

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3000 | 3000 | Desktop: keyboard/input --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3001 | 3001 | Desktop: keyboard/input --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3002 | 3002 | Desktop: keyboard/input --- verify success path. | NOT_STARTED | — |
| OGVPN-3003 | 3003 | Desktop: keyboard/input --- verify failure path. | NOT_STARTED | — |
| OGVPN-3004 | 3004 | Desktop: keyboard/input --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3005 | 3005 | Desktop: keyboard/input --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3006 | 3006 | Desktop: keyboard/input --- verify retry path. | NOT_STARTED | — |
| OGVPN-3007 | 3007 | Desktop: keyboard/input --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3008 | 3008 | Desktop: keyboard/input --- verify offline path. | NOT_STARTED | — |
| OGVPN-3009 | 3009 | Desktop: keyboard/input --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / permissions

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3010 | 3010 | Desktop: permissions --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3011 | 3011 | Desktop: permissions --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3012 | 3012 | Desktop: permissions --- verify success path. | NOT_STARTED | — |
| OGVPN-3013 | 3013 | Desktop: permissions --- verify failure path. | NOT_STARTED | — |
| OGVPN-3014 | 3014 | Desktop: permissions --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3015 | 3015 | Desktop: permissions --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3016 | 3016 | Desktop: permissions --- verify retry path. | NOT_STARTED | — |
| OGVPN-3017 | 3017 | Desktop: permissions --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3018 | 3018 | Desktop: permissions --- verify offline path. | NOT_STARTED | — |
| OGVPN-3019 | 3019 | Desktop: permissions --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / deep links

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3020 | 3020 | Desktop: deep links --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3021 | 3021 | Desktop: deep links --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3022 | 3022 | Desktop: deep links --- verify success path. | NOT_STARTED | — |
| OGVPN-3023 | 3023 | Desktop: deep links --- verify failure path. | NOT_STARTED | — |
| OGVPN-3024 | 3024 | Desktop: deep links --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3025 | 3025 | Desktop: deep links --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3026 | 3026 | Desktop: deep links --- verify retry path. | NOT_STARTED | — |
| OGVPN-3027 | 3027 | Desktop: deep links --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3028 | 3028 | Desktop: deep links --- verify offline path. | NOT_STARTED | — |
| OGVPN-3029 | 3029 | Desktop: deep links --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / logging

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3030 | 3030 | Desktop: logging --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3031 | 3031 | Desktop: logging --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3032 | 3032 | Desktop: logging --- verify success path. | NOT_STARTED | — |
| OGVPN-3033 | 3033 | Desktop: logging --- verify failure path. | NOT_STARTED | — |
| OGVPN-3034 | 3034 | Desktop: logging --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3035 | 3035 | Desktop: logging --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3036 | 3036 | Desktop: logging --- verify retry path. | NOT_STARTED | — |
| OGVPN-3037 | 3037 | Desktop: logging --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3038 | 3038 | Desktop: logging --- verify offline path. | NOT_STARTED | — |
| OGVPN-3039 | 3039 | Desktop: logging --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / analytics

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3040 | 3040 | Desktop: analytics --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3041 | 3041 | Desktop: analytics --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3042 | 3042 | Desktop: analytics --- verify success path. | NOT_STARTED | — |
| OGVPN-3043 | 3043 | Desktop: analytics --- verify failure path. | NOT_STARTED | — |
| OGVPN-3044 | 3044 | Desktop: analytics --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3045 | 3045 | Desktop: analytics --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3046 | 3046 | Desktop: analytics --- verify retry path. | NOT_STARTED | — |
| OGVPN-3047 | 3047 | Desktop: analytics --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3048 | 3048 | Desktop: analytics --- verify offline path. | NOT_STARTED | — |
| OGVPN-3049 | 3049 | Desktop: analytics --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3050 | 3050 | Desktop: security --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3051 | 3051 | Desktop: security --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3052 | 3052 | Desktop: security --- verify success path. | NOT_STARTED | — |
| OGVPN-3053 | 3053 | Desktop: security --- verify failure path. | NOT_STARTED | — |
| OGVPN-3054 | 3054 | Desktop: security --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3055 | 3055 | Desktop: security --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3056 | 3056 | Desktop: security --- verify retry path. | NOT_STARTED | — |
| OGVPN-3057 | 3057 | Desktop: security --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3058 | 3058 | Desktop: security --- verify offline path. | NOT_STARTED | — |
| OGVPN-3059 | 3059 | Desktop: security --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / performance

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3060 | 3060 | Desktop: performance --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3061 | 3061 | Desktop: performance --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3062 | 3062 | Desktop: performance --- verify success path. | NOT_STARTED | — |
| OGVPN-3063 | 3063 | Desktop: performance --- verify failure path. | NOT_STARTED | — |
| OGVPN-3064 | 3064 | Desktop: performance --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3065 | 3065 | Desktop: performance --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3066 | 3066 | Desktop: performance --- verify retry path. | NOT_STARTED | — |
| OGVPN-3067 | 3067 | Desktop: performance --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3068 | 3068 | Desktop: performance --- verify offline path. | NOT_STARTED | — |
| OGVPN-3069 | 3069 | Desktop: performance --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / state synchronization

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3070 | 3070 | Desktop: state synchronization --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3071 | 3071 | Desktop: state synchronization --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3072 | 3072 | Desktop: state synchronization --- verify success path. | NOT_STARTED | — |
| OGVPN-3073 | 3073 | Desktop: state synchronization --- verify failure path. | NOT_STARTED | — |
| OGVPN-3074 | 3074 | Desktop: state synchronization --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3075 | 3075 | Desktop: state synchronization --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3076 | 3076 | Desktop: state synchronization --- verify retry path. | NOT_STARTED | — |
| OGVPN-3077 | 3077 | Desktop: state synchronization --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3078 | 3078 | Desktop: state synchronization --- verify offline path. | NOT_STARTED | — |
| OGVPN-3079 | 3079 | Desktop: state synchronization --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / update/restart recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3080 | 3080 | Desktop: update/restart recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3081 | 3081 | Desktop: update/restart recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3082 | 3082 | Desktop: update/restart recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-3083 | 3083 | Desktop: update/restart recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-3084 | 3084 | Desktop: update/restart recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3085 | 3085 | Desktop: update/restart recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3086 | 3086 | Desktop: update/restart recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-3087 | 3087 | Desktop: update/restart recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3088 | 3088 | Desktop: update/restart recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-3089 | 3089 | Desktop: update/restart recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / duplicate-action protection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3090 | 3090 | Desktop: duplicate-action protection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3091 | 3091 | Desktop: duplicate-action protection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3092 | 3092 | Desktop: duplicate-action protection --- verify success path. | NOT_STARTED | — |
| OGVPN-3093 | 3093 | Desktop: duplicate-action protection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3094 | 3094 | Desktop: duplicate-action protection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3095 | 3095 | Desktop: duplicate-action protection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3096 | 3096 | Desktop: duplicate-action protection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3097 | 3097 | Desktop: duplicate-action protection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3098 | 3098 | Desktop: duplicate-action protection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3099 | 3099 | Desktop: duplicate-action protection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Desktop / API contract handling

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3100 | 3100 | Desktop: API contract handling --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3101 | 3101 | Desktop: API contract handling --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3102 | 3102 | Desktop: API contract handling --- verify success path. | NOT_STARTED | — |
| OGVPN-3103 | 3103 | Desktop: API contract handling --- verify failure path. | NOT_STARTED | — |
| OGVPN-3104 | 3104 | Desktop: API contract handling --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3105 | 3105 | Desktop: API contract handling --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3106 | 3106 | Desktop: API contract handling --- verify retry path. | NOT_STARTED | — |
| OGVPN-3107 | 3107 | Desktop: API contract handling --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3108 | 3108 | Desktop: API contract handling --- verify offline path. | NOT_STARTED | — |
| OGVPN-3109 | 3109 | Desktop: API contract handling --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / authentication

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3110 | 3110 | Chrome extension: authentication --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3111 | 3111 | Chrome extension: authentication --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3112 | 3112 | Chrome extension: authentication --- verify success path. | NOT_STARTED | — |
| OGVPN-3113 | 3113 | Chrome extension: authentication --- verify failure path. | NOT_STARTED | — |
| OGVPN-3114 | 3114 | Chrome extension: authentication --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3115 | 3115 | Chrome extension: authentication --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3116 | 3116 | Chrome extension: authentication --- verify retry path. | NOT_STARTED | — |
| OGVPN-3117 | 3117 | Chrome extension: authentication --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3118 | 3118 | Chrome extension: authentication --- verify offline path. | NOT_STARTED | — |
| OGVPN-3119 | 3119 | Chrome extension: authentication --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / session persistence

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3120 | 3120 | Chrome extension: session persistence --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3121 | 3121 | Chrome extension: session persistence --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3122 | 3122 | Chrome extension: session persistence --- verify success path. | NOT_STARTED | — |
| OGVPN-3123 | 3123 | Chrome extension: session persistence --- verify failure path. | NOT_STARTED | — |
| OGVPN-3124 | 3124 | Chrome extension: session persistence --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3125 | 3125 | Chrome extension: session persistence --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3126 | 3126 | Chrome extension: session persistence --- verify retry path. | NOT_STARTED | — |
| OGVPN-3127 | 3127 | Chrome extension: session persistence --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3128 | 3128 | Chrome extension: session persistence --- verify offline path. | NOT_STARTED | — |
| OGVPN-3129 | 3129 | Chrome extension: session persistence --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / navigation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3130 | 3130 | Chrome extension: navigation --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3131 | 3131 | Chrome extension: navigation --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3132 | 3132 | Chrome extension: navigation --- verify success path. | NOT_STARTED | — |
| OGVPN-3133 | 3133 | Chrome extension: navigation --- verify failure path. | NOT_STARTED | — |
| OGVPN-3134 | 3134 | Chrome extension: navigation --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3135 | 3135 | Chrome extension: navigation --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3136 | 3136 | Chrome extension: navigation --- verify retry path. | NOT_STARTED | — |
| OGVPN-3137 | 3137 | Chrome extension: navigation --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3138 | 3138 | Chrome extension: navigation --- verify offline path. | NOT_STARTED | — |
| OGVPN-3139 | 3139 | Chrome extension: navigation --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / forms

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3140 | 3140 | Chrome extension: forms --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3141 | 3141 | Chrome extension: forms --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3142 | 3142 | Chrome extension: forms --- verify success path. | NOT_STARTED | — |
| OGVPN-3143 | 3143 | Chrome extension: forms --- verify failure path. | NOT_STARTED | — |
| OGVPN-3144 | 3144 | Chrome extension: forms --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3145 | 3145 | Chrome extension: forms --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3146 | 3146 | Chrome extension: forms --- verify retry path. | NOT_STARTED | — |
| OGVPN-3147 | 3147 | Chrome extension: forms --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3148 | 3148 | Chrome extension: forms --- verify offline path. | NOT_STARTED | — |
| OGVPN-3149 | 3149 | Chrome extension: forms --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / loading states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3150 | 3150 | Chrome extension: loading states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3151 | 3151 | Chrome extension: loading states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3152 | 3152 | Chrome extension: loading states --- verify success path. | NOT_STARTED | — |
| OGVPN-3153 | 3153 | Chrome extension: loading states --- verify failure path. | NOT_STARTED | — |
| OGVPN-3154 | 3154 | Chrome extension: loading states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3155 | 3155 | Chrome extension: loading states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3156 | 3156 | Chrome extension: loading states --- verify retry path. | NOT_STARTED | — |
| OGVPN-3157 | 3157 | Chrome extension: loading states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3158 | 3158 | Chrome extension: loading states --- verify offline path. | NOT_STARTED | — |
| OGVPN-3159 | 3159 | Chrome extension: loading states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / error states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3160 | 3160 | Chrome extension: error states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3161 | 3161 | Chrome extension: error states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3162 | 3162 | Chrome extension: error states --- verify success path. | NOT_STARTED | — |
| OGVPN-3163 | 3163 | Chrome extension: error states --- verify failure path. | NOT_STARTED | — |
| OGVPN-3164 | 3164 | Chrome extension: error states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3165 | 3165 | Chrome extension: error states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3166 | 3166 | Chrome extension: error states --- verify retry path. | NOT_STARTED | — |
| OGVPN-3167 | 3167 | Chrome extension: error states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3168 | 3168 | Chrome extension: error states --- verify offline path. | NOT_STARTED | — |
| OGVPN-3169 | 3169 | Chrome extension: error states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / offline recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3170 | 3170 | Chrome extension: offline recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3171 | 3171 | Chrome extension: offline recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3172 | 3172 | Chrome extension: offline recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-3173 | 3173 | Chrome extension: offline recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-3174 | 3174 | Chrome extension: offline recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3175 | 3175 | Chrome extension: offline recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3176 | 3176 | Chrome extension: offline recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-3177 | 3177 | Chrome extension: offline recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3178 | 3178 | Chrome extension: offline recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-3179 | 3179 | Chrome extension: offline recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / network switching

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3180 | 3180 | Chrome extension: network switching --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3181 | 3181 | Chrome extension: network switching --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3182 | 3182 | Chrome extension: network switching --- verify success path. | NOT_STARTED | — |
| OGVPN-3183 | 3183 | Chrome extension: network switching --- verify failure path. | NOT_STARTED | — |
| OGVPN-3184 | 3184 | Chrome extension: network switching --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3185 | 3185 | Chrome extension: network switching --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3186 | 3186 | Chrome extension: network switching --- verify retry path. | NOT_STARTED | — |
| OGVPN-3187 | 3187 | Chrome extension: network switching --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3188 | 3188 | Chrome extension: network switching --- verify offline path. | NOT_STARTED | — |
| OGVPN-3189 | 3189 | Chrome extension: network switching --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / VPN connection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3190 | 3190 | Chrome extension: VPN connection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3191 | 3191 | Chrome extension: VPN connection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3192 | 3192 | Chrome extension: VPN connection --- verify success path. | NOT_STARTED | — |
| OGVPN-3193 | 3193 | Chrome extension: VPN connection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3194 | 3194 | Chrome extension: VPN connection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3195 | 3195 | Chrome extension: VPN connection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3196 | 3196 | Chrome extension: VPN connection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3197 | 3197 | Chrome extension: VPN connection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3198 | 3198 | Chrome extension: VPN connection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3199 | 3199 | Chrome extension: VPN connection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / VPN disconnection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3200 | 3200 | Chrome extension: VPN disconnection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3201 | 3201 | Chrome extension: VPN disconnection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3202 | 3202 | Chrome extension: VPN disconnection --- verify success path. | NOT_STARTED | — |
| OGVPN-3203 | 3203 | Chrome extension: VPN disconnection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3204 | 3204 | Chrome extension: VPN disconnection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3205 | 3205 | Chrome extension: VPN disconnection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3206 | 3206 | Chrome extension: VPN disconnection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3207 | 3207 | Chrome extension: VPN disconnection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3208 | 3208 | Chrome extension: VPN disconnection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3209 | 3209 | Chrome extension: VPN disconnection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / server selection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3210 | 3210 | Chrome extension: server selection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3211 | 3211 | Chrome extension: server selection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3212 | 3212 | Chrome extension: server selection --- verify success path. | NOT_STARTED | — |
| OGVPN-3213 | 3213 | Chrome extension: server selection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3214 | 3214 | Chrome extension: server selection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3215 | 3215 | Chrome extension: server selection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3216 | 3216 | Chrome extension: server selection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3217 | 3217 | Chrome extension: server selection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3218 | 3218 | Chrome extension: server selection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3219 | 3219 | Chrome extension: server selection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / device management

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3220 | 3220 | Chrome extension: device management --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3221 | 3221 | Chrome extension: device management --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3222 | 3222 | Chrome extension: device management --- verify success path. | NOT_STARTED | — |
| OGVPN-3223 | 3223 | Chrome extension: device management --- verify failure path. | NOT_STARTED | — |
| OGVPN-3224 | 3224 | Chrome extension: device management --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3225 | 3225 | Chrome extension: device management --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3226 | 3226 | Chrome extension: device management --- verify retry path. | NOT_STARTED | — |
| OGVPN-3227 | 3227 | Chrome extension: device management --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3228 | 3228 | Chrome extension: device management --- verify offline path. | NOT_STARTED | — |
| OGVPN-3229 | 3229 | Chrome extension: device management --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / settings

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3230 | 3230 | Chrome extension: settings --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3231 | 3231 | Chrome extension: settings --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3232 | 3232 | Chrome extension: settings --- verify success path. | NOT_STARTED | — |
| OGVPN-3233 | 3233 | Chrome extension: settings --- verify failure path. | NOT_STARTED | — |
| OGVPN-3234 | 3234 | Chrome extension: settings --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3235 | 3235 | Chrome extension: settings --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3236 | 3236 | Chrome extension: settings --- verify retry path. | NOT_STARTED | — |
| OGVPN-3237 | 3237 | Chrome extension: settings --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3238 | 3238 | Chrome extension: settings --- verify offline path. | NOT_STARTED | — |
| OGVPN-3239 | 3239 | Chrome extension: settings --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / notifications

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3240 | 3240 | Chrome extension: notifications --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3241 | 3241 | Chrome extension: notifications --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3242 | 3242 | Chrome extension: notifications --- verify success path. | NOT_STARTED | — |
| OGVPN-3243 | 3243 | Chrome extension: notifications --- verify failure path. | NOT_STARTED | — |
| OGVPN-3244 | 3244 | Chrome extension: notifications --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3245 | 3245 | Chrome extension: notifications --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3246 | 3246 | Chrome extension: notifications --- verify retry path. | NOT_STARTED | — |
| OGVPN-3247 | 3247 | Chrome extension: notifications --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3248 | 3248 | Chrome extension: notifications --- verify offline path. | NOT_STARTED | — |
| OGVPN-3249 | 3249 | Chrome extension: notifications --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / billing

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3250 | 3250 | Chrome extension: billing --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3251 | 3251 | Chrome extension: billing --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3252 | 3252 | Chrome extension: billing --- verify success path. | NOT_STARTED | — |
| OGVPN-3253 | 3253 | Chrome extension: billing --- verify failure path. | NOT_STARTED | — |
| OGVPN-3254 | 3254 | Chrome extension: billing --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3255 | 3255 | Chrome extension: billing --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3256 | 3256 | Chrome extension: billing --- verify retry path. | NOT_STARTED | — |
| OGVPN-3257 | 3257 | Chrome extension: billing --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3258 | 3258 | Chrome extension: billing --- verify offline path. | NOT_STARTED | — |
| OGVPN-3259 | 3259 | Chrome extension: billing --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / support

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3260 | 3260 | Chrome extension: support --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3261 | 3261 | Chrome extension: support --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3262 | 3262 | Chrome extension: support --- verify success path. | NOT_STARTED | — |
| OGVPN-3263 | 3263 | Chrome extension: support --- verify failure path. | NOT_STARTED | — |
| OGVPN-3264 | 3264 | Chrome extension: support --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3265 | 3265 | Chrome extension: support --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3266 | 3266 | Chrome extension: support --- verify retry path. | NOT_STARTED | — |
| OGVPN-3267 | 3267 | Chrome extension: support --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3268 | 3268 | Chrome extension: support --- verify offline path. | NOT_STARTED | — |
| OGVPN-3269 | 3269 | Chrome extension: support --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / accessibility

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3270 | 3270 | Chrome extension: accessibility --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3271 | 3271 | Chrome extension: accessibility --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3272 | 3272 | Chrome extension: accessibility --- verify success path. | NOT_STARTED | — |
| OGVPN-3273 | 3273 | Chrome extension: accessibility --- verify failure path. | NOT_STARTED | — |
| OGVPN-3274 | 3274 | Chrome extension: accessibility --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3275 | 3275 | Chrome extension: accessibility --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3276 | 3276 | Chrome extension: accessibility --- verify retry path. | NOT_STARTED | — |
| OGVPN-3277 | 3277 | Chrome extension: accessibility --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3278 | 3278 | Chrome extension: accessibility --- verify offline path. | NOT_STARTED | — |
| OGVPN-3279 | 3279 | Chrome extension: accessibility --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / responsive behavior

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3280 | 3280 | Chrome extension: responsive behavior --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3281 | 3281 | Chrome extension: responsive behavior --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3282 | 3282 | Chrome extension: responsive behavior --- verify success path. | NOT_STARTED | — |
| OGVPN-3283 | 3283 | Chrome extension: responsive behavior --- verify failure path. | NOT_STARTED | — |
| OGVPN-3284 | 3284 | Chrome extension: responsive behavior --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3285 | 3285 | Chrome extension: responsive behavior --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3286 | 3286 | Chrome extension: responsive behavior --- verify retry path. | NOT_STARTED | — |
| OGVPN-3287 | 3287 | Chrome extension: responsive behavior --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3288 | 3288 | Chrome extension: responsive behavior --- verify offline path. | NOT_STARTED | — |
| OGVPN-3289 | 3289 | Chrome extension: responsive behavior --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / keyboard/input

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3290 | 3290 | Chrome extension: keyboard/input --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3291 | 3291 | Chrome extension: keyboard/input --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3292 | 3292 | Chrome extension: keyboard/input --- verify success path. | NOT_STARTED | — |
| OGVPN-3293 | 3293 | Chrome extension: keyboard/input --- verify failure path. | NOT_STARTED | — |
| OGVPN-3294 | 3294 | Chrome extension: keyboard/input --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3295 | 3295 | Chrome extension: keyboard/input --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3296 | 3296 | Chrome extension: keyboard/input --- verify retry path. | NOT_STARTED | — |
| OGVPN-3297 | 3297 | Chrome extension: keyboard/input --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3298 | 3298 | Chrome extension: keyboard/input --- verify offline path. | NOT_STARTED | — |
| OGVPN-3299 | 3299 | Chrome extension: keyboard/input --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / permissions

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3300 | 3300 | Chrome extension: permissions --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3301 | 3301 | Chrome extension: permissions --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3302 | 3302 | Chrome extension: permissions --- verify success path. | NOT_STARTED | — |
| OGVPN-3303 | 3303 | Chrome extension: permissions --- verify failure path. | NOT_STARTED | — |
| OGVPN-3304 | 3304 | Chrome extension: permissions --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3305 | 3305 | Chrome extension: permissions --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3306 | 3306 | Chrome extension: permissions --- verify retry path. | NOT_STARTED | — |
| OGVPN-3307 | 3307 | Chrome extension: permissions --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3308 | 3308 | Chrome extension: permissions --- verify offline path. | NOT_STARTED | — |
| OGVPN-3309 | 3309 | Chrome extension: permissions --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / deep links

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3310 | 3310 | Chrome extension: deep links --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3311 | 3311 | Chrome extension: deep links --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3312 | 3312 | Chrome extension: deep links --- verify success path. | NOT_STARTED | — |
| OGVPN-3313 | 3313 | Chrome extension: deep links --- verify failure path. | NOT_STARTED | — |
| OGVPN-3314 | 3314 | Chrome extension: deep links --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3315 | 3315 | Chrome extension: deep links --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3316 | 3316 | Chrome extension: deep links --- verify retry path. | NOT_STARTED | — |
| OGVPN-3317 | 3317 | Chrome extension: deep links --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3318 | 3318 | Chrome extension: deep links --- verify offline path. | NOT_STARTED | — |
| OGVPN-3319 | 3319 | Chrome extension: deep links --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / logging

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3320 | 3320 | Chrome extension: logging --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3321 | 3321 | Chrome extension: logging --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3322 | 3322 | Chrome extension: logging --- verify success path. | NOT_STARTED | — |
| OGVPN-3323 | 3323 | Chrome extension: logging --- verify failure path. | NOT_STARTED | — |
| OGVPN-3324 | 3324 | Chrome extension: logging --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3325 | 3325 | Chrome extension: logging --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3326 | 3326 | Chrome extension: logging --- verify retry path. | NOT_STARTED | — |
| OGVPN-3327 | 3327 | Chrome extension: logging --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3328 | 3328 | Chrome extension: logging --- verify offline path. | NOT_STARTED | — |
| OGVPN-3329 | 3329 | Chrome extension: logging --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / analytics

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3330 | 3330 | Chrome extension: analytics --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3331 | 3331 | Chrome extension: analytics --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3332 | 3332 | Chrome extension: analytics --- verify success path. | NOT_STARTED | — |
| OGVPN-3333 | 3333 | Chrome extension: analytics --- verify failure path. | NOT_STARTED | — |
| OGVPN-3334 | 3334 | Chrome extension: analytics --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3335 | 3335 | Chrome extension: analytics --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3336 | 3336 | Chrome extension: analytics --- verify retry path. | NOT_STARTED | — |
| OGVPN-3337 | 3337 | Chrome extension: analytics --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3338 | 3338 | Chrome extension: analytics --- verify offline path. | NOT_STARTED | — |
| OGVPN-3339 | 3339 | Chrome extension: analytics --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3340 | 3340 | Chrome extension: security --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3341 | 3341 | Chrome extension: security --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3342 | 3342 | Chrome extension: security --- verify success path. | NOT_STARTED | — |
| OGVPN-3343 | 3343 | Chrome extension: security --- verify failure path. | NOT_STARTED | — |
| OGVPN-3344 | 3344 | Chrome extension: security --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3345 | 3345 | Chrome extension: security --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3346 | 3346 | Chrome extension: security --- verify retry path. | NOT_STARTED | — |
| OGVPN-3347 | 3347 | Chrome extension: security --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3348 | 3348 | Chrome extension: security --- verify offline path. | NOT_STARTED | — |
| OGVPN-3349 | 3349 | Chrome extension: security --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / performance

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3350 | 3350 | Chrome extension: performance --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3351 | 3351 | Chrome extension: performance --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3352 | 3352 | Chrome extension: performance --- verify success path. | NOT_STARTED | — |
| OGVPN-3353 | 3353 | Chrome extension: performance --- verify failure path. | NOT_STARTED | — |
| OGVPN-3354 | 3354 | Chrome extension: performance --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3355 | 3355 | Chrome extension: performance --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3356 | 3356 | Chrome extension: performance --- verify retry path. | NOT_STARTED | — |
| OGVPN-3357 | 3357 | Chrome extension: performance --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3358 | 3358 | Chrome extension: performance --- verify offline path. | NOT_STARTED | — |
| OGVPN-3359 | 3359 | Chrome extension: performance --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / state synchronization

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3360 | 3360 | Chrome extension: state synchronization --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3361 | 3361 | Chrome extension: state synchronization --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3362 | 3362 | Chrome extension: state synchronization --- verify success path. | NOT_STARTED | — |
| OGVPN-3363 | 3363 | Chrome extension: state synchronization --- verify failure path. | NOT_STARTED | — |
| OGVPN-3364 | 3364 | Chrome extension: state synchronization --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3365 | 3365 | Chrome extension: state synchronization --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3366 | 3366 | Chrome extension: state synchronization --- verify retry path. | NOT_STARTED | — |
| OGVPN-3367 | 3367 | Chrome extension: state synchronization --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3368 | 3368 | Chrome extension: state synchronization --- verify offline path. | NOT_STARTED | — |
| OGVPN-3369 | 3369 | Chrome extension: state synchronization --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / update/restart recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3370 | 3370 | Chrome extension: update/restart recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3371 | 3371 | Chrome extension: update/restart recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3372 | 3372 | Chrome extension: update/restart recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-3373 | 3373 | Chrome extension: update/restart recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-3374 | 3374 | Chrome extension: update/restart recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3375 | 3375 | Chrome extension: update/restart recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3376 | 3376 | Chrome extension: update/restart recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-3377 | 3377 | Chrome extension: update/restart recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3378 | 3378 | Chrome extension: update/restart recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-3379 | 3379 | Chrome extension: update/restart recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / duplicate-action protection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3380 | 3380 | Chrome extension: duplicate-action protection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3381 | 3381 | Chrome extension: duplicate-action protection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3382 | 3382 | Chrome extension: duplicate-action protection --- verify success path. | NOT_STARTED | — |
| OGVPN-3383 | 3383 | Chrome extension: duplicate-action protection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3384 | 3384 | Chrome extension: duplicate-action protection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3385 | 3385 | Chrome extension: duplicate-action protection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3386 | 3386 | Chrome extension: duplicate-action protection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3387 | 3387 | Chrome extension: duplicate-action protection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3388 | 3388 | Chrome extension: duplicate-action protection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3389 | 3389 | Chrome extension: duplicate-action protection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Chrome extension / API contract handling

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3390 | 3390 | Chrome extension: API contract handling --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3391 | 3391 | Chrome extension: API contract handling --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3392 | 3392 | Chrome extension: API contract handling --- verify success path. | NOT_STARTED | — |
| OGVPN-3393 | 3393 | Chrome extension: API contract handling --- verify failure path. | NOT_STARTED | — |
| OGVPN-3394 | 3394 | Chrome extension: API contract handling --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3395 | 3395 | Chrome extension: API contract handling --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3396 | 3396 | Chrome extension: API contract handling --- verify retry path. | NOT_STARTED | — |
| OGVPN-3397 | 3397 | Chrome extension: API contract handling --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3398 | 3398 | Chrome extension: API contract handling --- verify offline path. | NOT_STARTED | — |
| OGVPN-3399 | 3399 | Chrome extension: API contract handling --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / authentication

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3400 | 3400 | Backend/API: authentication --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3401 | 3401 | Backend/API: authentication --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3402 | 3402 | Backend/API: authentication --- verify success path. | NOT_STARTED | — |
| OGVPN-3403 | 3403 | Backend/API: authentication --- verify failure path. | NOT_STARTED | — |
| OGVPN-3404 | 3404 | Backend/API: authentication --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3405 | 3405 | Backend/API: authentication --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3406 | 3406 | Backend/API: authentication --- verify retry path. | NOT_STARTED | — |
| OGVPN-3407 | 3407 | Backend/API: authentication --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3408 | 3408 | Backend/API: authentication --- verify offline path. | NOT_STARTED | — |
| OGVPN-3409 | 3409 | Backend/API: authentication --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / session persistence

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3410 | 3410 | Backend/API: session persistence --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3411 | 3411 | Backend/API: session persistence --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3412 | 3412 | Backend/API: session persistence --- verify success path. | NOT_STARTED | — |
| OGVPN-3413 | 3413 | Backend/API: session persistence --- verify failure path. | NOT_STARTED | — |
| OGVPN-3414 | 3414 | Backend/API: session persistence --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3415 | 3415 | Backend/API: session persistence --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3416 | 3416 | Backend/API: session persistence --- verify retry path. | NOT_STARTED | — |
| OGVPN-3417 | 3417 | Backend/API: session persistence --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3418 | 3418 | Backend/API: session persistence --- verify offline path. | NOT_STARTED | — |
| OGVPN-3419 | 3419 | Backend/API: session persistence --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / navigation

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3420 | 3420 | Backend/API: navigation --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3421 | 3421 | Backend/API: navigation --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3422 | 3422 | Backend/API: navigation --- verify success path. | NOT_STARTED | — |
| OGVPN-3423 | 3423 | Backend/API: navigation --- verify failure path. | NOT_STARTED | — |
| OGVPN-3424 | 3424 | Backend/API: navigation --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3425 | 3425 | Backend/API: navigation --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3426 | 3426 | Backend/API: navigation --- verify retry path. | NOT_STARTED | — |
| OGVPN-3427 | 3427 | Backend/API: navigation --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3428 | 3428 | Backend/API: navigation --- verify offline path. | NOT_STARTED | — |
| OGVPN-3429 | 3429 | Backend/API: navigation --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / forms

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3430 | 3430 | Backend/API: forms --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3431 | 3431 | Backend/API: forms --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3432 | 3432 | Backend/API: forms --- verify success path. | NOT_STARTED | — |
| OGVPN-3433 | 3433 | Backend/API: forms --- verify failure path. | NOT_STARTED | — |
| OGVPN-3434 | 3434 | Backend/API: forms --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3435 | 3435 | Backend/API: forms --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3436 | 3436 | Backend/API: forms --- verify retry path. | NOT_STARTED | — |
| OGVPN-3437 | 3437 | Backend/API: forms --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3438 | 3438 | Backend/API: forms --- verify offline path. | NOT_STARTED | — |
| OGVPN-3439 | 3439 | Backend/API: forms --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / loading states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3440 | 3440 | Backend/API: loading states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3441 | 3441 | Backend/API: loading states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3442 | 3442 | Backend/API: loading states --- verify success path. | NOT_STARTED | — |
| OGVPN-3443 | 3443 | Backend/API: loading states --- verify failure path. | NOT_STARTED | — |
| OGVPN-3444 | 3444 | Backend/API: loading states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3445 | 3445 | Backend/API: loading states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3446 | 3446 | Backend/API: loading states --- verify retry path. | NOT_STARTED | — |
| OGVPN-3447 | 3447 | Backend/API: loading states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3448 | 3448 | Backend/API: loading states --- verify offline path. | NOT_STARTED | — |
| OGVPN-3449 | 3449 | Backend/API: loading states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / error states

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3450 | 3450 | Backend/API: error states --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3451 | 3451 | Backend/API: error states --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3452 | 3452 | Backend/API: error states --- verify success path. | NOT_STARTED | — |
| OGVPN-3453 | 3453 | Backend/API: error states --- verify failure path. | NOT_STARTED | — |
| OGVPN-3454 | 3454 | Backend/API: error states --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3455 | 3455 | Backend/API: error states --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3456 | 3456 | Backend/API: error states --- verify retry path. | NOT_STARTED | — |
| OGVPN-3457 | 3457 | Backend/API: error states --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3458 | 3458 | Backend/API: error states --- verify offline path. | NOT_STARTED | — |
| OGVPN-3459 | 3459 | Backend/API: error states --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / offline recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3460 | 3460 | Backend/API: offline recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3461 | 3461 | Backend/API: offline recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3462 | 3462 | Backend/API: offline recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-3463 | 3463 | Backend/API: offline recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-3464 | 3464 | Backend/API: offline recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3465 | 3465 | Backend/API: offline recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3466 | 3466 | Backend/API: offline recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-3467 | 3467 | Backend/API: offline recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3468 | 3468 | Backend/API: offline recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-3469 | 3469 | Backend/API: offline recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / network switching

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3470 | 3470 | Backend/API: network switching --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3471 | 3471 | Backend/API: network switching --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3472 | 3472 | Backend/API: network switching --- verify success path. | NOT_STARTED | — |
| OGVPN-3473 | 3473 | Backend/API: network switching --- verify failure path. | NOT_STARTED | — |
| OGVPN-3474 | 3474 | Backend/API: network switching --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3475 | 3475 | Backend/API: network switching --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3476 | 3476 | Backend/API: network switching --- verify retry path. | NOT_STARTED | — |
| OGVPN-3477 | 3477 | Backend/API: network switching --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3478 | 3478 | Backend/API: network switching --- verify offline path. | NOT_STARTED | — |
| OGVPN-3479 | 3479 | Backend/API: network switching --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / VPN connection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3480 | 3480 | Backend/API: VPN connection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3481 | 3481 | Backend/API: VPN connection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3482 | 3482 | Backend/API: VPN connection --- verify success path. | NOT_STARTED | — |
| OGVPN-3483 | 3483 | Backend/API: VPN connection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3484 | 3484 | Backend/API: VPN connection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3485 | 3485 | Backend/API: VPN connection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3486 | 3486 | Backend/API: VPN connection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3487 | 3487 | Backend/API: VPN connection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3488 | 3488 | Backend/API: VPN connection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3489 | 3489 | Backend/API: VPN connection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / VPN disconnection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3490 | 3490 | Backend/API: VPN disconnection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3491 | 3491 | Backend/API: VPN disconnection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3492 | 3492 | Backend/API: VPN disconnection --- verify success path. | NOT_STARTED | — |
| OGVPN-3493 | 3493 | Backend/API: VPN disconnection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3494 | 3494 | Backend/API: VPN disconnection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3495 | 3495 | Backend/API: VPN disconnection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3496 | 3496 | Backend/API: VPN disconnection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3497 | 3497 | Backend/API: VPN disconnection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3498 | 3498 | Backend/API: VPN disconnection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3499 | 3499 | Backend/API: VPN disconnection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / server selection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3500 | 3500 | Backend/API: server selection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3501 | 3501 | Backend/API: server selection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3502 | 3502 | Backend/API: server selection --- verify success path. | NOT_STARTED | — |
| OGVPN-3503 | 3503 | Backend/API: server selection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3504 | 3504 | Backend/API: server selection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3505 | 3505 | Backend/API: server selection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3506 | 3506 | Backend/API: server selection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3507 | 3507 | Backend/API: server selection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3508 | 3508 | Backend/API: server selection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3509 | 3509 | Backend/API: server selection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / device management

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3510 | 3510 | Backend/API: device management --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3511 | 3511 | Backend/API: device management --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3512 | 3512 | Backend/API: device management --- verify success path. | NOT_STARTED | — |
| OGVPN-3513 | 3513 | Backend/API: device management --- verify failure path. | NOT_STARTED | — |
| OGVPN-3514 | 3514 | Backend/API: device management --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3515 | 3515 | Backend/API: device management --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3516 | 3516 | Backend/API: device management --- verify retry path. | NOT_STARTED | — |
| OGVPN-3517 | 3517 | Backend/API: device management --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3518 | 3518 | Backend/API: device management --- verify offline path. | NOT_STARTED | — |
| OGVPN-3519 | 3519 | Backend/API: device management --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / settings

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3520 | 3520 | Backend/API: settings --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3521 | 3521 | Backend/API: settings --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3522 | 3522 | Backend/API: settings --- verify success path. | NOT_STARTED | — |
| OGVPN-3523 | 3523 | Backend/API: settings --- verify failure path. | NOT_STARTED | — |
| OGVPN-3524 | 3524 | Backend/API: settings --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3525 | 3525 | Backend/API: settings --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3526 | 3526 | Backend/API: settings --- verify retry path. | NOT_STARTED | — |
| OGVPN-3527 | 3527 | Backend/API: settings --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3528 | 3528 | Backend/API: settings --- verify offline path. | NOT_STARTED | — |
| OGVPN-3529 | 3529 | Backend/API: settings --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / notifications

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3530 | 3530 | Backend/API: notifications --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3531 | 3531 | Backend/API: notifications --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3532 | 3532 | Backend/API: notifications --- verify success path. | NOT_STARTED | — |
| OGVPN-3533 | 3533 | Backend/API: notifications --- verify failure path. | NOT_STARTED | — |
| OGVPN-3534 | 3534 | Backend/API: notifications --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3535 | 3535 | Backend/API: notifications --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3536 | 3536 | Backend/API: notifications --- verify retry path. | NOT_STARTED | — |
| OGVPN-3537 | 3537 | Backend/API: notifications --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3538 | 3538 | Backend/API: notifications --- verify offline path. | NOT_STARTED | — |
| OGVPN-3539 | 3539 | Backend/API: notifications --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / billing

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3540 | 3540 | Backend/API: billing --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3541 | 3541 | Backend/API: billing --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3542 | 3542 | Backend/API: billing --- verify success path. | NOT_STARTED | — |
| OGVPN-3543 | 3543 | Backend/API: billing --- verify failure path. | NOT_STARTED | — |
| OGVPN-3544 | 3544 | Backend/API: billing --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3545 | 3545 | Backend/API: billing --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3546 | 3546 | Backend/API: billing --- verify retry path. | NOT_STARTED | — |
| OGVPN-3547 | 3547 | Backend/API: billing --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3548 | 3548 | Backend/API: billing --- verify offline path. | NOT_STARTED | — |
| OGVPN-3549 | 3549 | Backend/API: billing --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / support

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3550 | 3550 | Backend/API: support --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3551 | 3551 | Backend/API: support --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3552 | 3552 | Backend/API: support --- verify success path. | NOT_STARTED | — |
| OGVPN-3553 | 3553 | Backend/API: support --- verify failure path. | NOT_STARTED | — |
| OGVPN-3554 | 3554 | Backend/API: support --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3555 | 3555 | Backend/API: support --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3556 | 3556 | Backend/API: support --- verify retry path. | NOT_STARTED | — |
| OGVPN-3557 | 3557 | Backend/API: support --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3558 | 3558 | Backend/API: support --- verify offline path. | NOT_STARTED | — |
| OGVPN-3559 | 3559 | Backend/API: support --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / accessibility

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3560 | 3560 | Backend/API: accessibility --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3561 | 3561 | Backend/API: accessibility --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3562 | 3562 | Backend/API: accessibility --- verify success path. | NOT_STARTED | — |
| OGVPN-3563 | 3563 | Backend/API: accessibility --- verify failure path. | NOT_STARTED | — |
| OGVPN-3564 | 3564 | Backend/API: accessibility --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3565 | 3565 | Backend/API: accessibility --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3566 | 3566 | Backend/API: accessibility --- verify retry path. | NOT_STARTED | — |
| OGVPN-3567 | 3567 | Backend/API: accessibility --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3568 | 3568 | Backend/API: accessibility --- verify offline path. | NOT_STARTED | — |
| OGVPN-3569 | 3569 | Backend/API: accessibility --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / responsive behavior

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3570 | 3570 | Backend/API: responsive behavior --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3571 | 3571 | Backend/API: responsive behavior --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3572 | 3572 | Backend/API: responsive behavior --- verify success path. | NOT_STARTED | — |
| OGVPN-3573 | 3573 | Backend/API: responsive behavior --- verify failure path. | NOT_STARTED | — |
| OGVPN-3574 | 3574 | Backend/API: responsive behavior --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3575 | 3575 | Backend/API: responsive behavior --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3576 | 3576 | Backend/API: responsive behavior --- verify retry path. | NOT_STARTED | — |
| OGVPN-3577 | 3577 | Backend/API: responsive behavior --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3578 | 3578 | Backend/API: responsive behavior --- verify offline path. | NOT_STARTED | — |
| OGVPN-3579 | 3579 | Backend/API: responsive behavior --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / keyboard/input

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3580 | 3580 | Backend/API: keyboard/input --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3581 | 3581 | Backend/API: keyboard/input --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3582 | 3582 | Backend/API: keyboard/input --- verify success path. | NOT_STARTED | — |
| OGVPN-3583 | 3583 | Backend/API: keyboard/input --- verify failure path. | NOT_STARTED | — |
| OGVPN-3584 | 3584 | Backend/API: keyboard/input --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3585 | 3585 | Backend/API: keyboard/input --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3586 | 3586 | Backend/API: keyboard/input --- verify retry path. | NOT_STARTED | — |
| OGVPN-3587 | 3587 | Backend/API: keyboard/input --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3588 | 3588 | Backend/API: keyboard/input --- verify offline path. | NOT_STARTED | — |
| OGVPN-3589 | 3589 | Backend/API: keyboard/input --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / permissions

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3590 | 3590 | Backend/API: permissions --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3591 | 3591 | Backend/API: permissions --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3592 | 3592 | Backend/API: permissions --- verify success path. | NOT_STARTED | — |
| OGVPN-3593 | 3593 | Backend/API: permissions --- verify failure path. | NOT_STARTED | — |
| OGVPN-3594 | 3594 | Backend/API: permissions --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3595 | 3595 | Backend/API: permissions --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3596 | 3596 | Backend/API: permissions --- verify retry path. | NOT_STARTED | — |
| OGVPN-3597 | 3597 | Backend/API: permissions --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3598 | 3598 | Backend/API: permissions --- verify offline path. | NOT_STARTED | — |
| OGVPN-3599 | 3599 | Backend/API: permissions --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / deep links

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3600 | 3600 | Backend/API: deep links --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3601 | 3601 | Backend/API: deep links --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3602 | 3602 | Backend/API: deep links --- verify success path. | NOT_STARTED | — |
| OGVPN-3603 | 3603 | Backend/API: deep links --- verify failure path. | NOT_STARTED | — |
| OGVPN-3604 | 3604 | Backend/API: deep links --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3605 | 3605 | Backend/API: deep links --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3606 | 3606 | Backend/API: deep links --- verify retry path. | NOT_STARTED | — |
| OGVPN-3607 | 3607 | Backend/API: deep links --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3608 | 3608 | Backend/API: deep links --- verify offline path. | NOT_STARTED | — |
| OGVPN-3609 | 3609 | Backend/API: deep links --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / logging

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3610 | 3610 | Backend/API: logging --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3611 | 3611 | Backend/API: logging --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3612 | 3612 | Backend/API: logging --- verify success path. | NOT_STARTED | — |
| OGVPN-3613 | 3613 | Backend/API: logging --- verify failure path. | NOT_STARTED | — |
| OGVPN-3614 | 3614 | Backend/API: logging --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3615 | 3615 | Backend/API: logging --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3616 | 3616 | Backend/API: logging --- verify retry path. | NOT_STARTED | — |
| OGVPN-3617 | 3617 | Backend/API: logging --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3618 | 3618 | Backend/API: logging --- verify offline path. | NOT_STARTED | — |
| OGVPN-3619 | 3619 | Backend/API: logging --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / analytics

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3620 | 3620 | Backend/API: analytics --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3621 | 3621 | Backend/API: analytics --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3622 | 3622 | Backend/API: analytics --- verify success path. | NOT_STARTED | — |
| OGVPN-3623 | 3623 | Backend/API: analytics --- verify failure path. | NOT_STARTED | — |
| OGVPN-3624 | 3624 | Backend/API: analytics --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3625 | 3625 | Backend/API: analytics --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3626 | 3626 | Backend/API: analytics --- verify retry path. | NOT_STARTED | — |
| OGVPN-3627 | 3627 | Backend/API: analytics --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3628 | 3628 | Backend/API: analytics --- verify offline path. | NOT_STARTED | — |
| OGVPN-3629 | 3629 | Backend/API: analytics --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / security

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3630 | 3630 | Backend/API: security --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3631 | 3631 | Backend/API: security --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3632 | 3632 | Backend/API: security --- verify success path. | NOT_STARTED | — |
| OGVPN-3633 | 3633 | Backend/API: security --- verify failure path. | NOT_STARTED | — |
| OGVPN-3634 | 3634 | Backend/API: security --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3635 | 3635 | Backend/API: security --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3636 | 3636 | Backend/API: security --- verify retry path. | NOT_STARTED | — |
| OGVPN-3637 | 3637 | Backend/API: security --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3638 | 3638 | Backend/API: security --- verify offline path. | NOT_STARTED | — |
| OGVPN-3639 | 3639 | Backend/API: security --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / performance

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3640 | 3640 | Backend/API: performance --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3641 | 3641 | Backend/API: performance --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3642 | 3642 | Backend/API: performance --- verify success path. | NOT_STARTED | — |
| OGVPN-3643 | 3643 | Backend/API: performance --- verify failure path. | NOT_STARTED | — |
| OGVPN-3644 | 3644 | Backend/API: performance --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3645 | 3645 | Backend/API: performance --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3646 | 3646 | Backend/API: performance --- verify retry path. | NOT_STARTED | — |
| OGVPN-3647 | 3647 | Backend/API: performance --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3648 | 3648 | Backend/API: performance --- verify offline path. | NOT_STARTED | — |
| OGVPN-3649 | 3649 | Backend/API: performance --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / state synchronization

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3650 | 3650 | Backend/API: state synchronization --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3651 | 3651 | Backend/API: state synchronization --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3652 | 3652 | Backend/API: state synchronization --- verify success path. | NOT_STARTED | — |
| OGVPN-3653 | 3653 | Backend/API: state synchronization --- verify failure path. | NOT_STARTED | — |
| OGVPN-3654 | 3654 | Backend/API: state synchronization --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3655 | 3655 | Backend/API: state synchronization --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3656 | 3656 | Backend/API: state synchronization --- verify retry path. | NOT_STARTED | — |
| OGVPN-3657 | 3657 | Backend/API: state synchronization --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3658 | 3658 | Backend/API: state synchronization --- verify offline path. | NOT_STARTED | — |
| OGVPN-3659 | 3659 | Backend/API: state synchronization --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / update/restart recovery

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3660 | 3660 | Backend/API: update/restart recovery --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3661 | 3661 | Backend/API: update/restart recovery --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3662 | 3662 | Backend/API: update/restart recovery --- verify success path. | NOT_STARTED | — |
| OGVPN-3663 | 3663 | Backend/API: update/restart recovery --- verify failure path. | NOT_STARTED | — |
| OGVPN-3664 | 3664 | Backend/API: update/restart recovery --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3665 | 3665 | Backend/API: update/restart recovery --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3666 | 3666 | Backend/API: update/restart recovery --- verify retry path. | NOT_STARTED | — |
| OGVPN-3667 | 3667 | Backend/API: update/restart recovery --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3668 | 3668 | Backend/API: update/restart recovery --- verify offline path. | NOT_STARTED | — |
| OGVPN-3669 | 3669 | Backend/API: update/restart recovery --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / duplicate-action protection

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3670 | 3670 | Backend/API: duplicate-action protection --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3671 | 3671 | Backend/API: duplicate-action protection --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3672 | 3672 | Backend/API: duplicate-action protection --- verify success path. | NOT_STARTED | — |
| OGVPN-3673 | 3673 | Backend/API: duplicate-action protection --- verify failure path. | NOT_STARTED | — |
| OGVPN-3674 | 3674 | Backend/API: duplicate-action protection --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3675 | 3675 | Backend/API: duplicate-action protection --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3676 | 3676 | Backend/API: duplicate-action protection --- verify retry path. | NOT_STARTED | — |
| OGVPN-3677 | 3677 | Backend/API: duplicate-action protection --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3678 | 3678 | Backend/API: duplicate-action protection --- verify offline path. | NOT_STARTED | — |
| OGVPN-3679 | 3679 | Backend/API: duplicate-action protection --- verify recovery after interruption. | NOT_STARTED | — |
### 101. Matrix: Backend/API / API contract handling

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3680 | 3680 | Backend/API: API contract handling --- verify first-run behavior. | NOT_STARTED | — |
| OGVPN-3681 | 3681 | Backend/API: API contract handling --- verify returning-user behavior. | NOT_STARTED | — |
| OGVPN-3682 | 3682 | Backend/API: API contract handling --- verify success path. | NOT_STARTED | — |
| OGVPN-3683 | 3683 | Backend/API: API contract handling --- verify failure path. | NOT_STARTED | — |
| OGVPN-3684 | 3684 | Backend/API: API contract handling --- verify timeout path. | NOT_STARTED | — |
| OGVPN-3685 | 3685 | Backend/API: API contract handling --- verify cancellation path. | NOT_STARTED | — |
| OGVPN-3686 | 3686 | Backend/API: API contract handling --- verify retry path. | NOT_STARTED | — |
| OGVPN-3687 | 3687 | Backend/API: API contract handling --- verify stale-state path. | NOT_STARTED | — |
| OGVPN-3688 | 3688 | Backend/API: API contract handling --- verify offline path. | NOT_STARTED | — |
| OGVPN-3689 | 3689 | Backend/API: API contract handling --- verify recovery after interruption. | NOT_STARTED | — |
### 102. CI/CD + GitHub Verification

| ID | # | Item | Status | Evidence |
|---|---|---|---|---|
| OGVPN-3690 | 3690 | Repository checkout works. | NOT_STARTED | — |
| OGVPN-3691 | 3691 | Clean checkout works. | NOT_STARTED | — |
| OGVPN-3692 | 3692 | Public repository clone works. | NOT_STARTED | — |
| OGVPN-3693 | 3693 | Agent can pull. | NOT_STARTED | — |
| OGVPN-3694 | 3694 | Agent can commit. | NOT_STARTED | — |
| OGVPN-3695 | 3695 | Agent can push. | NOT_STARTED | — |
| OGVPN-3696 | 3696 | Branch protection is respected. | NOT_STARTED | — |
| OGVPN-3697 | 3697 | Pull requests work. | NOT_STARTED | — |
| OGVPN-3698 | 3698 | GitHub Actions workflow starts. | NOT_STARTED | — |
| OGVPN-3699 | 3699 | Workflow permissions are correct. | NOT_STARTED | — |
| OGVPN-3700 | 3700 | Secrets are never printed. | NOT_STARTED | — |
| OGVPN-3701 | 3701 | Tokens never appear in logs. | NOT_STARTED | — |
| OGVPN-3702 | 3702 | Dependency installation succeeds. | NOT_STARTED | — |
| OGVPN-3703 | 3703 | Backend builds. | NOT_STARTED | — |
| OGVPN-3704 | 3704 | Web builds. | NOT_STARTED | — |
| OGVPN-3705 | 3705 | Chrome extension builds. | NOT_STARTED | — |
| OGVPN-3706 | 3706 | Android builds. | NOT_STARTED | — |
| OGVPN-3707 | 3707 | Android release APK builds. | NOT_STARTED | — |
| OGVPN-3708 | 3708 | Android AAB builds. | NOT_STARTED | — |
| OGVPN-3709 | 3709 | Desktop Windows build works. | NOT_STARTED | — |
| OGVPN-3710 | 3710 | Desktop macOS build works. | NOT_STARTED | — |
| OGVPN-3711 | 3711 | Desktop Linux build works. | NOT_STARTED | — |
| OGVPN-3712 | 3712 | Unit tests run. | NOT_STARTED | — |
| OGVPN-3713 | 3713 | Integration tests run. | NOT_STARTED | — |
| OGVPN-3714 | 3714 | E2E tests run. | NOT_STARTED | — |
| OGVPN-3715 | 3715 | VPN server tests run. | NOT_STARTED | — |
| OGVPN-3716 | 3716 | Artifacts are uploaded. | NOT_STARTED | — |
| OGVPN-3717 | 3717 | Artifacts can be downloaded. | NOT_STARTED | — |
| OGVPN-3718 | 3718 | Failed builds fail the workflow. | NOT_STARTED | — |
| OGVPN-3719 | 3719 | Test failures fail the workflow. | NOT_STARTED | — |
| OGVPN-3720 | 3720 | Build logs are retained. | NOT_STARTED | — |
| OGVPN-3721 | 3721 | Version numbers are correct. | NOT_STARTED | — |
| OGVPN-3722 | 3722 | Release artifacts are correctly named. | NOT_STARTED | — |
| OGVPN-3723 | 3723 | Clean-machine installation works. | NOT_STARTED | — |
| OGVPN-3724 | 3724 | Rebuild from a fresh checkout works. | NOT_STARTED | — |
| OGVPN-3725 | 3725 | No developer-machine-only dependencies exist. | NOT_STARTED | — |
| OGVPN-3726 | 3726 | No hardcoded local paths exist. | NOT_STARTED | — |
| OGVPN-3727 | 3727 | No credentials are committed. | NOT_STARTED | — |
| OGVPN-3728 | 3728 | No .env secrets are committed. | NOT_STARTED | — |
| OGVPN-3729 | 3729 | Dependency lockfiles are committed. | NOT_STARTED | — |
| OGVPN-3730 | 3730 | CI uses pinned/controlled dependency versions. | NOT_STARTED | — |
| OGVPN-3731 | 3731 | CI performs security scanning. | NOT_STARTED | — |
| OGVPN-3732 | 3732 | CI performs dependency vulnerability checks. | NOT_STARTED | — |
| OGVPN-3733 | 3733 | CI performs secret scanning. | NOT_STARTED | — |
| OGVPN-3734 | 3734 | CI performs static analysis. | NOT_STARTED | — |
| OGVPN-3735 | 3735 | CI performs type checking. | NOT_STARTED | — |
| OGVPN-3736 | 3736 | CI performs formatting/lint checks. | NOT_STARTED | — |
| OGVPN-3737 | 3737 | CI performs database migration tests. | NOT_STARTED | — |
| OGVPN-3738 | 3738 | CI performs backend API tests. | NOT_STARTED | — |
| OGVPN-3739 | 3739 | CI performs cross-platform build matrix. | NOT_STARTED | — |
| OGVPN-3740 | 3740 | CI tests clean installation. | NOT_STARTED | — |
| OGVPN-3741 | 3741 | CI tests upgrade installation. | NOT_STARTED | — |
| OGVPN-3742 | 3742 | CI tests uninstall. | NOT_STARTED | — |
| OGVPN-3743 | 3743 | CI tests rollback. | NOT_STARTED | — |
| OGVPN-3744 | 3744 | CI tests artifact integrity. | NOT_STARTED | — |
| OGVPN-3745 | 3745 | CI tests that the VPN client does not report Connected unless the underlying tunnel is actually established. | NOT_STARTED | — |
| OGVPN-3746 | 3746 | CI/E2E verifies the backend → client → VPN-server control path. | NOT_STARTED | — |
| OGVPN-3747 | 3747 | CI/E2E verifies revocation. | NOT_STARTED | — |
| OGVPN-3748 | 3748 | CI/E2E verifies disconnect. | NOT_STARTED | — |
| OGVPN-3749 | 3749 | CI/E2E verifies reconnect. | NOT_STARTED | — |
| OGVPN-3750 | 3750 | CI/E2E verifies expired credentials. | NOT_STARTED | — |
| OGVPN-3751 | 3751 | CI/E2E verifies invalid configuration. | NOT_STARTED | — |
| OGVPN-3752 | 3752 | CI/E2E verifies server failure. | NOT_STARTED | — |
| OGVPN-3753 | 3753 | CI/E2E verifies network failure. | NOT_STARTED | — |
| OGVPN-3754 | 3754 | CI/E2E verifies recovery. | NOT_STARTED | — |
