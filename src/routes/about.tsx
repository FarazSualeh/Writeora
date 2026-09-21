import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Writeora — a publication set like print" },
      {
        name: "description",
        content:
          "Writeora is an invitation-only publication: one ink, one paper, one accent, and a reading column you can trust to the end.",
      },
      { property: "og:title", content: "About Writeora — a publication set like print" },
      {
        property: "og:description",
        content:
          "Why Writeora borrows the courtesy of the printed page, and how contributors are invited.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <main className="mx-auto max-w-[90rem] px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-accent">About</p>
        </div>
        <div className="lg:col-span-9">
          <h1 className="max-w-[22ch] font-display text-4xl font-medium leading-[1.02] text-balance sm:text-5xl">
            One ink, one paper, one accent
          </h1>
          <div className="prose-writeora mt-8 max-w-[68ch] border-t border-rule pt-8 text-lg leading-[1.75] text-ink/90">
            <p>
              Writeora is a publication, not a feed. Every piece is set in a single column capped
              near sixty-eight characters, because the eye was built for a measure it can follow
              without effort.
            </p>
            <p>
              Anyone can read. Writing is by invitation: the Admin grants access to a specific email
              address, and that person can then draft, edit and publish their own work. Access can
              be revoked at any time.
            </p>
            <p>
              We care about how a page loads, how a link previews, and how a headline reads in a
              search result — because all of that is part of the reading experience too.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
