import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";

interface Props {
  title: string;
  lastUpdated: string;
  intro?: string;
  children: React.ReactNode;
}

export function LegalShell({ title, lastUpdated, intro, children }: Props) {
  return (
    <>
      <PublicHeader />
      <main
        id="main"
        tabIndex={-1}
        className="container mx-auto max-w-3xl px-6 py-12 md:py-16"
      >
        <article className="prose-axessio">
          <header className="space-y-3 border-b border-border pb-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{lastUpdated}</p>
          </header>

          {intro && (
            <p className="mt-8 text-base leading-relaxed text-muted-foreground">
              {intro}
            </p>
          )}

          <div className="mt-8 space-y-10">{children}</div>
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
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {lines.map((line, i) => (
        <p key={i} className="text-sm leading-relaxed text-foreground/90">
          {line}
        </p>
      ))}
    </section>
  );
}
