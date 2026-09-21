import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Writeora" },
      {
        name: "description",
        content: "Sign in to your Writeora desk to write and manage essays.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage("Check your email to confirm your account, then come back to sign in.");
      setLoading(false);
      return;
    }

    await navigate({ to: "/" });
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-15rem)] max-w-[90rem] items-center gap-12 px-6 py-16 sm:px-8 lg:grid-cols-2 lg:gap-24 lg:px-12">
      <section>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">The Writeora desk</p>
        <h1 className="mt-5 max-w-[11ch] font-display text-5xl font-medium leading-[0.95] text-ink sm:text-7xl">
          Make space for the work.
        </h1>
        <p className="mt-6 max-w-md text-xl leading-relaxed text-muted-foreground">
          Sign in to write, edit, and publish thoughtful work for a curious audience.
        </p>
        <Link to="/" className="mt-8 inline-block text-sm font-medium text-accent underline-reveal">
          Back to the front page
        </Link>
      </section>

      <section className="border-t border-rule pt-8 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
        <div className="flex gap-6 border-b border-rule">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`pb-3 text-sm font-medium ${mode === "sign-in" ? "border-b-2 border-accent text-ink" : "text-muted-foreground"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`pb-3 text-sm font-medium ${mode === "sign-up" ? "border-b-2 border-accent text-ink" : "text-muted-foreground"}`}
          >
            Create account
          </button>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm text-ink">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 block w-full border border-rule bg-card px-4 py-3 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block text-sm text-ink">
            Password
            <input
              required
              minLength={6}
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 block w-full border border-rule bg-card px-4 py-3 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          {message ? <p className="text-sm text-accent" role="status">{message}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Working..." : mode === "sign-in" ? "Enter the desk" : "Create your account"}
          </button>
        </form>
      </section>
    </main>
  );
}
