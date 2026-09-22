import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getArticleBySlug } from "@/lib/articles.functions";
import { formatDate } from "@/components/ArticleCard";
import { recordRead } from "@/lib/reading-history";

const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["published-article", slug],
    queryFn: () => getArticleBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/articles/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(articleQuery(params.slug)),
  head: ({ loaderData }) => {
    const title = loaderData?.seo_title ?? loaderData?.title ?? "Article | Writeora";
    const description = loaderData?.seo_description ?? loaderData?.excerpt ?? "";
    const image = loaderData?.og_image_url ?? loaderData?.cover_image_url;
    const url = loaderData ? `/articles/${encodeURIComponent(loaderData.slug)}` : "/articles";
    const articleSchema = loaderData
      ? JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: loaderData.title,
          description,
          url,
          datePublished: loaderData.published_at,
          dateModified: loaderData.updated_at,
          author: { "@type": "Person", name: loaderData.author_name },
          image: image ?? undefined,
        }).replace(/</g, "\\u003c")
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(loaderData?.keywords.length
          ? [{ name: "keywords", content: loaderData.keywords.join(", ") }]
          : []),
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      ...(articleSchema ? { scripts: [{ type: "application/ld+json", children: articleSchema }] } : {}),
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));

  useEffect(() => {
    if (!article) return;
    recordRead({
      slug: article.slug,
      title: article.title,
      category: article.category,
      cover_image_url: article.cover_image_url,
      author_name: article.author_name,
    });
  }, [article]);

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
