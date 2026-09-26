/**
 * Illustration de l'application sur la page d'accueil : la silhouette du
 * tableau de bord (sidebar, carte de score, tuiles, liste d'audits) et deux
 * cartes qui flottent autour. Volontairement sans aucun chiffre ni nom de
 * client : ce sont des formes, pas des données inventées. Décorative, donc
 * masquée des technologies d'assistance.
 */
export function HomeAppPreview() {
  return (
    <div
      aria-hidden="true"
      className="group relative hidden h-[480px] select-none lg:block"
    >
      {/* Fenêtre principale */}
      <div className="absolute left-6 top-6 flex h-[400px] w-[600px] overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-float transition-transform duration-500 ease-lift group-hover:[transform:perspective(1600px)_rotateY(-4deg)_rotateX(2deg)]">
        {/* Sidebar */}
        <div className="flex w-[140px] shrink-0 flex-col gap-1.5 border-r border-border p-3.5">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="size-4 rounded bg-primary" />
            <span className="h-2 w-14 rounded-full bg-secondary" />
          </div>
          <span className="h-6 rounded-md bg-primary" />
          <span className="h-6 rounded-md bg-secondary" />
          <span className="h-6 rounded-md bg-secondary" />
          <span className="h-6 rounded-md bg-secondary" />
        </div>

        {/* Contenu */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 bg-background p-4">
          <span className="h-3 w-28 rounded-full bg-border-strong" />

          <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2.5">
            {/* Carte encre : anneau de score */}
            <div className="flex items-center gap-2.5 rounded-row bg-ink p-2.5">
              <svg viewBox="0 0 120 120" className="size-12 shrink-0">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="hsl(var(--ink-surface-raised))"
                  strokeWidth="14"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="hsl(var(--highlight))"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray="314"
                  strokeDashoffset="91"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="h-2.5 w-10 rounded-full bg-ink-muted/70" />
                <span className="h-2 w-12 rounded-full bg-ink-muted/40" />
              </span>
            </div>

            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-1.5 rounded-row border border-border bg-card p-2.5"
              >
                <span className="h-3.5 w-8 rounded bg-secondary" />
                <span className="h-2 w-full rounded-full bg-secondary" />
              </div>
            ))}
          </div>

          {/* Liste d'audits */}
          <div className="flex flex-col gap-2 rounded-row border border-border bg-card p-2.5">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="grid grid-cols-[26px_1fr_60px_34px] items-center gap-2.5"
              >
                <span
                  className="size-[26px] rounded-lg"
                  style={{ background: `var(--theme-${row + 5})` }}
                />
                <span className="h-2 w-full rounded-full bg-secondary" />
                <span className="flex gap-0.5">
                  <span className="h-1 flex-1 rounded-full bg-primary" />
                  <span className="h-1 flex-1 rounded-full bg-primary" />
                  <span className="h-1 flex-1 rounded-full bg-border" />
                  <span className="h-1 flex-1 rounded-full bg-border" />
                </span>
                <span className="h-2 w-full rounded-full bg-border-strong" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carte flottante : non-conformité */}
      <div className="absolute -left-4 bottom-0 w-[260px] rounded-[1.125rem] border border-border bg-card p-4 shadow-float transition-transform duration-500 ease-lift group-hover:-translate-x-3.5 group-hover:-translate-y-2.5">
        <span className="flex items-center gap-2">
          <span
            className="rounded-md px-2 py-1 text-xs font-extrabold text-white"
            style={{ background: "var(--theme-11)" }}
          >
            11.1
          </span>
          <span className="rounded-lg bg-severity-critical-bg px-2 py-1 text-xs font-extrabold text-severity-critical">
            ●
          </span>
        </span>
        <span className="mt-2.5 block h-2.5 w-full rounded-full bg-secondary" />
        <span className="mt-1.5 block h-2.5 w-2/3 rounded-full bg-secondary" />
        <span className="mt-3 flex items-center gap-2">
          <span className="size-5 rounded-full bg-highlight" />
          <span className="h-2 w-24 rounded-full bg-border-strong" />
        </span>
      </div>

      {/* Carte flottante : simulation */}
      <div className="absolute -right-2 top-0 w-[210px] rounded-[1.125rem] bg-primary p-4 text-primary-foreground shadow-float transition-transform duration-500 ease-lift group-hover:translate-x-3.5 group-hover:translate-y-3">
        <span className="block h-2 w-20 rounded-full bg-primary-foreground/40" />
        <span className="mt-2.5 block h-5 w-32 rounded-full bg-primary-foreground/80" />
        <span className="mt-2 block h-2 w-24 rounded-full bg-primary-foreground/40" />
      </div>
    </div>
  );
}
