import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listPublished } from "@/lib/articles.functions";
import { ArticleCard, formatDate } from "@/components/ArticleCard";

const feedQuery = queryOptions({
  queryKey: ["published-articles"],
  queryFn: () => listPublished(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(feedQuery),
  head: () => ({
    meta: [
      { title: "Writeora — essays and deep dives, set on paper" },
      {
        name: "description",
        content:
          "A typography-first publishing platform. Read essays, reporting and deep dives from Writeora's contributors.",
      },
      { property: "og:title", content: "Writeora — essays and deep dives, set on paper" },
      {
        property: "og:description",
        content: "A typography-first publishing platform for essays, reporting and deep dives on any subject.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const { data: articles } = useSuspenseQuery(feedQuery);
  const [lead, ...rest] = articles;

  if (!lead) {
    return (
      <main className="mx-auto max-w-[90rem] px-6 py-20 sm:px-8 lg:px-12">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">The desk is open</p>
        <h1 className="mt-4 max-w-[20ch] font-display text-4xl font-medium leading-[0.98] text-balance sm:text-5xl">
          Nothing published yet
        </h1>
        <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
          The first person to create an account becomes the Admin. Sign in, write the first piece and publish it here.
        </p>
        <Link to="/auth" className="mt-6 inline-block text-sm font-medium text-accent underline-reveal">
          Sign in to the desk
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[90rem] px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <article className="lg:col-span-7">
          <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-accent">
            <span>{lead.category}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatDate(lead.published_at)}</span>
          </div>
          <h1 className="max-w-[24ch] font-display text-4xl font-medium leading-[0.98] text-balance sm:text-5xl lg:text-6xl">
            <Link to="/articles/$slug" params={{ slug: lead.slug }} className="underline-reveal">
              {lead.title}
            </Link>
          </h1>
          {lead.excerpt ? (
            <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">{lead.excerpt}</p>
          ) : null}
          <div className="mt-6 flex items-center gap-3">
            {lead.author_avatar ? (
              <img src={lead.author_avatar} alt="" className="size-10 rounded-full object-cover" />
            ) : (
              <div className="size-10 rounded-full bg-secondary" />
            )}
            <p className="text-sm text-ink">
              By <span className="font-medium">{lead.author_name}</span>{" "}
              <span className="text-muted-foreground">· {lead.read_minutes} min read</span>
            </p>
          </div>
          {lead.cover_image_url ? (
            <Link to="/articles/$slug" params={{ slug: lead.slug }} className="mt-8 block">
              <img
                src={lead.cover_image_url}
                alt={lead.title}
                className="aspect-[16/9] w-full rounded-[min(1vw,12px)] object-cover outline-1 -outline-offset-1 outline-black/5"
              />
            </Link>
          ) : null}
        </article>

        <div className="lg:col-span-5 lg:border-l lg:border-rule lg:pl-10">
          <h2 className="mb-6 font-display text-lg font-medium text-ink">Latest from the desk</h2>
          <div className="space-y-7">
            {rest.slice(0, 6).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
            {rest.length === 0 ? (
              <p className="text-sm text-muted-foreground">More pieces are being set.</p>
            ) : null}
          </div>
          {rest.length > 6 ? (
            <Link to="/archive" className="mt-8 inline-block text-sm font-medium text-accent underline-reveal">
              Read the full archive
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
