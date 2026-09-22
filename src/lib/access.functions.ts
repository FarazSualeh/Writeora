import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function requireAdmin(accessToken: string) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !authData.user) throw new Error("You must be signed in to manage contributors.");

  const { data: role, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !role) throw new Error("Only admins can manage contributors.");
  return authData.user;
}

export const inviteContributor = createServerFn({ method: "POST" })
  .validator((data: { email: string; redirectTo: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const admin = await requireAdmin(data.accessToken);

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo: data.redirectTo,
      },
    );
    if (inviteError && !inviteError.message.toLowerCase().includes("already registered")) {
      throw new Error(inviteError.message);
    }

    const { error: recordError } = await supabaseAdmin
      .from("invites")
      .upsert(
        { email: normalizedEmail, role: "author", invited_by: admin.id },
        { onConflict: "email" },
      );
    if (recordError) throw new Error(recordError.message);

    if (inviteError) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", normalizedEmail)
        .maybeSingle();
      if (profileError || !profile) throw new Error("The existing account could not be granted access.");

      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: profile.id, role: "author" }, { onConflict: "user_id,role" });
      if (roleInsertError) throw new Error(roleInsertError.message);
    }

    return { email: normalizedEmail, alreadyRegistered: Boolean(inviteError) };
  });

export const revokeContributor = createServerFn({ method: "POST" })
  .validator((data: { email: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const normalizedEmail = data.email.trim().toLowerCase();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);

    if (profile) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", profile.id)
        .eq("role", "author");
      if (roleError) throw new Error(roleError.message);
    }

    const { error: inviteError } = await supabaseAdmin
      .from("invites")
      .delete()
      .eq("email", normalizedEmail);
    if (inviteError) throw new Error(inviteError.message);
  });
