import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { inviteContributor } from "@/lib/access.functions";
import { supabase } from "@/integrations/supabase/client";

type Invite = { id: string; email: string; accepted_at: string | null };
type Contributor = { user_id: string; email: string | null; display_name: string };

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAccess() {
    const [{ data: inviteData, error: inviteError }, { data: roleData, error: roleError }] =
      await Promise.all([
        supabase
          .from("invites")
          .select("id, email, accepted_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id").eq("role", "author"),
      ]);
    if (inviteError || roleError) {
      setError(inviteError?.message ?? roleError?.message ?? "Unable to load access.");
      return;
    }
    setInvites((inviteData ?? []) as Invite[]);
    const ids = (roleData ?? []).map((role) => role.user_id);
    if (!ids.length) {
      setContributors([]);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", ids);
    setContributors(
      (profiles ?? []).map((profile) => ({
        user_id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
      })),
    );
  }

  useEffect(() => {
    if (isAdmin) void loadAccess();
  }, [isAdmin]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    try {
      const result = await inviteContributor({
        data: { email: normalizedEmail, redirectTo: window.location.origin, accessToken },
      });
      setMessage(
        result.alreadyRegistered
          ? `${normalizedEmail} already has an account; access was recorded.`
          : `Invitation sent to ${normalizedEmail}.`,
      );
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to send invitation.");
      return;
    }
    setEmail("");
    await loadAccess();
  }

  async function revokeInvite(id: string) {
    const { error: revokeError } = await supabase.from("invites").delete().eq("id", id);
    if (revokeError) setError(revokeError.message);
    else await loadAccess();
  }

  async function removeContributor(userId: string) {
    const { error: removeError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "author");
    if (removeError) setError(removeError.message);
    else await loadAccess();
  }

  if (authLoading) return <main className="mx-auto max-w-3xl px-6 py-20">Loading the desk...</main>;
  if (!user || !isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8 lg:px-12">
        <h1 className="font-display text-5xl text-ink">Admin access required.</h1>
        <Link
          to="/auth"
          className="mt-6 inline-block text-sm font-medium text-accent underline-reveal"
        >
          Sign in to continue
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
        The Writeora desk
      </p>
      <h1 className="mt-4 font-display text-5xl text-ink">Publishing access</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
        Invite writers by email. They can create an account with that address and receive author
        access.
      </p>
      <form
        onSubmit={invite}
        className="mt-10 flex flex-col gap-3 border-y border-rule py-6 sm:flex-row"
      >
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="writer@example.com"
          className="min-w-0 flex-1 border border-rule bg-card px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper"
        >
          Invite contributor
        </button>
      </form>
      {message ? (
        <p className="mt-4 text-sm text-accent" role="status">
          {message}
        </p>
      ) : null}
      <p className="mt-3 text-sm text-muted-foreground">
        The contributor receives a Supabase invitation email and gets author access after joining.
      </p>
      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <section className="mt-12">
        <h2 className="font-display text-3xl text-ink">Invitations</h2>
        <div className="mt-4 divide-y divide-rule border-y border-rule">
          {invites.length ? (
            invites.map((inviteItem) => (
              <div
                key={inviteItem.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
              >
                <span className="text-ink">
                  {inviteItem.email}{" "}
                  <span className="ml-2 text-muted-foreground">
                    {inviteItem.accepted_at ? "Joined" : "Pending"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void revokeInvite(inviteItem.id)}
                  className="text-accent underline-reveal"
                >
                  Revoke invite
                </button>
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No invitations yet.</p>
          )}
        </div>
      </section>
      <section className="mt-12">
        <h2 className="font-display text-3xl text-ink">Contributors</h2>
        <div className="mt-4 divide-y divide-rule border-y border-rule">
          {contributors.length ? (
            contributors.map((contributor) => (
              <div
                key={contributor.user_id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
              >
                <span className="text-ink">{contributor.email ?? contributor.display_name}</span>
                <button
                  type="button"
                  onClick={() => void removeContributor(contributor.user_id)}
                  className="text-accent underline-reveal"
                >
                  Remove access
                </button>
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No active contributors yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
