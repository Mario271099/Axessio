// Garde anti-SSRF pour les webhooks sortants.
//
// Un endpoint webhook est une URL fournie par l'utilisateur, vers laquelle
// le dispatcher cron envoie des POST signés depuis le réseau Vercel. Sans
// validation, un admin malveillant pourrait pointer son endpoint vers :
//   - http://169.254.169.254/  (metadata instance AWS/GCP : vol de creds IAM)
//   - http://localhost:6379/   (Redis / DB interne)
//   - http://10.x / 192.168.x  (réseau privé du provider)
//   - un hostname public qui résout (via DNS rebinding) vers du privé
//
// Stratégie : on bloque côté création ET côté dispatch (defense in depth).
//   1. Le protocole DOIT être https.
//   2. Hostnames "obvious bad" (localhost, *.internal, *.local…) → rejet sans DNS.
//   3. Si hostname est une IP littérale, on la teste directement.
//   4. Sinon on résout via DNS (tous les A/AAAA), et on rejette si UNE seule
//      résolution tombe dans une plage privée/réservée.
//   5. Redirections refusées (`redirect: "manual"`) côté fetch pour empêcher
//      un endpoint public de rediriger vers une cible privée.

import "server-only";
import { promises as dns } from "node:dns";
import net from "node:net";

// ============================================================================
// IPv4 — CIDR matching
// ============================================================================

function ipv4ToU32(ip: string): number {
  const parts = ip.split(".");
  if (parts.length !== 4) throw new Error(`Invalid IPv4: ${ip}`);
  let out = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) {
      throw new Error(`Invalid IPv4 octet in ${ip}`);
    }
    out = (out << 8) | n;
  }
  return out >>> 0;
}

function ipv4InCidr(ip: string, base: string, prefix: number): boolean {
  if (prefix === 0) return true;
  const baseU32 = ipv4ToU32(base);
  const ipU32 = ipv4ToU32(ip);
  const mask = (~((1 << (32 - prefix)) - 1)) >>> 0;
  return (ipU32 & mask) === (baseU32 & mask);
}

// Source : RFC 6890 + plages opérationnelles (CGNAT, metadata cloud).
// Tout ce qui n'est PAS adressable globalement doit figurer ici.
const PRIVATE_IPV4: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8],         // "this network" — RFC 791
  ["10.0.0.0", 8],        // privé — RFC 1918
  ["100.64.0.0", 10],     // CGNAT — RFC 6598
  ["127.0.0.0", 8],       // loopback — RFC 1122
  ["169.254.0.0", 16],    // link-local + AWS/GCP metadata — RFC 3927
  ["172.16.0.0", 12],     // privé — RFC 1918
  ["192.0.0.0", 24],      // IETF protocol assignments — RFC 6890
  ["192.0.2.0", 24],      // TEST-NET-1 — RFC 5737
  ["192.168.0.0", 16],    // privé — RFC 1918
  ["198.18.0.0", 15],     // benchmark — RFC 2544
  ["198.51.100.0", 24],   // TEST-NET-2 — RFC 5737
  ["203.0.113.0", 24],    // TEST-NET-3 — RFC 5737
  ["224.0.0.0", 4],       // multicast — RFC 5771
  ["240.0.0.0", 4],       // reserved (incl. 255.255.255.255 broadcast)
];

export function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4.some(([base, prefix]) => ipv4InCidr(ip, base, prefix));
}

// ============================================================================
// IPv6 — parsing + prefix matching
// ============================================================================

