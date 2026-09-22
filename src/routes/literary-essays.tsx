import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArticleCard } from "@/components/ArticleCard";
import { listPublished } from "@/lib/articles.functions";

const essaysQuery = queryOptions({
  queryKey: ["literary-essays"],
  queryFn: () => listPublished(),
});

export const Route = createFileRoute("/literary-essays")({
  loader: ({ context }) => context.queryClient.ensureQueryData(essaysQuery),
  head: () => ({
    meta: [
      { title: "Literary Essays | Writeora" },
      {
        name: "description",
        content:
          "Read literary essays about culture, ideas, education, technology, and the questions shaping how we live.",
      },
      { name: "keywords", content: "literary essays, essays, culture, ideas, writing" },
      { property: "og:title", content: "Literary Essays | Writeora" },
      {
        property: "og:description",
        content: "Thoughtful literary essays for curious readers.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/literary-essays" }],
  }),
  component: LiteraryEssays,
});

function LiteraryEssays() {
  const { data: articles } = useSuspenseQuery(essaysQuery);

  return (
    <main className="mx-auto max-w-[90rem] px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
      <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Literary essays</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl font-medium leading-[0.98] text-ink sm:text-7xl">
        Literary essays with room to think.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
        Explore reflective essays, cultural criticism, and long-form ideas written for curious readers.
      </p>
      <div className="mt-12 grid gap-x-12 gap-y-9 border-t border-rule pt-10 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">New literary essays are coming soon.</p>
        ) : null}
      </div>
    </main>
  );
}
