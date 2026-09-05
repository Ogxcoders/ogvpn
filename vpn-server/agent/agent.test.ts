import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildAllowedIps,
  computeCpuPct,
  computeRamPct,
  isValidIpv4,
  isValidIpv6,
  isValidWgKey,
  opToCommand,
  parseProcStat,
  parseWgDump,
} from "./lib.js";

const PUB_A = "jNdh9re07VpxGbnPQSinlPbvW2eEBID2tdmeOkUOt9M=";
const PUB_B = "SN+v3e8CjduNothAI1IR+4ZVuzSlSJ0PmRq21Mi7lcE=";
const PUB_C = "qo7k9dIbKinjbU4gyJoY3DKfIalZz90xISE1idH2tPs=";

// Fixture: one interface line + 3 peers; the middle peer has handshake=0
// (registered but never connected) and must be skipped.
const DUMP = readFileSync(
  new URL("./testsFixtures/wg-dump-sample.txt", import.meta.url),
  "utf8",
);

const NOW_SEC = 1_717_000_100;

describe("parseWgDump", () => {
  it("parses the sample dump, skipping the zero-handshake peer", () => {
    const peers = parseWgDump(DUMP, NOW_SEC * 1000);
    expect(peers).toHaveLength(2);

    expect(peers[0]).toEqual({
      publicKey: PUB_A,
      bytesIn: 1_048_576,
      bytesOut: 2_097_152,
      handshakeAgoSec: 100,
    });
    expect(peers[1]).toEqual({
      publicKey: PUB_C,
      bytesIn: 512,
      bytesOut: 1024,
      handshakeAgoSec: 0,
    });
  });

  it("never returns a negative handshake age and defaults `now`", () => {
    const peers = parseWgDump(DUMP); // real clock — fixture epochs are in the past
    for (const p of peers) expect(p.handshakeAgoSec).toBeGreaterThanOrEqual(0);
    expect(peers.every((p) => [PUB_A, PUB_C].includes(p.publicKey))).toBe(true);
  });

  it("tolerates garbage input", () => {
    expect(parseWgDump("")).toEqual([]);
    expect(parseWgDump("wg0\tkey\tpub\t51820\toff")).toEqual([]); // interface line only
    expect(parseWgDump("not a dump at all")).toEqual([]);
    expect(parseWgDump(null as unknown as string)).toEqual([]);
  });

  it("skips lines with malformed public keys", () => {
    const dump = [
      "wg0\tpriv\tpub\t51820\toff",
      `x; rm -rf /\t(none)\t203.0.113.7:1\t10.66.66.9/32\t${NOW_SEC}\t5\t5\toff`,
    ].join("\n");
    expect(parseWgDump(dump, NOW_SEC * 1000)).toEqual([]);
  });
});

describe("buildAllowedIps", () => {
  it("appends /32 and /128 and joins with a comma for dual-stack", () => {
    expect(buildAllowedIps("10.66.66.2", "fd42:4242::2")).toBe(
      "10.66.66.2/32,fd42:4242::2/128",
    );
  });

  it("emits IPv4-only when addressV6 is absent, null or empty", () => {
    expect(buildAllowedIps("10.66.66.2")).toBe("10.66.66.2/32");
    expect(buildAllowedIps("10.66.66.2", undefined)).toBe("10.66.66.2/32");
    expect(buildAllowedIps("10.66.66.2", null)).toBe("10.66.66.2/32");
    expect(buildAllowedIps("10.66.66.2", "")).toBe("10.66.66.2/32");
  });

  it("accepts host addresses that already carry the exact host prefix", () => {
    expect(buildAllowedIps("10.66.66.2/32", "fd42:4242::2/128")).toBe(
      "10.66.66.2/32,fd42:4242::2/128",
    );
  });

  it("throws on invalid or wrong-prefix addresses", () => {
    expect(() => buildAllowedIps("999.1.1.1")).toThrow();
    expect(() => buildAllowedIps("10.66.66.2", "not-an-ip")).toThrow();
    expect(() => buildAllowedIps("10.66.66.2/24")).toThrow(); // /24 is not a host route
    expect(() => buildAllowedIps("10.66.66.2", "fd42:4242::2/64")).toThrow();
  });
});