function ipv6ToBytes(ip: string): Uint8Array {
  // Strip zone identifier (fe80::1%eth0) avant parsing.
  const clean = ip.split("%")[0];

  // Split sur "::" : au plus une fois (raccourci d'élision).
  const dcParts = clean.split("::");
  if (dcParts.length > 2) throw new Error(`Invalid IPv6: ${ip}`);

  const head = dcParts[0] ? dcParts[0].split(":") : [];
  const hasDoubleColon = dcParts.length === 2;
  const tail = hasDoubleColon
    ? dcParts[1]
      ? dcParts[1].split(":")
      : []
    : null;

  // Embedded IPv4 (ex: ::ffff:1.2.3.4) — convertit le dernier groupe en 2 hex.
  const lastList = tail ?? head;
  if (lastList.length > 0 && lastList[lastList.length - 1].includes(".")) {
    const v4 = lastList.pop() as string;
    const v4parts = v4.split(".").map(Number);
    if (
      v4parts.length !== 4 ||
      v4parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
    ) {
      throw new Error(`Invalid embedded IPv4 in ${ip}`);
    }
    lastList.push(((v4parts[0] << 8) | v4parts[1]).toString(16));
    lastList.push(((v4parts[2] << 8) | v4parts[3]).toString(16));
  }

  let parts: string[];
  if (tail !== null) {
    const missing = 8 - head.length - tail.length;
    if (missing < 0) throw new Error(`Invalid IPv6 (too many groups): ${ip}`);
    parts = [...head, ...Array(missing).fill("0"), ...tail];
  } else {
    if (head.length !== 8) {
      throw new Error(`Invalid IPv6 (groupes attendus: 8): ${ip}`);
    }
    parts = head;
  }

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    const group = parts[i];
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
      throw new Error(`Invalid IPv6 group "${group}" in ${ip}`);
    }
    const v = parseInt(group, 16);
    bytes[i * 2] = (v >> 8) & 0xff;
    bytes[i * 2 + 1] = v & 0xff;
  }
  return bytes;
}

export function isPrivateIPv6(ip: string): boolean {
  let b: Uint8Array;
  try {
    b = ipv6ToBytes(ip);
  } catch {
    // Échec de parsing → on bloque (fail closed).
    return true;
  }

  const allZeroExceptLast =
    b[0] === 0 && b[1] === 0 && b[2] === 0 && b[3] === 0 &&
    b[4] === 0 && b[5] === 0 && b[6] === 0 && b[7] === 0 &&
    b[8] === 0 && b[9] === 0 && b[10] === 0 && b[11] === 0 &&
    b[12] === 0 && b[13] === 0 && b[14] === 0;

  // :: (unspecified) ou ::1 (loopback)
  if (allZeroExceptLast && (b[15] === 0 || b[15] === 1)) return true;

  // ::ffff:0:0/96 — IPv4-mapped : recheck en v4
  if (
    b[0] === 0 && b[1] === 0 && b[2] === 0 && b[3] === 0 &&
    b[4] === 0 && b[5] === 0 && b[6] === 0 && b[7] === 0 &&
    b[8] === 0 && b[9] === 0 && b[10] === 0xff && b[11] === 0xff
  ) {
    const v4 = `${b[12]}.${b[13]}.${b[14]}.${b[15]}`;
    return isPrivateIPv4(v4);
  }

  // 64:ff9b::/96 — IPv4/IPv6 translation : recheck en v4
  if (
    b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b &&
    b[4] === 0 && b[5] === 0 && b[6] === 0 && b[7] === 0 &&
    b[8] === 0 && b[9] === 0 && b[10] === 0 && b[11] === 0
  ) {
    const v4 = `${b[12]}.${b[13]}.${b[14]}.${b[15]}`;
    return isPrivateIPv4(v4);
  }

  // 100::/64 — discard prefix
  if (
    b[0] === 0x01 && b[1] === 0x00 &&
    b[2] === 0 && b[3] === 0 && b[4] === 0 && b[5] === 0 && b[6] === 0 && b[7] === 0
  ) {
    return true;
  }

  // 2001:db8::/32 — documentation
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) return true;

  // fc00::/7 — ULA (unique local addresses)
  if ((b[0] & 0xfe) === 0xfc) return true;

  // fe80::/10 — link-local
  if (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) return true;

  // ff00::/8 — multicast
  if (b[0] === 0xff) return true;

  return false;
}

// ============================================================================
// assertPublicUrl — point d'entrée de la garde
// ============================================================================

export interface SsrfOk {
  ok: true;
  /** Hôte normalisé (sans crochets IPv6, lowercase, sans zone). */
  resolvedHost: string;
  /** Toutes les IPs auxquelles l'hôte résout (publiques uniquement). */
  resolvedIps: string[];
}
export interface SsrfFail {
  ok: false;
  /** Code court pour l'i18n / logs. */
  reason:
    | "invalid_url"
    | "non_https"
    | "missing_host"
    | "blocked_hostname"
    | "blocked_tld"
    | "private_literal_ipv4"
    | "private_literal_ipv6"
    | "dns_failed"
    | "dns_empty"
    | "private_resolved_ipv4"
    | "private_resolved_ipv6";
  /** Détail technique (mis en log, jamais montré à l'utilisateur). */
  detail: string;
}
export type SsrfCheckResult = SsrfOk | SsrfFail;

