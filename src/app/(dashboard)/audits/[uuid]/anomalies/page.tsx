import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AnomaliesList, type AnomalyListItem } from "./anomalies-list";

export default async function AnomaliesPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const profile = await requireProfile();
  const { uuid } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("non_conformities")
    .select(
      `
      id, title, status, severity, created_at,
      criterion:criteria!inner(identifier, name),
      page:pages(name)
    `,
    )
    .eq("audit_id", uuid)
    .order("created_at", { ascending: false });

  const ncs: AnomalyListItem[] = (data ?? []).map((nc) => {
    const criterion = Array.isArray(nc.criterion) ? nc.criterion[0] : nc.criterion;
    const page = Array.isArray(nc.page) ? nc.page[0] : nc.page;
    return {
      id: nc.id as string,
      title: nc.title as string,
      status: nc.status as string,
      severity: nc.severity as AnomalyListItem["severity"],
      createdAt: nc.created_at as string,
      criterion: criterion
        ? { identifier: criterion.identifier as string, name: criterion.name as string }
        : null,
      page: page ? { name: page.name as string } : null,
    };
  });

  return <AnomaliesList ncs={ncs} auditId={uuid} role={profile.role} />;
}
