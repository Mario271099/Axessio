import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";

interface Props {
  title: string;
  lastUpdated: string;
  intro?: string;
  children: React.ReactNode;
}

/**
 * Coque des pages légales (mentions, confidentialité, cookies, déclaration
 * d'accessibilité). Pas de maquette dédiée : on applique les principes du
 * design system — texte dans une carte blanche posée sur le fond gris-bleu,
 * titres en 900, corps en 16 px pour de la lecture longue.
 */
export function LegalShell({ title, lastUpdated, intro, children }: Props) {
  return (
    <>
      <PublicHeader />
      <main
        id="main"
        tabIndex={-1}
        className="bg-background px-6 py-10 md:py-14 lg:px-9"
      >
        <article className="container mx-auto max-w-3xl rounded-hero border border-border bg-card p-6 md:p-10">
          <header className="border-b border-border pb-7">
            <h1 className="text-[2rem] font-black leading-[1.08] tracking-[-0.035em] md:text-[2.5rem]">
              {title}
            </h1>
            <p className="mt-2.5 text-[0.95rem] text-muted-foreground">
              {lastUpdated}
            </p>
          </header>

          {intro && (
            <p className="mt-7 text-[1.05rem] leading-relaxed text-secondary-foreground">
              {intro}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-9">{children}</div>
        </article>
      </main>
      <PublicFooter />
    </>
  );
}

interface SectionProps {
  title: string;
  lines: string[];
}

export function LegalSection({ title, lines }: SectionProps) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[1.3rem] font-extrabold tracking-[-0.025em]">
        {title}
      </h2>
      {lines.map((line, i) => (
        <p
          key={i}
          className="max-w-[68ch] text-base leading-relaxed text-secondary-foreground"
        >
          {line}
        </p>
      ))}
    </section>
  );
}