describe("opToCommand", () => {
  const dualStack = { publicKey: PUB_B, addressV4: "10.66.66.7", addressV6: "fd42:4242::7" };

  it("builds the exact argv for add_peer with both families", () => {
    expect(opToCommand("add_peer", dualStack)).toEqual({
      file: "wg",
      args: ["set", "wg0", "peer", PUB_B, "allowed-ips", "10.66.66.7/32,fd42:4242::7/128"],
    });
  });

  it("builds IPv4-only argv when addressV6 is missing", () => {
    expect(opToCommand("add_peer", { publicKey: PUB_B, addressV4: "10.66.66.7" })).toEqual({
      file: "wg",
      args: ["set", "wg0", "peer", PUB_B, "allowed-ips", "10.66.66.7/32"],
    });
  });

  it("builds the exact argv for remove_peer and honors a custom interface", () => {
    expect(opToCommand("remove_peer", { publicKey: PUB_B })).toEqual({
      file: "wg",
      args: ["set", "wg0", "peer", PUB_B, "remove"],
    });
    expect(opToCommand("add_peer", dualStack, "wg1").args[1]).toBe("wg1");
  });

  it("THROWS on injected/shell-looking public keys instead of exec'ing them", () => {
    for (const evil of ["x; rm -rf /", "$(reboot)", "", PUB_B.slice(0, 43)]) {
      expect(() => opToCommand("add_peer", { ...dualStack, publicKey: evil })).toThrow();
      expect(() => opToCommand("remove_peer", { publicKey: evil })).toThrow();
    }
  });

  it("throws on unknown op types, non-object payloads and bad addresses", () => {
    expect(() => opToCommand("drop_tables", dualStack)).toThrow();
    expect(() => opToCommand("add_peer", "10.66.66.1" as unknown as object)).toThrow();
    expect(() => opToCommand("add_peer", null as unknown as object)).toThrow();
    expect(() =>
      opToCommand("add_peer", { publicKey: PUB_B, addressV4: "1.2.3.4/99" } as never),
    ).toThrow();
    expect(() =>
      opToCommand("add_peer", { publicKey: PUB_B, addressV4: "10.0.0.1", addressV6: ":::" }),
    ).toThrow();
    expect(() => opToCommand("add_peer", dualStack, "wg 0; rm -rf /")).toThrow();
  });
});

describe("computeCpuPct", () => {
  it("computes busy percentage from idle/total deltas", () => {
    expect(computeCpuPct({ idle: 100, total: 200 }, { idle: 150, total: 300 })).toBe(50);
    expect(computeCpuPct({ idle: 0, total: 100 }, { idle: 0, total: 200 })).toBe(100);
    expect(computeCpuPct({ idle: 100, total: 100 }, { idle: 200, total: 200 })).toBe(0);
  });

  it("returns 0 for identical/decreasing/absent samples", () => {
    expect(computeCpuPct({ idle: 100, total: 200 }, { idle: 100, total: 200 })).toBe(0);
    expect(computeCpuPct({ idle: 200, total: 300 }, { idle: 100, total: 200 })).toBe(0);
    expect(computeCpuPct(null, { idle: 0, total: 10 })).toBe(0);
  });
});

