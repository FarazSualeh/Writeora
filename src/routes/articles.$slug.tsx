import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getArticleBySlug } from "@/lib/articles.functions";
import { formatDate } from "@/components/ArticleCard";

const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["published-article", slug],
    queryFn: () => getArticleBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/articles/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(articleQuery(params.slug)),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.seo_title ?? loaderData?.title ?? "Article | Writeora" },
      { name: "description", content: loaderData?.seo_description ?? loaderData?.excerpt ?? "" },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));

  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8 lg:px-12">
        <h1 className="font-display text-5xl text-ink">Article not found.</h1>
        <Link to="/archive" className="mt-6 inline-block text-sm text-accent underline-reveal">
          Back to articles
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:px-8 lg:px-12 lg:py-20">
      {article.cover_image_url ? (
        <img
          src={article.cover_image_url}
          alt=""
          className="mb-10 aspect-[16/8] w-full rounded-sm object-cover"
        />
      ) : null}
      <p className="text-xs uppercase tracking-[0.18em] text-accent">{article.category}</p>
      <h1 className="mt-4 font-display text-5xl font-medium leading-[0.98] text-ink sm:text-7xl">
        {article.title}
      </h1>
      <div className="mt-8 flex items-center gap-3 border-y border-rule py-4 text-sm text-muted-foreground">
        {article.author_avatar ? (
          <img src={article.author_avatar} alt="" className="size-9 rounded-full object-cover" />
        ) : null}
        <span>{article.author_name}</span>
        <span>·</span>
        <span>{formatDate(article.published_at)}</span>
        <span>·</span>
        <span>{article.read_minutes} min read</span>
      </div>
      <div className="prose-writeora mt-10 text-lg leading-[1.75] text-ink/90">
        {article.content.split(/\n{2,}/).map((paragraph, index) => (
          <p key={`${article.id}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}
