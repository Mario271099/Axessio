import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand";
import { SUPPORTED_STANDARDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  /** Slot principal du formulaire. */
  children: React.ReactNode;
  /** Texte d'invite au-dessus du formulaire (sous-titre h1). */
  title: string;
  subtitle: string;
  /** Texte du footer (sous le formulaire). */
  footer?: React.ReactNode;
  /**
   * Écran courant. « login » et « register » affichent le sélecteur en haut
   * et changent le panneau de droite ; « plain » est pour les écrans de mot
   * de passe, qui ne font pas partie du va-et-vient connexion / inscription.
   */
  variant?: "login" | "register" | "plain";
  /** Destination de l'onglet « Se connecter » (peut porter un ?next=…). */
  loginHref?: string;
  /** Destination de l'onglet « Créer un compte » (peut porter un ?plan=…). */
  registerHref?: string;
}

const BENEFIT_KEYS = [
  "compliance",
  "criteria",
  "reports",
  "collaboration",
] as const;

const STEP_KEYS = ["workspace", "team", "audit"] as const;

const LEGAL_LINKS = [
  { href: "/legal", key: "legal" },
  { href: "/privacy", key: "privacy" },
  { href: "/accessibility", key: "accessibility" },
] as const;

export function AuthLayout({
  children,
  title,
  subtitle,
  footer,
  variant = "plain",
  loginHref = "/login",
  registerHref = "/register",
}: AuthLayoutProps) {
  const tMarketing = useTranslations("auth.marketing");
  const tSwitch = useTranslations("auth.switch");
  const tFooter = useTranslations("home.footer.links");
  const tSidebar = useTranslations("sidebar");
  const isRegister = variant === "register";

  return (
    <main
      id="main"
      tabIndex={-1}
      className="grid min-h-screen grid-cols-1 bg-card lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]"
    >
      {/* Panneau gauche - formulaire ------------------------------------ */}
      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Link
          href="/"
          aria-label={tSidebar("brandHomeAria")}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg"
        >
          <Logo size="lg" />
        </Link>

        <div className="fade-in-up mx-auto flex w-full max-w-md flex-col gap-5 py-10 lg:my-auto">
          {/* Sélecteur connexion / création de compte. Ce sont deux pages,
              donc deux liens : chacune garde son adresse. */}
          {variant !== "plain" && (
            <nav aria-label={tSwitch("aria")}>
              <ul className="grid grid-cols-2 gap-1 rounded-[0.875rem] bg-secondary p-1">
                <SwitchTab
                  href={loginHref}
                  current={variant === "login"}
                  label={tSwitch("login")}
                />
                <SwitchTab
                  href={registerHref}
                  current={isRegister}
                  label={tSwitch("register")}
                />
              </ul>
            </nav>
          )}

          <header>
            <h1 className="text-[2rem] font-black leading-[1.05] tracking-[-0.035em] md:text-[2.25rem]">
              {title}
            </h1>
            <p className="mt-2 text-base text-muted-foreground md:text-[1.05rem]">
              {subtitle}
            </p>
          </header>

          {children}

          {footer && <p className="text-sm text-muted-foreground">{footer}</p>}
        </div>

        <p className="mt-auto flex flex-wrap gap-x-1.5 gap-y-1 pt-8 text-[0.8rem] text-muted-foreground">
          {LEGAL_LINKS.map((link, index) => (
            <span key={link.href}>
              <Link
                href={link.href}
                className="rounded underline decoration-1 underline-offset-4 hover:text-foreground"
              >
                {tFooter(link.key)}
              </Link>
              {index < LEGAL_LINKS.length - 1 && ","}
            </span>
          ))}
        </p>
      </section>

      {/* Panneau droit - présentation ------------------------------------ */}
      <aside
        aria-hidden="true"
        className="relative m-4 hidden overflow-hidden rounded-[1.75rem] bg-cobalt p-14 text-cobalt-foreground lg:flex lg:flex-col lg:justify-center"
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
            {isRegister
              ? tMarketing("registerTagline")
              : tMarketing("tagline")}
          </p>

          {isRegister ? (
            // Inscription : les trois étapes qui suivent la création du compte.
            <ol className="mt-9 flex flex-col gap-1">
              {STEP_KEYS.map((key, i) => (
                <li
                  key={key}
                  className="fade-in-up group flex items-start gap-4 rounded-card p-3.5 transition-colors hover:bg-white/10"
                  style={{ animationDelay: `${100 + i * 80}ms` }}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cobalt-foreground text-[1.05rem] font-black text-primary transition-[transform,border-radius] duration-300 ease-bounce group-hover:-rotate-[8deg] group-hover:rounded-full">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[1.05rem] font-extrabold">
                      {tMarketing(`registerSteps.${key}.title`)}
                    </span>
                    <span className="text-[0.95rem] text-cobalt-foreground/85">
                      {tMarketing(`registerSteps.${key}.desc`)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            // Connexion : ce que la plateforme couvre.
            <>
              <p className="mt-4 max-w-[44ch] text-[1.05rem] leading-relaxed text-cobalt-foreground/85">
                {tMarketing("subtitle")}
              </p>

              <ul className="mt-9 flex flex-col gap-3">
                {BENEFIT_KEYS.map((key, i) => (
                  <li
                    key={key}
                    className="fade-in-up flex items-center gap-3"
                    style={{ animationDelay: `${100 + i * 80}ms` }}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cobalt-foreground/15">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-base font-semibold">
                      {tMarketing(`benefits.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-12 flex flex-wrap gap-2">
            {SUPPORTED_STANDARDS.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-cobalt-foreground/25 px-3 py-1 text-sm font-bold tabular text-cobalt-foreground/90"
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

/** Onglet du sélecteur : une pastille blanche marque la page courante. */
function SwitchTab({
  href,
  current,
  label,
}: {
  href: string;
  current: boolean;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "flex h-[42px] items-center justify-center rounded-[0.625rem] text-[0.95rem] font-extrabold transition-colors",
          current
            ? "bg-card text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
      </Link>
    </li>
  );
}
