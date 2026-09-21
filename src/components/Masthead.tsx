import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function Masthead() {
  const { user, isAuthor } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="mx-auto max-w-[90rem] px-6 pt-8 sm:px-8 lg:px-12 lg:pt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-4 border-b border-rule pb-5">
        <Link
          to="/"
          className="font-display text-3xl font-semibold leading-none tracking-tight text-ink sm:text-4xl"
        >
          Writeora
        </Link>
        <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto text-sm text-muted-foreground md:order-none md:w-auto md:gap-8">
          <Link
            to="/"
            className="underline-reveal"
            activeProps={{ className: "text-ink" }}
            activeOptions={{ exact: true }}
          >
            Essays
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
        </nav>
        {user ? (
          <button
            type="button"
            onClick={signOut}
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground underline-reveal"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/auth"
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground underline-reveal"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
