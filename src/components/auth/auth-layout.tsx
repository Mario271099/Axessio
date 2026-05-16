import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AxIcon } from "@/components/brand";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  /** Slot principal du formulaire. */
  children: React.ReactNode;
  /** Texte d'invite au-dessus du formulaire (sous-titre h1). */
  title: string;
  subtitle: string;
  /** Texte du footer (sous le formulaire). */
  footer?: React.ReactNode;
}

const BENEFIT_KEYS = [
  "compliance",
  "criteria",
  "reports",
  "collaboration",
] as const;

const VERSION_BADGES = [
  "RGAA 4.1.2",
  "WCAG 2.2",
  "RAWeb 1.0",
  "RAAM 1.0",
];

export function AuthLayout({
  children,
  title,
  subtitle,
  footer,
}: AuthLayoutProps) {
  const tMarketing = useTranslations("auth.marketing");
  const tSidebar = useTranslations("sidebar");

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Panneau gauche — formulaire ------------------------------------ */}
      <section className="flex min-h-screen flex-col justify-center bg-background px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md fade-in-up">
          <Link
            href="/"
            aria-label={tSidebar("brandHomeAria")}
            className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <AxIcon size={36} aria-label="" />
            <span className="text-lg font-bold tracking-tight">Axessio</span>
          </Link>

          <header className="mt-10 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              {subtitle}
            </p>
          </header>

          <div className="mt-8">{children}</div>

          {footer && (
            <p className="mt-8 text-sm text-muted-foreground">{footer}</p>
          )}
        </div>
      </section>

      {/* Panneau droit — présentation ------------------------------------ */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-violet-600 lg:flex lg:flex-col lg:justify-center lg:p-12 dark:from-primary/80 dark:to-violet-700"
      >
        {/* Pattern de points */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Glow radial doux en haut à droite */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]"
        />

        <div className="relative max-w-lg">
          <p className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {tMarketing("tagline")}
          </p>
          <p className="mt-4 text-lg text-white/80">
            {tMarketing("subtitle")}
          </p>

          <ul className="mt-8 space-y-3">
            {BENEFIT_KEYS.map((key, i) => (
              <li
                key={key}
                className={cn(
                  "fade-in-up flex items-center gap-3 text-white",
                )}
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-white"
                  aria-hidden="true"
                />
                <span className="text-base">
                  {tMarketing(`benefits.${key}`)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-2">
            {VERSION_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-xs text-white/80"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
