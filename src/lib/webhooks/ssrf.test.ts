import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promises as dns } from "node:dns";
import { assertPublicUrl, isPrivateIPv4, isPrivateIPv6 } from "./ssrf";

// `assertPublicUrl` fait une vraie résolution DNS via `dns.promises.lookup`.
// On spy sur la méthode pour contrôler le retour sans réseau. Les cas
// littéraux et de parsing fonctionnent sans DNS du tout.
const lookupSpy = vi.spyOn(dns, "lookup");

beforeEach(() => {
  lookupSpy.mockReset();
});

afterEach(() => {
  lookupSpy.mockReset();
});

// ============================================================================
// isPrivateIPv4
// ============================================================================
describe("isPrivateIPv4", () => {
  const PRIVATE = [
    "0.0.0.0",            // "this network"
    "10.0.0.1",           // RFC 1918
    "10.255.255.255",
    "100.64.0.1",         // CGNAT
    "100.127.255.255",
    "127.0.0.1",          // loopback
    "127.255.255.254",
    "169.254.0.1",        // link-local
    "169.254.169.254",    // AWS / GCP metadata
    "172.16.0.1",         // RFC 1918
    "172.31.255.254",
    "192.0.0.1",          // IETF assignments
    "192.0.2.1",          // TEST-NET-1
    "192.168.0.1",        // RFC 1918
    "192.168.255.255",
    "198.18.0.1",         // benchmark
    "198.51.100.1",       // TEST-NET-2
    "203.0.113.1",        // TEST-NET-3
    "224.0.0.1",          // multicast
    "239.255.255.255",
    "240.0.0.1",          // reserved
    "255.255.255.255",    // broadcast
  ];
  const PUBLIC = [
    "1.1.1.1",
    "8.8.8.8",
    "9.9.9.9",
    "172.15.255.255",     // juste avant 172.16/12
    "172.32.0.0",         // juste après 172.16/12
    "100.63.255.255",     // juste avant 100.64/10
    "100.128.0.0",        // juste après 100.64/10
    "169.253.255.255",
    "169.255.0.0",
  ];

  for (const ip of PRIVATE) {
    it(`bloque ${ip} (privé/réservé)`, () => {
      expect(isPrivateIPv4(ip)).toBe(true);
    });
  }
  for (const ip of PUBLIC) {
    it(`autorise ${ip} (public)`, () => {
      expect(isPrivateIPv4(ip)).toBe(false);
    });
  }
});

// ============================================================================
// isPrivateIPv6
// ============================================================================
describe("isPrivateIPv6", () => {
  const PRIVATE = [
    "::",                       // unspecified
    "::1",                      // loopback
    "fc00::1",                  // ULA
    "fd00::1",                  // ULA
    "fe80::1",                  // link-local
    "febf::1",                  // link-local (haut de plage)
    "ff00::1",                  // multicast
    "ff02::1",                  // multicast all-nodes
    "2001:db8::1",              // documentation
    "100::1",                   // discard prefix
    "::ffff:169.254.169.254",   // IPv4-mapped vers metadata
    "::ffff:127.0.0.1",         // IPv4-mapped vers loopback
    "::ffff:10.0.0.1",          // IPv4-mapped vers RFC 1918
    "64:ff9b::169.254.169.254", // NAT64 vers metadata
  ];
  const PUBLIC = [
    "2606:4700:4700::1111",     // Cloudflare DNS
    "2001:4860:4860::8888",     // Google DNS
    "::ffff:8.8.8.8",           // IPv4-mapped public
  ];
  const INVALID = [
    "not-an-ip",
    "::g",
    "1:2:3:4:5:6:7:8:9",        // trop de groupes
  ];

  for (const ip of PRIVATE) {
    it(`bloque ${ip}`, () => {
      expect(isPrivateIPv6(ip)).toBe(true);
    });
  }
  for (const ip of PUBLIC) {
    it(`autorise ${ip}`, () => {
      expect(isPrivateIPv6(ip)).toBe(false);
    });
  }
  for (const ip of INVALID) {
    it(`fail closed sur "${ip}" (parse failure → bloqué)`, () => {
      expect(isPrivateIPv6(ip)).toBe(true);
    });
  }
});

