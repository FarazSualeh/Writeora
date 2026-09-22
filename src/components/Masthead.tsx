import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function Masthead() {
  const { user, isAuthor } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const displayName =
    meta["full_name"] || meta["name"] || user?.email?.split("@")[0] || "Reader";
  const avatarUrl = meta["avatar_url"] || meta["picture"] || null;
  const initial = displayName.charAt(0).toUpperCase();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="mx-auto max-w-[90rem] px-6 pt-8 sm:px-8 lg:px-12 lg:pt-12">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-rule pb-5">
        <Link
          to="/"
          className="font-display text-3xl font-semibold leading-none tracking-tight text-ink sm:text-4xl"
        >
          Writeora
        </Link>
        <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto text-sm text-muted-foreground md:order-none md:w-auto md:gap-8">
          <Link to="/articles" className="underline-reveal" activeProps={{ className: "text-ink" }}>
            Articles
          </Link>
          <Link to="/archive" className="underline-reveal" activeProps={{ className: "text-ink" }}>
            Archive
          </Link>
          <Link to="/about" className="underline-reveal" activeProps={{ className: "text-ink" }}>
            About
          </Link>
          {isAuthor ? (
            <Link
              to="/dashboard"
              className="underline-reveal"
              activeProps={{ className: "text-ink" }}
            >
              Desk
            </Link>
          ) : null}
          {user && !isAuthor ? (
            <Link
              to="/reading"
              className="whitespace-nowrap underline-reveal"
              activeProps={{ className: "text-ink" }}
            >
              Last read
            </Link>
          ) : null}
        </nav>
        {user ? (
          <div className="order-2 flex items-center gap-3 md:order-none">
            <span className="hidden text-sm text-ink sm:inline">{displayName}</span>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="size-9 rounded-full object-cover outline-1 -outline-offset-1 outline-black/10"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-ink">
                {initial}
              </span>
            )}
            <button
              type="button"
              onClick={signOut}
              className="border border-rule px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="order-2 border border-accent bg-accent px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-paper transition-transform hover:-translate-y-0.5 md:order-none"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
