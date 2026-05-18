// Rate limiter in-memory à fenêtre fixe.
//
// Adapté à une instance unique (Vercel serverless = un compteur par instance
// chaude, ce qui suffit largement à freiner les abus en pratique). Pour passer
// à un compteur global multi-instance, on remplacera `store` par Upstash Redis
// sans changer l'API publique.

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

/**
 * Vérifie et incrémente le compteur pour une clé donnée.
 *
 * @param key     Identifiant logique unique (ex. `inviteUser:<userId>`).
 * @param limit   Nombre maximal d'appels autorisés dans la fenêtre.
 * @param windowMs Largeur de la fenêtre en ms.
 */
export function rateLimit(
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

/** Formatte le retry-after en secondes pour les messages d'erreur. */
export function retryAfterSeconds(resetMs: number): number {
  return Math.max(1, Math.ceil(resetMs / 1000));
}
