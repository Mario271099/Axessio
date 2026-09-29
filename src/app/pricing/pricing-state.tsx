"use client";

import { createContext, useContext, useState } from "react";
import {
  featuresForNeeds,
  recommendPlan,
  type PlanNeedKey,
  type PlanNeeds,
} from "@/lib/billing/recommend-plan";
import type { PlanCode } from "@/lib/billing/plans";

export type BillingInterval = "monthly" | "yearly";

export interface PlanFinderInput {
  activeAudits: number;
  members: number;
  selected: ReadonlyArray<PlanNeedKey>;
}

interface PricingState {
  interval: BillingInterval;
  setInterval: (interval: BillingInterval) => void;
  input: PlanFinderInput;
  setInput: (input: PlanFinderInput) => void;
  needs: PlanNeeds;
  match: PlanCode;
}

const PricingContext = createContext<PricingState | null>(null);

export function usePricingState(): PricingState {
  const value = useContext(PricingContext);
  if (!value) {
    throw new Error("usePricingState doit être utilisé dans <PricingStateProvider>");
  }
  return value;
}

/**
 * État partagé de la page tarifs : période de facturation et besoins saisis
 * dans « Quel plan pour vous ? ». Les cartes et le tableau restent des Server
 * Components : ils rendent les deux périodes et l'étiquette « correspond »,
 * et ce conteneur n'expose que deux attributs (`data-interval`, `data-match`)
 * que leurs classes `group-data-[…]/pricing` lisent pour afficher le bon état.
 */
export function PricingStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [interval, setInterval] = useState<BillingInterval>("yearly");
  const [input, setInput] = useState<PlanFinderInput>({
    activeAudits: 1,
    members: 1,
    selected: [],
  });
  const needs: PlanNeeds = {
    activeAudits: input.activeAudits,
    members: input.members,
    features: featuresForNeeds(input.selected),
  };
  const match = recommendPlan(needs);

  return (
    <PricingContext
      value={{ interval, setInterval, input, setInput, needs, match }}
    >
      <div
        className="group/pricing"
        data-interval={interval}
        data-match={match}
      >
        {children}
      </div>
    </PricingContext>
  );
}
