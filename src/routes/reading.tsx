import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clearReadingHistory, getReadingHistory, type ReadEntry } from "@/lib/reading-history";
import { formatDate } from "@/components/ArticleCard";
import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/reading")({
  head: () => ({
    meta: [
      { title: "Last read | Writeora" },
      {
        name: "description",
        content: "The Writeora essays and deep dives you opened most recently, kept in order.",
      },
      { property: "og:title", content: "Last read | Writeora" },
      {
        property: "og:description",
        content: "The Writeora essays and deep dives you opened most recently, kept in order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReadingPage,
});

function ReadingPage() {
  const [entries, setEntries] = useState<ReadEntry[]>([]);

  useEffect(() => {
    setEntries(getReadingHistory());
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:px-8 lg:px-12 lg:py-20">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">Your shelf</p>
      <h1 className="mt-4 font-display text-5xl font-medium leading-[0.98] text-ink sm:text-6xl">
        Last read
      </h1>

      {entries.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          Nothing here yet.{" "}
          <Link to="/articles" className="text-accent underline-reveal">
            Start reading
          </Link>{" "}
          and your recent pieces will appear on this page.
        </p>
      ) : (
        <>
          <ul className="mt-10 divide-y divide-rule border-y border-rule">
            {entries.map((entry) => (
              <li key={entry.slug} className="flex items-start gap-5 py-5">
                {entry.cover_image_url ? (
                  <SafeImage
                    src={entry.cover_image_url}
                    alt=""
                    loading="lazy"
                    className="size-20 shrink-0 rounded-md object-cover outline-1 -outline-offset-1 outline-black/5"
                  />
                ) : (
                  <div className="size-20 shrink-0 rounded-md bg-secondary" />
                )}
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-accent">
                    {entry.category}
                  </p>
                  <Link
                    to="/articles/$slug"
                    params={{ slug: entry.slug }}
                    className="font-display text-xl font-medium leading-tight underline-reveal"
                  >
                    {entry.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.author_name} · read {formatDate(entry.read_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              clearReadingHistory();
              setEntries([]);
            }}
            className="mt-8 border border-rule px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Clear history
          </button>
        </>
      )}
    </main>
  );
}
