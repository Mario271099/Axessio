import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand";

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

const VERSION_BADGES = ["RGAA 4.1.2", "WCAG 2.2", "RAWeb 1.1", "RAAM 1.1"];

export function AuthLayout({
  children,
  title,
  subtitle,
  footer,
}: AuthLayoutProps) {
  const tMarketing = useTranslations("auth.marketing");
  const tSidebar = useTranslations("sidebar");

  return (
    <main
      id="main"
      tabIndex={-1}
      className="grid min-h-screen grid-cols-1 bg-card lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]"
    >
      {/* Panneau gauche - formulaire ------------------------------------ */}
      <section className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="fade-in-up mx-auto w-full max-w-md">
          <Link
            href="/"
            aria-label={tSidebar("brandHomeAria")}
            className="inline-flex items-center gap-2 rounded-lg"
          >
            <Logo size="lg" />
          </Link>

          <header className="mt-10">
            <h1 className="text-[2rem] font-black leading-[1.05] tracking-[-0.035em] md:text-[2.375rem]">
              {title}
            </h1>
            <p className="mt-2.5 text-base text-muted-foreground md:text-[1.05rem]">
              {subtitle}
            </p>
          </header>

          <div className="mt-8">{children}</div>

          {footer && (
            <p className="mt-8 text-sm text-muted-foreground">{footer}</p>
          )}
        </div>
      </section>

      {/* Panneau droit - présentation ------------------------------------ */}
      <aside
        aria-hidden="true"
        className="relative m-4 hidden overflow-hidden rounded-[1.75rem] bg-primary p-14 text-primary-foreground lg:flex lg:flex-col lg:justify-center"
      >
        {/* Formes géométriques de la marque, purement décoratives. */}
        <svg
          viewBox="0 0 760 760"
          className="pointer-events-none absolute -bottom-64 -right-56 h-[760px] w-[760px] opacity-[0.14]"
        >
          <g fill="currentColor">
            <rect x="0" y="0" width="360" height="360" rx="80" />
            <circle cx="580" cy="180" r="180" />
            <rect x="0" y="400" width="360" height="360" rx="80" />
            <rect
              x="400"
              y="400"
              width="360"
              height="360"
              rx="80"
              opacity="0.5"
            />
          </g>
        </svg>

        <div className="relative max-w-[34rem]">
          <p className="max-w-[15ch] text-[2.25rem] font-black leading-[1.05] tracking-[-0.035em] xl:text-[2.75rem]">
            {tMarketing("tagline")}
          </p>
          <p className="mt-4 max-w-[44ch] text-[1.05rem] leading-relaxed text-primary-foreground/85">
            {tMarketing("subtitle")}
          </p>

          <ul className="mt-9 flex flex-col gap-3">
            {BENEFIT_KEYS.map((key, i) => (
              <li
                key={key}
                className="fade-in-up flex items-center gap-3"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-base font-semibold">
                  {tMarketing(`benefits.${key}`)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-2">
            {VERSION_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-primary-foreground/25 px-3 py-1 text-sm font-bold text-primary-foreground/90"
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
