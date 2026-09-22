import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listPublished } from "@/lib/articles.functions";
import { ArticleCard } from "@/components/ArticleCard";
import heroImage from "@/assets/hero-letterpress.jpg";

const feedQuery = queryOptions({
  queryKey: ["published-articles"],
  queryFn: () => listPublished(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(feedQuery),
  head: () => ({
    meta: [
      { title: "Writeora | Essays worth your time" },
      {
        name: "description",
        content:
          "Writeora is an independent home for essays, reporting, and deep dives made for curious readers.",
      },
      { name: "keywords", content: "essays, journalism, culture, ideas, writing" },
      { property: "og:title", content: "Writeora | Essays worth your time" },
      {
        property: "og:description",
        content: "Independent essays, reporting, and deep dives made for curious readers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: heroImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Writeora | Essays worth your time" },
      { name: "twitter:image", content: heroImage },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Writeora",
          description: "Independent essays, reporting, and deep dives made for curious readers.",
          url: "https://writeora.lovable.app/",
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: articles } = useSuspenseQuery(feedQuery);
  const [lead, ...rest] = articles;

  return (
    <main>
      <section className="mx-auto grid max-w-[90rem] gap-10 px-6 pb-16 pt-10 sm:px-8 sm:pt-12 lg:grid-cols-12 lg:gap-14 lg:px-12 lg:pb-24 lg:pt-12">
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="animate-rise text-xs font-medium uppercase tracking-[0.22em] text-accent">
            A publication for the curious
          </p>
          <h1 className="animate-rise animation-delay-100 mt-5 max-w-[11ch] font-display text-6xl font-medium leading-[0.9] tracking-tight text-ink sm:text-7xl lg:text-8xl">
            Ideas with room to breathe.
          </h1>
          <p className="animate-rise animation-delay-200 mt-7 max-w-[34rem] text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            Writeora is an independent home for clear thinking, good questions, and stories that
            stay with you.
          </p>
          <div className="animate-rise animation-delay-300 mt-9 flex flex-wrap items-center gap-5">
            <Link
              to="/archive"
              className="inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5"
            >
              Explore the archive
            </Link>
            <Link to="/about" className="text-sm font-medium text-accent underline-reveal">
              What we believe
            </Link>
          </div>
        </div>
        <div className="relative min-h-[22rem] overflow-hidden rounded-sm bg-ink lg:col-span-5 lg:min-h-[35rem]">
          <img
            src={heroImage}
            alt="Close-up of letterpress type on textured paper"
            className="absolute inset-0 size-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />
          <p className="absolute bottom-6 left-6 max-w-[16ch] font-display text-2xl leading-tight text-paper sm:text-3xl">
            The page is still a place to think.
          </p>
        </div>
      </section>

      <section className="border-y border-rule bg-secondary/50">
        <div className="mx-auto grid max-w-[90rem] gap-8 px-6 py-8 sm:grid-cols-3 sm:px-8 lg:px-12">
          <div>
            <p className="font-display text-3xl text-ink">01</p>
            <p className="mt-2 text-sm text-muted-foreground">Long-form ideas, edited with care.</p>
          </div>
          <div>
            <p className="font-display text-3xl text-ink">02</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Independent voices, no endless scroll.
            </p>
          </div>
          <div>
            <p className="font-display text-3xl text-ink">03</p>
            <p className="mt-2 text-sm text-muted-foreground">
              A slower, better way to read online.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-10 flex items-end justify-between gap-6 border-b border-rule pb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              From the desk
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium text-ink sm:text-5xl">
              The latest thinking
            </h2>
          </div>
          <Link
            to="/archive"
            className="hidden text-sm font-medium text-accent underline-reveal sm:block"
          >
            View all articles
          </Link>
        </div>
        {!lead ? (
          <div className="border border-dashed border-rule px-6 py-12 text-center">
            <p className="font-display text-2xl text-ink">Coming soon...</p>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Articles from the Writeora desk will appear here soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {[lead, ...rest.slice(0, 5)].map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
        <Link
          to="/archive"
          className="mt-10 inline-block text-sm font-medium text-accent underline-reveal sm:hidden"
        >
          View all articles
        </Link>
      </section>
    </main>
  );
}
