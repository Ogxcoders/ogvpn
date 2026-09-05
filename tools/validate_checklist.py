#!/usr/bin/env python3
"""
CI validator for the OGVPN master checklist.

Fails the workflow unless:
  - docs/master-checklist.json exists and parses
  - total items == 3,754 (3,689 base + 65 CI/CD+GitHub)
  - base item numbering is exactly 1..3,689 in order
  - the CI/CD section holds exactly the last 65 items
  - every item has a valid status enum value, non-empty id/title/section
  - every id is unique
Run from the repository root:  python tools/validate_checklist.py
"""
import json
import os
import sys

BASE = 3689
CI = 65
TOTAL = BASE + CI
CI_SECTION = "102. CI/CD + GitHub Verification"
ENUM = {
    "NOT_STARTED",
    "IMPLEMENTED",
    "BUILT",
    "AUTOMATED_TESTED",
    "REAL_RUNTIME_TESTED",
    "EVIDENCED",
}


def main():
    path = os.path.join("docs", "master-checklist.json")
    errors = []
    if not os.path.exists(path):
        print(f"FAIL: {path} missing \u2014 run scripts/generate_checklist.py")
        return 1
    try:
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
    except json.JSONDecodeError as exc:
        print(f"FAIL: {path} is not valid JSON: {exc}")
        return 1

    items = doc.get("items", [])
    if len(items) != TOTAL:
        errors.append(f"item count {len(items)} != {TOTAL}")
    ids = [it.get("id", "") for it in items]
    if len(set(ids)) != len(ids):
        errors.append("duplicate item ids present")
    for idx, it in enumerate(items[:BASE], 1):
        if it.get("n") != idx:
            errors.append(f"base numbering broken at position {idx}")
            break
    ci = items[BASE:]
    if len(ci) != CI or any(it.get("section") != CI_SECTION for it in ci):
        errors.append(f"CI/CD addendum must be the last {CI} items in '{CI_SECTION}'")
    for it in items:
        if not it.get("id") or not it.get("title") or not it.get("section"):
            errors.append(f"item with missing id/title/section: {it.get('id', '?')}")
            break
        if it.get("status") not in ENUM:
            errors.append(f"invalid status '{it.get('status')}' on {it['id']}")
            break
        if not isinstance(it.get("evidence"), list):
            errors.append(f"evidence must be a list on {it['id']}")
            break

    if errors:
        print("CHECKLIST VALIDATION FAILED:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print(
        f"CHECKLIST OK: {TOTAL} items "
        f"({BASE} base + {CI} CI/CD+GitHub), all ids unique, statuses valid"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
