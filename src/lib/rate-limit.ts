// Rate limiter à fenêtre fixe, avec deux backends :
//
//   - Upstash Redis (REST) si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//     sont présents → compteur GLOBAL, partagé entre toutes les lambdas Vercel.
//     C'est le mode prod : il ferme la faille du compteur par-instance.
//   - Fallback in-memory (Map JS) sinon → utile en dev local et comme filet
//     si Upstash est momentanément indisponible. NON fiable en multi-instance
//     (chaque lambda a sa propre Map) mais mieux que rien.
//
// L'API est désormais ASYNCHRONE (`await rateLimit(...)`) : un compteur Redis
// implique forcément un aller-retour réseau. La forme du résultat est
// inchangée pour les appelants.

import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Nettoyage paresseux : on purge les entrées expirées à chaque lecture pour
// éviter une fuite mémoire (la Map grandirait sinon avec chaque nouvelle clé).
function purgeIfExpired(key: string, now: number): void {
  const bucket = store.get(key);
  if (bucket && bucket.resetAt <= now) store.delete(key);
}

export interface RateLimitResult {
  ok: boolean;
  /** Nombre d'appels restants dans la fenêtre courante. */
  remaining: number;
  /** Millisecondes avant réinitialisation du compteur. */
  resetMs: number;
}

// ----------------------------------------------------------------------------
// Backend Redis (lazy singleton). `undefined` = pas encore résolu,
// `null` = indisponible (env vars absentes) → on reste en in-memory.
// ----------------------------------------------------------------------------
let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

// ----------------------------------------------------------------------------
// Implémentation in-memory (fenêtre fixe, instance unique).
// ----------------------------------------------------------------------------
function rateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  purgeIfExpired(key, now);

  const existing = store.get(key);
  if (!existing) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetMs: Math.max(0, existing.resetAt - now),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetMs: Math.max(0, existing.resetAt - now),
  };
}

// ----------------------------------------------------------------------------
// Implémentation Redis (fenêtre fixe via INCR + PEXPIRE).
// ----------------------------------------------------------------------------
async function rateLimitRedis(
  redis: Redis,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const k = `rl:${key}`;

  // INCR crée la clé à 1 si absente. La première requête de la fenêtre pose
  // l'expiration ; les suivantes la laissent courir (fenêtre fixe).
  const count = await redis.incr(k);
  if (count === 1) {
    await redis.pexpire(k, windowMs);
  }

  let ttl = await redis.pttl(k);
  // -1 = clé sans TTL (crash entre INCR et PEXPIRE, ou clé pré-existante) ;
  // -2 = clé absente (course rare). Dans les deux cas on (re)pose le TTL.
  if (ttl < 0) {
    await redis.pexpire(k, windowMs);
    ttl = windowMs;
  }

  if (count > limit) {
    return { ok: false, remaining: 0, resetMs: ttl };
  }
  return { ok: true, remaining: Math.max(0, limit - count), resetMs: ttl };
}

/**
 * Vérifie et incrémente le compteur pour une clé donnée.
 *
 * @param key     Identifiant logique unique (ex. `inviteUser:<userId>`).
 * @param limit   Nombre maximal d'appels autorisés dans la fenêtre.
 * @param windowMs Largeur de la fenêtre en ms.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return rateLimitInMemory(key, limit, windowMs);

  try {
    return await rateLimitRedis(redis, key, limit, windowMs);
  } catch {
    // Upstash injoignable : on dégrade vers l'in-memory plutôt que de bloquer
    // un utilisateur légitime (fail-open contrôlé — la limite reste appliquée
    // au niveau de l'instance courante).
    return rateLimitInMemory(key, limit, windowMs);
  }
}

/** Formatte le retry-after en secondes pour les messages d'erreur. */
export function retryAfterSeconds(resetMs: number): number {
  return Math.max(1, Math.ceil(resetMs / 1000));
}
