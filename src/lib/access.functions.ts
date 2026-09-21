import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const inviteContributor = createServerFn({ method: "POST" })
  .validator((data: { email: string; redirectTo: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(data.accessToken);
    if (authError || !authData.user)
      throw new Error("You must be signed in to invite contributors.");

    const { data: role, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !role) throw new Error("Only admins can invite contributors.");

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
        { email: normalizedEmail, role: "author", invited_by: authData.user.id },
        { onConflict: "email" },
      );
    if (recordError) throw new Error(recordError.message);

    return { email: normalizedEmail, alreadyRegistered: Boolean(inviteError) };
  });