describe("computeRamPct", () => {
  const meminfo = [
    "MemTotal:       16384000 kB",
    "MemFree:         4194304 kB",
    "MemAvailable:    8192000 kB",
    "Buffers:          512000 kB",
    "Cached:          2048000 kB",
  ].join("\n");

  it("uses MemAvailable when present", () => {
    expect(computeRamPct(meminfo)).toBe(50);
  });

  it("falls back to MemFree on kernels without MemAvailable", () => {
    const old = "MemTotal:  1000000 kB\nMemFree:    250000 kB\nBuffers:      1000 kB";
    expect(computeRamPct(old)).toBe(75);
  });

  it("clamps and throws on truncated input", () => {
    expect(computeRamPct("MemTotal: 100 kB\nMemAvailable: 500 kB")).toBe(0); // avail >= total
    expect(() => computeRamPct("SwapTotal: 999 kB")).toThrow();
    expect(() => computeRamPct("")).toThrow();
  });
});

describe("parseProcStat", () => {
  it("splits the cpu line into idle (idle+iowait) and total", () => {
    const s = parseProcStat("cpu  100 0 200 1000 100 0 0 0 0 0\ncpu0 1 2 3 4 5 6 7 8 9 10\n");
    expect(s.idle).toBe(1100);
    expect(s.total).toBe(1400);
  });
});

describe("isValidWgKey", () => {
  it("accepts real 44-char WireGuard base64 keys", () => {
    for (const k of [PUB_A, PUB_B, PUB_C, "xJVqvs7XvOkcqTNGyMU3ylTwJ35kLRAOja1e75j4/zk="]) {
      expect(isValidWgKey(k)).toBe(true);
    }
  });

  it("rejects injections, truncations, padding errors and non-strings", () => {
    expect(isValidWgKey("x; rm -rf /")).toBe(false);
    expect(isValidWgKey("$(whoami)")).toBe(false);
    expect(isValidWgKey(PUB_A.slice(0, 43))).toBe(false); // missing '='
    expect(isValidWgKey(`${PUB_A}XX`)).toBe(false); // wrong length
    expect(isValidWgKey(`${PUB_A.slice(0, 43)}B=`)).toBe(false); // invalid final symbol before '='
    expect(isValidWgKey(null as unknown as string)).toBe(false);
    expect(isValidWgKey(42 as unknown as string)).toBe(false);
  });
});

describe("isValidIpv4", () => {
  it("accepts valid dotted quads", () => {
    for (const v of ["10.66.66.2", "1.2.3.4", "255.255.255.255", "0.0.0.0"]) {
      expect(isValidIpv4(v)).toBe(true);
    }
  });

  it("rejects malformed values", () => {
    for (const v of ["256.1.1.1", "1.2.3", "1.2.3.4.5", "01.2.3.4", "1.2.3.4 ", " 1.2.3.4", "", "1.2.3.4\nrm"]) {
      expect(isValidIpv4(v)).toBe(false);
    }
    expect(isValidIpv4(undefined as unknown as string)).toBe(false);
  });
});

describe("isValidIpv6", () => {
  it("accepts canonical, compressed and embedded-IPv4 forms", () => {
    for (const v of [
      "::",
      "::1",
      "fd42:4242::1",
      "2001:db8::8a2e:370:7334",
      "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      "::ffff:192.0.2.1",
      "1:2:3:4:5:6:1.2.3.4",
      "1::",
    ]) {
      expect(isValidIpv6(v)).toBe(true);
    }
  });

  it("rejects malformed values and zone identifiers", () => {
    for (const v of [
      "1::2::3", // more than one "::"
      "12345::", // 5-hex-digit group
      "fe80::1%eth0", // zone id
      "1.2.3.4", // IPv4
      "1:2:3:4:5:6:7:8:9", // 9 groups
      "1:2:3:4:5:6:7:8::", // 8 explicit groups plus "::"
      "1:2:3:4:5:6:7:1.2.3.4", // embedded v4 would overflow past 8 groups
      ":1:2:3:4:5:6:7",
      "fd42:4242::1/64", // prefix, not an address
      "",
    ]) {
      expect(isValidIpv6(v)).toBe(false);
    }
    expect(isValidIpv6(undefined as unknown as string)).toBe(false);
  });
});
