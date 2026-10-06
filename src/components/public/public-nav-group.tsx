"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroupItem } from "@/components/public/public-nav-links";

/**
 * Sous-menu de la navigation publique, en motif « disclosure » (bouton
 * aria-expanded + liste de liens), recommandé par l'APG pour une navigation
 * de site plutôt qu'un role="menu".
 *
 * Clavier : Entrée / Espace ouvrent et ferment ; Flèche bas ouvre et entre
 * dans la liste ; Flèches haut / bas, Début / Fin parcourent les liens ;
 * Échap referme et rend le focus au bouton. Le panneau se ferme aussi au clic
 * extérieur et quand le focus quitte le groupe.
 *
 * Les liens restent dans le HTML même fermé (`hidden`) : les moteurs les
 * suivent, et aria-controls pointe toujours vers un élément existant.
 */
export function PublicNavGroup({
  label,
  items,
  currentHref,
  triggerClassName,
}: {
  label: string;
  items: ReadonlyArray<NavGroupItem>;
  currentHref?: string;
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasCurrent = items.some((item) => item.href === currentHref);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function links(): HTMLAnchorElement[] {
    return Array.from(rootRef.current?.querySelectorAll("a") ?? []);
  }

  function focusLink(index: number) {
    const list = links();
    if (list.length === 0) return;
    list[(index + list.length) % list.length]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = links();
    const current = list.indexOf(document.activeElement as HTMLAnchorElement);

    switch (event.key) {
      case "Escape":
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!open) {
          setOpen(true);
          // Le panneau n'est focalisable qu'après le rendu.
          requestAnimationFrame(() => focusLink(0));
        } else {
          focusLink(current + 1);
        }
        break;
      case "ArrowUp":
        if (!open) return;
        event.preventDefault();
        focusLink(current <= 0 ? list.length - 1 : current - 1);
        break;
      case "Home":
        if (!open || current < 0) return;
        event.preventDefault();
        focusLink(0);
        break;
      case "End":
        if (!open || current < 0) return;
        event.preventDefault();
        focusLink(list.length - 1);
        break;
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        data-active={hasCurrent || undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(triggerClassName, "gap-1")}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute left-1/2 top-full z-40 mt-3 w-80 -translate-x-1/2 rounded-hero border border-border bg-card p-2 shadow-float"
      >
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const isCurrent = item.href === currentHref;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-xl px-3.5 py-2.5 transition-colors",
                    isCurrent
                      ? "bg-primary-soft"
                      : "hover:bg-primary-softer focus-visible:bg-primary-softer",
                  )}
                >
                  <span
                    className={cn(
                      "text-[0.95rem] font-extrabold",
                      isCurrent ? "text-primary" : "text-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="text-sm leading-snug text-secondary-foreground">
                    {item.desc}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
