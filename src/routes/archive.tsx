import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listPublished } from "@/lib/articles.functions";
import { ArticleCard } from "@/components/ArticleCard";

const feedQuery = queryOptions({
  queryKey: ["published-articles"],
  queryFn: () => listPublished(),
});

export const Route = createFileRoute("/archive")({
  loader: ({ context }) => context.queryClient.ensureQueryData(feedQuery),
  head: () => ({
    meta: [
      { title: "Archive — every piece published on Writeora" },
      {
        name: "description",
        content:
          "Browse the complete Writeora archive: essays, reporting and deep dives grouped by category.",
      },
      { property: "og:title", content: "Archive — every piece published on Writeora" },
      {
        property: "og:description",
        content: "Browse the complete Writeora archive of essays and deep dives.",
      },
      { property: "og:url", content: "/archive" },
    ],
    links: [{ rel: "canonical", href: "/archive" }],
  }),
  component: Archive,
});

function Archive() {
  const { data: articles } = useSuspenseQuery(feedQuery);
  const categories = [...new Set(articles.map((a) => a.category))];

  return (
    <main className="mx-auto max-w-[90rem] px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
      <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Archive</p>
      <h1 className="mt-1 font-display text-4xl font-medium leading-none">Everything we've set</h1>
      {categories.length ? (
        <p className="mt-4 text-sm text-muted-foreground">{categories.join(" · ")}</p>
      ) : null}

      <div className="mt-10 grid gap-x-12 gap-y-9 border-t border-rule pt-10 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">The archive is empty for now.</p>
        ) : null}
      </div>
    </main>
  );
}
