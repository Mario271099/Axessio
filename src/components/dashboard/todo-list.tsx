import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ListChecks,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Idem KpiCard : on évite de passer un composant Lucide depuis le Server.
// L'icône est résolue ici via une clé sérialisable.
export type TodoIconKey = "clock" | "list-checks" | "user-plus";

const iconRegistry = {
  clock: Clock,
  "list-checks": ListChecks,
  "user-plus": UserPlus,
} as const;

export interface TodoItem {
  key: string;
  iconKey: TodoIconKey;
  label: string;
  count: number;
  href: string;
  tone: "warning" | "primary" | "violet";
}

const toneClasses: Record<TodoItem["tone"], string> = {
  warning: "bg-warning/10 text-warning",
  primary: "bg-primary/10 text-primary",
  violet: "bg-violet-500/10 text-violet-500",
};

export function TodoList({ items }: { items: TodoItem[] }) {
  const visible = items.filter((it) => it.count > 0);
  return (
    <Card className="bg-secondary/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden="true" />À
          faire
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success"
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Tout est à jour</p>
            <p className="text-xs text-muted-foreground">
              Aucune action en attente.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((item) => {
              const Icon = iconRegistry[item.iconKey];
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 transition-colors hover:border-border hover:bg-accent/40"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        toneClasses[item.tone],
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold tabular-nums">
                          {item.count}
                        </span>{" "}
                        {item.label}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      Voir
                      <ArrowRight
                        className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
