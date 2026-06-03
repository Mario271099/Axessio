"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function dismissWelcome(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ welcome_dismissed_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}
