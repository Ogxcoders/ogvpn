#!/usr/bin/env python3
"""Platform package.json hygiene (run once during repo import):
- proper package name
- engines field
- start script without bun (node runs the standalone server)
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.join(os.path.dirname(HERE), "platform", "package.json")

with open(PKG, encoding="utf-8") as f:
    pkg = json.load(f)

pkg["name"] = "@ogvpn/platform"
pkg["version"] = "1.0.0"
pkg["description"] = "OGVPN product platform — Next.js web app + API routes + Prisma/SQLite (billing, admin, support, analytics, notifications)."
pkg["engines"] = {"node": ">=20.9.0"}
pkg["scripts"]["dev"] = "next dev -p 3000"
pkg["scripts"]["start"] = "NODE_ENV=production node .next/standalone/server.js"

with open(PKG, "w", encoding="utf-8") as f:
    json.dump(pkg, f, indent=2)
    f.write("\n")
print("platform/package.json updated:", pkg["name"])
