import { Link } from "@tanstack/react-router";
import type { FullArticle } from "@/lib/articles.functions";
import { SafeImage } from "@/components/SafeImage";

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ArticleCard({ article }: { article: FullArticle }) {
  return (
    <article className="flex items-start gap-5">
      {article.cover_image_url ? (
        <SafeImage
          src={article.cover_image_url}
          alt={`Cover image for ${article.title}`}
          loading="lazy"
          className="size-24 shrink-0 rounded-md object-cover outline-1 -outline-offset-1 outline-black/5"
        />
      ) : (
        <div className="size-24 shrink-0 rounded-md bg-secondary outline-1 -outline-offset-1 outline-black/5" />
      )}
      <div>
        <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-accent">
          {article.category}
        </p>
        <Link
          to="/articles/$slug"
          params={{ slug: article.slug }}
          className="font-display text-xl font-medium leading-tight text-balance underline-reveal"
        >
          {article.title}
        </Link>
        {article.excerpt ? (
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{article.excerpt}</p>
        ) : null}
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {article.author_avatar ? (
            <img
              src={article.author_avatar}
              alt=""
              loading="lazy"
              className="size-4 rounded-full object-cover"
            />
          ) : null}
          By {article.author_name} · {formatDate(article.published_at)} · {article.read_minutes} min
        </p>
      </div>
    </article>
  );
}