// ============================================================================
// assertPublicUrl — parsing & schéma
// ============================================================================
describe("assertPublicUrl — parsing & protocole", () => {
  it("rejette une URL invalide", async () => {
    const r = await assertPublicUrl("not a url");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_url");
  });

  it("rejette http:// (force https)", async () => {
    const r = await assertPublicUrl("http://example.com/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("non_https");
  });

  it("rejette ftp://", async () => {
    const r = await assertPublicUrl("ftp://example.com/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("non_https");
  });

  it("rejette file://", async () => {
    const r = await assertPublicUrl("file:///etc/passwd");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("non_https");
  });
});

// ============================================================================
// assertPublicUrl — hostnames bloqués sans DNS
// ============================================================================
describe("assertPublicUrl — hostnames bloqués", () => {
  it("rejette https://localhost", async () => {
    const r = await assertPublicUrl("https://localhost/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("blocked_hostname");
    expect(lookupSpy).not.toHaveBeenCalled();
  });

  it("rejette https://*.local", async () => {
    const r = await assertPublicUrl("https://printer.local/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("blocked_tld");
  });

  it("rejette https://*.internal", async () => {
    const r = await assertPublicUrl("https://api.internal/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("blocked_tld");
  });

  it("rejette https://*.intranet", async () => {
    const r = await assertPublicUrl("https://server.intranet/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("blocked_tld");
  });
});

// ============================================================================
// assertPublicUrl — IPs littérales
// ============================================================================
describe("assertPublicUrl — IPs littérales", () => {
  it("rejette https://127.0.0.1", async () => {
    const r = await assertPublicUrl("https://127.0.0.1/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_literal_ipv4");
    expect(lookupSpy).not.toHaveBeenCalled();
  });

  it("rejette https://169.254.169.254 (AWS metadata)", async () => {
    const r = await assertPublicUrl(
      "https://169.254.169.254/latest/meta-data/iam/security-credentials/",
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_literal_ipv4");
  });

  it("rejette https://10.0.0.1", async () => {
    const r = await assertPublicUrl("https://10.0.0.1/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_literal_ipv4");
  });

  it("rejette https://192.168.1.1", async () => {
    const r = await assertPublicUrl("https://192.168.1.1/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_literal_ipv4");
  });

  it("rejette https://[::1] (IPv6 loopback)", async () => {
    const r = await assertPublicUrl("https://[::1]/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_literal_ipv6");
  });

  it("rejette https://[fc00::1] (IPv6 ULA)", async () => {
    const r = await assertPublicUrl("https://[fc00::1]/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_literal_ipv6");
  });

  it("accepte une IPv4 publique littérale", async () => {
    const r = await assertPublicUrl("https://1.1.1.1/hook");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.resolvedHost).toBe("1.1.1.1");
      expect(r.resolvedIps).toEqual(["1.1.1.1"]);
    }
    expect(lookupSpy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// assertPublicUrl — résolution DNS
// ============================================================================
describe("assertPublicUrl — DNS lookup", () => {
  it("rejette un hostname qui résout vers une IP privée", async () => {
    lookupSpy.mockImplementation(
      // @ts-expect-error - signature overload polymorphe
      async () => [{ address: "10.0.0.5", family: 4 }],
    );
    const r = await assertPublicUrl("https://evil.example.com/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_resolved_ipv4");
  });

  it("rejette si UNE des IPs résolues est privée (multi-record)", async () => {
    lookupSpy.mockImplementation(
      // @ts-expect-error - overload polymorphe
      async () => [
        { address: "1.2.3.4", family: 4 },
        { address: "192.168.1.1", family: 4 },
        { address: "5.6.7.8", family: 4 },
      ],
    );
    const r = await assertPublicUrl("https://multi.example.com/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_resolved_ipv4");
  });

  it("rejette un hostname qui résout vers une IPv6 ULA", async () => {
    lookupSpy.mockImplementation(
      // @ts-expect-error - overload polymorphe
      async () => [{ address: "fc00::1", family: 6 }],
    );
    const r = await assertPublicUrl("https://v6.example.com/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_resolved_ipv6");
  });

  it("accepte un hostname public", async () => {
    lookupSpy.mockImplementation(
      // @ts-expect-error - overload polymorphe
      async () => [
        { address: "1.1.1.1", family: 4 },
        { address: "2606:4700:4700::1111", family: 6 },
      ],
    );
    const r = await assertPublicUrl("https://one.one.one.one/hook");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.resolvedIps).toContain("1.1.1.1");
      expect(r.resolvedIps).toContain("2606:4700:4700::1111");
    }
  });

  it("rejette si DNS échoue (NXDOMAIN)", async () => {
    lookupSpy.mockImplementation(
      // @ts-expect-error - overload polymorphe
      async () => {
        throw new Error("ENOTFOUND");
      },
    );
    const r = await assertPublicUrl("https://nope.example.invalid/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("dns_failed");
  });

  it("rejette si DNS retourne 0 adresse", async () => {
    lookupSpy.mockImplementation(
      // @ts-expect-error - overload polymorphe
      async () => [],
    );
    const r = await assertPublicUrl("https://empty.example.com/hook");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("dns_empty");
  });
});
