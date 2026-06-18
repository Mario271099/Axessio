"use client";

// Hook générique de brouillon basé sur localStorage. Conçu pour les
// formulaires longs où l'utilisateur risque de perdre sa saisie (NC,
// audit, etc.). Cycle de vie :
//   1. Au montage : lit `localStorage[key]`. Si présent et non expiré,
//      expose le brouillon via `available`. Le composant décide d'afficher
//      un banner « Reprendre ? ».
//   2. À chaque changement de `value` : debounce d'1 s puis écrit en
//      localStorage. Le timestamp `savedAt` permet d'afficher « il y a Xs ».
//   3. `clear()` supprime le brouillon (à appeler après submit OK).
//
// Volontairement minimal : pas de chiffrement (localStorage est cloisonné
// par origin, donc fine pour des brouillons UI), pas de fallback IndexedDB,
// pas de sync cross-tab (un seul onglet de saisie à la fois est l'usage
// normal). Les valeurs non sérialisables (`File`, `Date`) doivent être
// converties par l'appelant.

import { useEffect, useRef, useState } from "react";

// 7 jours - au-delà, le brouillon est considéré obsolète et silencieusement
// purgé. Évite d'accumuler des brouillons orphelins après abandon.
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// 1 s de debounce : assez court pour que « sauvegardé il y a 0 s » soit
// crédible, assez long pour ne pas marteler le storage à chaque keystroke.
const SAVE_DEBOUNCE_MS = 1_000;

interface StoredDraft<T> {
  value: T;
  savedAt: number;
}

interface UseDraftStorageResult<T> {
  /** Brouillon trouvé au montage (null si aucun ou expiré). */
  available: { value: T; savedAt: Date } | null;
  /** Acquitte le banner sans restaurer (le brouillon reste en storage). */
  dismissAvailable: () => void;
  /** Timestamp de la dernière sauvegarde réussie, ou null. */
  savedAt: Date | null;
  /** Supprime le brouillon (à appeler post-submit). */
  clear: () => void;
}

export function useDraftStorage<T>(
  key: string,
  currentValue: T,
  options: {
    /** Ne pas écrire si vrai (utile pour pauser pendant le submit). */
    paused?: boolean;
    /** Prédicat : si vide/intact, on ne sauvegarde pas. */
    shouldPersist?: (value: T) => boolean;
  } = {},
): UseDraftStorageResult<T> {
  const { paused = false, shouldPersist } = options;
  const [available, setAvailable] = useState<UseDraftStorageResult<T>["available"]>(
    null,
  );
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  // Suivi pour éviter le tout premier write (juste après le mount), qui
  // sinon écraserait le brouillon trouvé avant que l'utilisateur clique
  // « Reprendre ».
  const initializedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // Hydratation au montage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        initializedRef.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      if (
        !parsed ||
        typeof parsed.savedAt !== "number" ||
        Date.now() - parsed.savedAt > DRAFT_TTL_MS
      ) {
        window.localStorage.removeItem(key);
        initializedRef.current = true;
        return;
      }
      setAvailable({ value: parsed.value, savedAt: new Date(parsed.savedAt) });
      setSavedAt(new Date(parsed.savedAt));
    } catch {
      // localStorage peut throw (mode privé strict, quota). On échoue
      // silencieusement - le brouillon est une amélioration, pas un must.
    }
    initializedRef.current = true;
    // key est le seul vrai input ; le ré-exécuter au changement de key
    // permettrait de switcher de brouillon mais n'est pas un cas d'usage
    // ici (un audit = un key fixe).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistance debounced. On ne déclenche pas tant que l'hydratation
  // initiale n'est pas finie.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!initializedRef.current) return;
    if (paused) return;
    if (shouldPersist && !shouldPersist(currentValue)) return;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      try {
        const now = Date.now();
        const payload: StoredDraft<T> = { value: currentValue, savedAt: now };
        window.localStorage.setItem(key, JSON.stringify(payload));
        setSavedAt(new Date(now));
      } catch {
        // Ignore - voir commentaire d'hydratation.
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [key, currentValue, paused, shouldPersist]);

  function dismissAvailable() {
    setAvailable(null);
  }

  function clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
    setAvailable(null);
    setSavedAt(null);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return { available, dismissAvailable, savedAt, clear };
}
