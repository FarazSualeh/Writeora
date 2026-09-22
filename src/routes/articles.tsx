import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArticleCard } from "@/components/ArticleCard";
import { listPublished } from "@/lib/articles.functions";

const articlesQuery = queryOptions({
  queryKey: ["published-articles"],
  queryFn: () => listPublished(),
});

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Articles | Writeora" },
      {
        name: "description",
        content: "Read published articles from the Writeora desk.",
      },
    ],
  }),
  component: Articles,
});

function Articles() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/articles") return <Outlet />;

  return <ArticleIndex />;
}

function ArticleIndex() {
  const { data: articles } = useSuspenseQuery(articlesQuery);

  return (
    <main className="mx-auto max-w-[90rem] px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
      <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Articles</p>
      <h1 className="mt-1 font-display text-4xl font-medium leading-none">
        From the Writeora desk
      </h1>
      {articles.length === 0 ? (
        <div className="mt-10 border border-dashed border-rule px-6 py-16 text-center">
          <p className="font-display text-3xl text-ink">Coming soon...</p>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Published articles will appear here soon.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-12 gap-y-9 border-t border-rule pt-10 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </main>
  );
}
