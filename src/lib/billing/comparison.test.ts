import { describe, expect, it } from "vitest";
import {
  COMPARISON_GROUPS,
  CORE_ROWS,
  planIncludesRow,
  rowsAddedByPlan,
} from "./comparison";
import { PLAN_ORDER, PLANS, previousPlan } from "./plans";

describe("COMPARISON_GROUPS", () => {
  it("montre chaque fonctionnalité du catalogue au moins une fois", () => {
    const shown = new Set(
      COMPARISON_GROUPS.flatMap((group) =>
        group.rows.flatMap((row) => (row.kind === "feature" ? row.features : [])),
      ),
    );
    const catalogue = new Set(
      PLAN_ORDER.flatMap((plan) => PLANS[plan].features),
    );
    for (const feature of catalogue) {
      expect(shown.has(feature), feature).toBe(true);
    }
  });

  it("montre chaque limite du catalogue", () => {
    const shown = COMPARISON_GROUPS.flatMap((group) =>
      group.rows.flatMap((row) => (row.kind === "limit" ? [row.limit] : [])),
    );
    expect(new Set(shown)).toEqual(new Set(Object.keys(PLANS.free.limits)));
  });

  it("a des clés de ligne uniques (clés i18n)", () => {
    const keys = COMPARISON_GROUPS.flatMap((g) => g.rows.map((r) => r.key));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("rowsAddedByPlan", () => {
  it("le premier plan affiche le socle", () => {
    expect(rowsAddedByPlan("free")).toEqual(CORE_ROWS);
  });

  it("chaque plan n'affiche que ce que le précédent n'a pas", () => {
    for (const plan of PLAN_ORDER) {
      const previous = previousPlan(plan);
      if (!previous) continue;
      for (const row of rowsAddedByPlan(plan)) {
        expect(planIncludesRow(plan, row)).toBe(true);
        expect(planIncludesRow(previous, row)).toBe(false);
      }
    }
  });

  it("Starter ajoute l'export PDF et le simulateur", () => {
    expect(rowsAddedByPlan("starter").map((r) => r.key)).toEqual([
      "exportPdf",
      "simulator",
    ]);
  });
});