// Hostnames littéraux à rejeter avant toute résolution DNS.
const BLOCKED_LITERALS: ReadonlySet<string> = new Set([
  "localhost",
  "ip6-localhost",
  "ip6-loopback",
  "broadcasthost",
]);

// TLDs / suffixes réservés à l'intranet ou aux résolveurs internes.
// On bloque le suffixe exact (pas un endsWith générique pour éviter les FP).
const BLOCKED_TLDS: ReadonlyArray<string> = [
  ".local",      // mDNS — RFC 6762
  ".localhost",  // RFC 6761
  ".internal",   // convention privée (GCP, AWS)
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".private",
];

/**
 * Valide qu'une URL est sûre à appeler depuis le serveur. Effectue protocole +
 * hostname + résolution DNS (tous les A/AAAA). Retourne ok=false dès la
 * première IP privée trouvée.
 *
 * À appeler 2 fois : une fois à la création de l'endpoint (UX feedback),
 * une fois juste avant chaque POST dans le dispatcher (DNS rebinding defense).
 */
export async function assertPublicUrl(rawUrl: string): Promise<SsrfCheckResult> {
  // 1) Parsing de l'URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid_url", detail: rawUrl };
  }

  // 2) Protocole — https only
  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      reason: "non_https",
      detail: `protocole: ${parsed.protocol}`,
    };
  }

  // 3) Hostname obligatoire
  const rawHost = parsed.hostname.toLowerCase();
  if (!rawHost) {
    return { ok: false, reason: "missing_host", detail: rawUrl };
  }

  // IPv6 littéral arrive entre crochets dans URL.hostname (ex: "[::1]"),
  // que `parsed.hostname` retire déjà. On garde l'extraction defensive.
  const host = rawHost.startsWith("[") && rawHost.endsWith("]")
    ? rawHost.slice(1, -1)
    : rawHost;

  // 4) Hostnames littéraux bloqués
  if (BLOCKED_LITERALS.has(host)) {
    return { ok: false, reason: "blocked_hostname", detail: host };
  }
  for (const tld of BLOCKED_TLDS) {
    if (host === tld.slice(1) || host.endsWith(tld)) {
      return { ok: false, reason: "blocked_tld", detail: host };
    }
  }

  // 5) Si hostname est une IP littérale, on teste directement.
  if (net.isIPv4(host)) {
    if (isPrivateIPv4(host)) {
      return { ok: false, reason: "private_literal_ipv4", detail: host };
    }
    return { ok: true, resolvedHost: host, resolvedIps: [host] };
  }
  if (net.isIPv6(host)) {
    if (isPrivateIPv6(host)) {
      return { ok: false, reason: "private_literal_ipv6", detail: host };
    }
    return { ok: true, resolvedHost: host, resolvedIps: [host] };
  }

  // 6) Résolution DNS — tous les A/AAAA. `verbatim: true` pour éviter le
  // tri qui pourrait masquer une mauvaise IP en fin de liste.
  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.lookup(host, { all: true, verbatim: true });
  } catch (err) {
    return {
      ok: false,
      reason: "dns_failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
  if (!addresses || addresses.length === 0) {
    return { ok: false, reason: "dns_empty", detail: host };
  }

  // 7) Chaque IP résolue doit être publique.
  for (const { address, family } of addresses) {
    if (family === 4) {
      if (isPrivateIPv4(address)) {
        return {
          ok: false,
          reason: "private_resolved_ipv4",
          detail: `${host} → ${address}`,
        };
      }
    } else if (family === 6) {
      if (isPrivateIPv6(address)) {
        return {
          ok: false,
          reason: "private_resolved_ipv6",
          detail: `${host} → ${address}`,
        };
      }
    }
  }

  return {
    ok: true,
    resolvedHost: host,
    resolvedIps: addresses.map((a) => a.address),
  };
}
