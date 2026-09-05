#!/usr/bin/env python3
"""
Generate docs/master-checklist.json and docs/MASTER-CHECKLIST.md.

Base: docs/source-checklist.md — the 3,689-item autonomous end-to-end build,
repair & production readiness checklist (parsed, never truncated).
Addition: 65 CI/CD + GitHub verification items supplied by the project owner
(appended as section "102. CI/CD + GitHub Verification").

Total: 3,754 tracked items, each carrying:
  status  : NOT_STARTED | IMPLEMENTED | BUILT | AUTOMATED_TESTED |
            REAL_RUNTIME_TESTED | EVIDENCED
  evidence: list of pointers (test suite, CI run, artifact, log, ticket)

Deterministic output (no timestamps) so CI can diff-check integrity.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "source-checklist.md")
OUT_JSON = os.path.join(ROOT, "docs", "master-checklist.json")
OUT_MD = os.path.join(ROOT, "docs", "MASTER-CHECKLIST.md")

BASE_COUNT = 3689
CI_COUNT = 65
TOTAL = BASE_COUNT + CI_COUNT

# Item header: `N. **Section** --- title` — the `--- title` part may wrap to
# the following line(s), so it is optional at end-of-line.
ITEM_RE = re.compile(
    r"^-\s+\[[ xX]\]\s+(\d+)\.\s+\*\*(.+?)\*\*\s*(?:---\s*(.*))?$"
)

CI_SECTION = "102. CI/CD + GitHub Verification"

CI_ITEMS = [
    "Repository checkout works.",
    "Clean checkout works.",
    "Public repository clone works.",
    "Agent can pull.",
    "Agent can commit.",
    "Agent can push.",
    "Branch protection is respected.",
    "Pull requests work.",
    "GitHub Actions workflow starts.",
    "Workflow permissions are correct.",
    "Secrets are never printed.",
    "Tokens never appear in logs.",
    "Dependency installation succeeds.",
    "Backend builds.",
    "Web builds.",
    "Chrome extension builds.",
    "Android builds.",
    "Android release APK builds.",
    "Android AAB builds.",
    "Desktop Windows build works.",
    "Desktop macOS build works.",
    "Desktop Linux build works.",
    "Unit tests run.",
    "Integration tests run.",
    "E2E tests run.",
    "VPN server tests run.",
    "Artifacts are uploaded.",
    "Artifacts can be downloaded.",
    "Failed builds fail the workflow.",
    "Test failures fail the workflow.",
    "Build logs are retained.",
    "Version numbers are correct.",
    "Release artifacts are correctly named.",
    "Clean-machine installation works.",
    "Rebuild from a fresh checkout works.",
    "No developer-machine-only dependencies exist.",
    "No hardcoded local paths exist.",
    "No credentials are committed.",
    "No .env secrets are committed.",
    "Dependency lockfiles are committed.",
    "CI uses pinned/controlled dependency versions.",
    "CI performs security scanning.",
    "CI performs dependency vulnerability checks.",
    "CI performs secret scanning.",
    "CI performs static analysis.",
    "CI performs type checking.",
    "CI performs formatting/lint checks.",
    "CI performs database migration tests.",
    "CI performs backend API tests.",
    "CI performs cross-platform build matrix.",
    "CI tests clean installation.",
    "CI tests upgrade installation.",
    "CI tests uninstall.",
    "CI tests rollback.",
    "CI tests artifact integrity.",
    "CI tests that the VPN client does not report Connected unless the underlying tunnel is actually established.",
    "CI/E2E verifies the backend \u2192 client \u2192 VPN-server control path.",
    "CI/E2E verifies revocation.",
    "CI/E2E verifies disconnect.",
    "CI/E2E verifies reconnect.",
    "CI/E2E verifies expired credentials.",
    "CI/E2E verifies invalid configuration.",
    "CI/E2E verifies server failure.",
    "CI/E2E verifies network failure.",
    "CI/E2E verifies recovery.",
]

STATUSES = [
    "NOT_STARTED",
    "IMPLEMENTED",
    "BUILT",
    "AUTOMATED_TESTED",
    "REAL_RUNTIME_TESTED",
    "EVIDENCED",
]


def parse_items(text: str):
    """Parse the 3,689 items.

    The source markdown wraps lines in three different ways:
      1. `-   [ ] N. **Section** --- title` on one line (+ wrapped title lines)
      2. `-   [ ] N. **Section**` with `--- title` starting the next line
      3. the bold section header itself split across lines:
         `-   [ ] N. **101. Matrix: X / Y` + `recovery** --- title`
    Strategy: anchor on item-start lines, take everything up to the next
    item start (or next markdown header) as the item body, collapse all
    whitespace, then split `**Section** --- title` once.
    """
    start_re = re.compile(r"^-\s+\[[ xX]\]\s+(\d+)\.\s+(.*)$", re.M)
    split_re = re.compile(r"^\*\*(.+?)\*\*\s*---\s*(.*)$", re.S)
    matches = list(start_re.finditer(text))
    items = []
    for idx, m in enumerate(matches):
        header_rest = m.group(2)
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        body = text[m.end():end]
        hpos = body.find("\n#")
        if hpos != -1:
            body = body[:hpos]
        combined = re.sub(r"\s+", " ", (header_rest + " " + body)).strip()
        sm = split_re.match(combined)
        if sm is None:
            raise SystemExit(
                f"FATAL: cannot parse item #{m.group(1)}: {combined[:140]}"
            )
        items.append(
            {
                "n": int(m.group(1)),
                "section": sm.group(1).strip(),
                "title": sm.group(2).strip(),
            }
        )
    return items


def build_items():
    with open(SRC, encoding="utf-8") as f:
        text = f.read()
    base = parse_items(text)
    if len(base) != BASE_COUNT:
        raise SystemExit(
            f"FATAL: source parsed {len(base)} items, expected {BASE_COUNT}"
        )
    for idx, it in enumerate(base, 1):
        if it["n"] != idx:
            raise SystemExit(
                f"FATAL: numbering broken: expected #{idx}, got #{it['n']}"
            )
    for it in base:
        # Normalise: collapse wraps, drop a leading '--- ' that arrived from
        # a continuation line when the header had no inline title.
        title = re.sub(r"\s+", " ", it["title"]).strip()
        title = re.sub(r"^---\s*", "", title).strip()
        it["title"] = title
    items = []
    for it in base:
        items.append(
            {
                "id": f"OGVPN-{it['n']:04d}",
                "n": it["n"],
                "section": it["section"],
                "title": it["title"],
                "status": "NOT_STARTED",
                "evidence": [],
            }
        )
    n = BASE_COUNT
    for title in CI_ITEMS:
        n += 1
        items.append(
            {
                "id": f"OGVPN-{n:04d}",
                "n": n,
                "section": CI_SECTION,
                "title": title,
                "status": "NOT_STARTED",
                "evidence": [],
            }
        )
    if len(items) != TOTAL:
        raise SystemExit(f"FATAL: total {len(items)} != {TOTAL}")
    return items


def section_summary(items):
    order = []
    counts = {}
    for it in items:
        if it["section"] not in counts:
            order.append(it["section"])
            counts[it["section"]] = 0
        counts[it["section"]] += 1
    return order, counts


def write_json(items):
    doc = {
        "meta": {
            "project": "OGVPN",
            "checklist_version": "2.0",
            "base_items": BASE_COUNT,
            "ci_github_items": CI_COUNT,
            "total_items": TOTAL,
            "source": "docs/source-checklist.md (3,689-item master checklist) + owner-supplied CI/CD+GitHub addendum",
            "status_enum": STATUSES,
            "evidence_ladder": [
                "IMPLEMENTED \u2014 code exists in the repository",
                "BUILT \u2014 compiled/assembled successfully by CI (GitHub Actions), not just locally",
                "AUTOMATED_TESTED \u2014 an automated test suite covers the item and passes in CI",
                "REAL_RUNTIME_TESTED \u2014 exercised against a real running system (device, server, network)",
                "EVIDENCED \u2014 a durable, linkable artifact proves it (CI run URL, artifact, log, screenshot)",
            ],
            "rules": [
                "Source code is not proof of functionality.",
                "Compilation is not proof of correctness.",
                "An item is PASS only at EVIDENCED tier with a concrete, linkable artifact.",
                "Never report a blanket pass count; every item carries its own status and evidence.",
                "Mark FAIL with reproduction steps, fix the root cause, and retest.",
                "Do not mark an item N/A without recording why it genuinely does not apply.",
            ],
        },
        "items": items,
    }
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    return doc


def write_md(items):
    order, counts = section_summary(items)
    lines = []
    lines.append("# OGVPN Master Checklist \u2014 3,754 Items")
    lines.append("")
    lines.append(
        "Generated from `docs/source-checklist.md` "
        f"({BASE_COUNT} base items) + {CI_COUNT} CI/CD + GitHub verification "
        "items supplied by the project owner. Machine-readable twin: "
        "`docs/master-checklist.json`."
    )
    lines.append("")
    lines.append("## Evidence ladder (mandatory)")
    lines.append("")
    lines.append("```")
    lines.append("IMPLEMENTED \u2192 BUILT \u2192 AUTOMATED TESTED \u2192 REAL RUNTIME TESTED \u2192 EVIDENCE")
    lines.append("```")
    lines.append("")
    lines.append("| Tier | Meaning |")
    lines.append("|---|---|")
    lines.append("| IMPLEMENTED | Code exists in the repository |")
    lines.append("| BUILT | Compiled/assembled by GitHub Actions CI, not just locally |")
    lines.append("| AUTOMATED TESTED | Automated suite covers the item and passes in CI |")
    lines.append("| REAL RUNTIME TESTED | Exercised against a real running system (device/server/network) |")
    lines.append("| EVIDENCE | Durable, linkable artifact: CI run URL, artifact, log, screenshot |")
    lines.append("")
    lines.append("## Rules")
    lines.append("")
    lines.append("- Source code is not proof of functionality. Compilation is not proof of correctness.")
    lines.append("- An item is PASS only at the EVIDENCE tier with a concrete artifact.")
    lines.append("- Never report a blanket pass count (\u201call tests passed\u201d); every item carries its own status.")
    lines.append("- FAIL items must record reproduction steps, root cause, and the fix commit.")
    lines.append("- N/A items must record why they genuinely do not apply.")
    lines.append("")
    lines.append("## Section summary")
    lines.append("")
    lines.append("| # | Section | Items |")
    lines.append("|---|---|---|")
    for i, sec in enumerate(order, 1):
        lines.append(f"| {i} | {sec} | {counts[sec]} |")
    lines.append(f"| | **Total** | **{TOTAL}** |")
    lines.append("")
    lines.append("## Full item list")
    lines.append("")
    cur = None
    for it in items:
        if it["section"] != cur:
            cur = it["section"]
            lines.append(f"### {cur}")
            lines.append("")
            lines.append("| ID | # | Item | Status | Evidence |")
            lines.append("|---|---|---|---|---|")
        title = it["title"].replace("|", "\\|")
        ev = (
            "; ".join(it["evidence"]).replace("|", "\\|")
            if it["evidence"]
            else "\u2014"
        )
        lines.append(
            f"| {it['id']} | {it['n']} | {title} | {it['status']} | {ev} |"
        )
    lines.append("")
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    items = build_items()
    write_json(items)
    write_md(items)
    order, counts = section_summary(items)
    print(f"OK: {TOTAL} items ({BASE_COUNT} base + {CI_COUNT} CI/CD+GitHub)")
    print(f"sections: {len(order)}")
    print(f"json: {OUT_JSON}")
    print(f"md:   {OUT_MD}")


if __name__ == "__main__":
    main()
