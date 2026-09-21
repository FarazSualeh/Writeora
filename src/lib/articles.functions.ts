import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type FeedArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string;
  published_at: string | null;
  read_minutes: number;
  author_name: string;
  author_avatar: string | null;
};

export type FullArticle = FeedArticle & {
  content: string;
  tags: string[];
  keywords: string[];
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  author_bio: string | null;
  updated_at: string;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const SELECT =
  "id, slug, title, excerpt, cover_image_url, category, published_at, read_minutes, content, tags, keywords, seo_title, seo_description, og_image_url, updated_at, author_id";

type Row = Record<string, unknown>;

function shape(
  row: Row,
  profiles: Map<string, { display_name: string; avatar_url: string | null; bio: string | null }>,
): FullArticle {
  const p = profiles.get(String(row["author_id"]));
  return {
    id: String(row["id"]),
    slug: String(row["slug"]),
    title: String(row["title"]),
    excerpt: (row["excerpt"] as string) ?? null,
    cover_image_url: (row["cover_image_url"] as string) ?? null,
    category: String(row["category"]),
    published_at: (row["published_at"] as string) ?? null,
    read_minutes: Number(row["read_minutes"] ?? 5),
    content: String(row["content"] ?? ""),
    tags: (row["tags"] as string[]) ?? [],
    keywords: (row["keywords"] as string[]) ?? [],
    seo_title: (row["seo_title"] as string) ?? null,
    seo_description: (row["seo_description"] as string) ?? null,
    og_image_url: (row["og_image_url"] as string) ?? null,
    updated_at: String(row["updated_at"] ?? ""),
    author_name: p?.display_name ?? "Writeora",
    author_avatar: p?.avatar_url ?? null,
    author_bio: p?.bio ?? null,
  };
}

async function withAuthors(rows: Row[]) {
  const supabase = publicClient();
  const ids = [...new Set(rows.map((r) => String(r["author_id"])))];
  const map = new Map<
    string,
    { display_name: string; avatar_url: string | null; bio: string | null }
  >();
  if (ids.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio")
      .in("id", ids);
    for (const p of data ?? []) {
      map.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url, bio: p.bio });
    }
  }
  return rows.map((r) => shape(r, map));
}

export const listPublished = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  if (error) return [] as FullArticle[];
  return withAuthors((data ?? []) as Row[]);
});

export const getArticleBySlug = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("articles")
      .select(SELECT)
      .eq("status", "published")
      .eq("slug", data.slug)
      .limit(1);
    if (error || !rows?.length) return null;
    const [article] = await withAuthors(rows as Row[]);
    return article ?? null;
  });
