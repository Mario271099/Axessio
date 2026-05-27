"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";
import {
  generateWebhookSecret,
  WEBHOOK_EVENTS,
  type WebhookEventType,
} from "@/lib/webhooks/server";

export interface WebhookActionResult {
  error: string | null;
  success?: boolean;
  endpointId?: string;
  secret?: string;
}

async function requireOrgAdminAndFeature(
  organizationId: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const t = await getTranslations("errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("notAuthenticated") };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { ok: false, error: t("forbidden") };
  }

  const enabled = await orgHasFeature("webhooks.outgoing");
  if (!enabled) return { ok: false, error: t("planUpgradeRequired") };

  return { ok: true, userId: user.id };
}

export async function createWebhookEndpoint(
  organizationId: string,
  formData: FormData,
): Promise<WebhookActionResult> {
  const t = await getTranslations("errors");

  const guard = await requireOrgAdminAndFeature(organizationId);
  if (!guard.ok) return { error: guard.error };

  const url = (formData.get("url") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const eventsRaw = formData.getAll("events").map(String);

  if (!/^https?:\/\//i.test(url)) return { error: t("invalidUrl") };

  const events: WebhookEventType[] = eventsRaw.filter((e): e is WebhookEventType =>
    (WEBHOOK_EVENTS as readonly string[]).includes(e),
  );
  if (events.length === 0) return { error: t("noEventSelected") };

  const supabase = await createClient();
  const secret = generateWebhookSecret();

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .insert({
      organization_id: organizationId,
      url,
      description: description.length > 0 ? description : null,
      secret,
      subscribed_events: events,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/organizations/${organizationId}/webhooks`);
  return { error: null, success: true, endpointId: data.id, secret };
}

export async function toggleWebhookEndpoint(
  organizationId: string,
  endpointId: string,
  active: boolean,
): Promise<WebhookActionResult> {
  const guard = await requireOrgAdminAndFeature(organizationId);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("webhook_endpoints")
    .update({ is_active: active })
    .eq("id", endpointId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  revalidatePath(`/organizations/${organizationId}/webhooks`);
  return { error: null, success: true };
}

export async function deleteWebhookEndpoint(
  organizationId: string,
  endpointId: string,
): Promise<WebhookActionResult> {
  const guard = await requireOrgAdminAndFeature(organizationId);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", endpointId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  revalidatePath(`/organizations/${organizationId}/webhooks`);
  return { error: null, success: true };
}

export async function rotateWebhookSecret(
  organizationId: string,
  endpointId: string,
): Promise<WebhookActionResult> {
  const guard = await requireOrgAdminAndFeature(organizationId);
  if (!guard.ok) return { error: guard.error };

  const supabase = await createClient();
  const secret = generateWebhookSecret();
  const { error } = await supabase
    .from("webhook_endpoints")
    .update({ secret })
    .eq("id", endpointId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  revalidatePath(`/organizations/${organizationId}/webhooks`);
  return { error: null, success: true, secret };
}
