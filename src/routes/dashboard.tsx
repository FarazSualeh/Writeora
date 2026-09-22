import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { inviteContributor, revokeContributor } from "@/lib/access.functions";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ARTICLE_FIELDS =
  "id, author_id, slug, title, excerpt, content, cover_image_url, category, tags, status, published_at, read_minutes, seo_title, seo_description, og_image_url, keywords, created_at, updated_at";

type Article = Database["public"]["Tables"]["articles"]["Row"];
type Invite = { id: string; email: string; accepted_at: string | null };
type Contributor = { user_id: string; email: string | null; display_name: string };
type EditorState = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  tags: string;
  readMinutes: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  keywords: string;
};

const EMPTY_EDITOR: EditorState = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  category: "Essays",
  tags: "",
  readMinutes: "5",
  seoTitle: "",
  seoDescription: "",
  ogImageUrl: "",
  keywords: "",
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Publishing Desk | Writeora" },
      { name: "description", content: "Create, edit, and publish stories on Writeora." },
      { property: "og:title", content: "Publishing Desk | Writeora" },
      { property: "og:description", content: "Create, edit, and publish stories on Writeora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

function articleToEditor(article: Article): EditorState {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? "",
    content: article.content,
    coverImageUrl: article.cover_image_url ?? "",
    category: article.category,
    tags: article.tags.join(", "),
    readMinutes: String(article.read_minutes),
    seoTitle: article.seo_title ?? "",
    seoDescription: article.seo_description ?? "",
    ogImageUrl: article.og_image_url ?? "",
    keywords: article.keywords.join(", "),
  };
}

function formatDeskDate(value: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

function Dashboard() {
  const { user, isAdmin, isAuthor, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [activeView, setActiveView] = useState<"library" | "editor">("library");
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const editorRef = useRef<EditorState>(EMPTY_EDITOR);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [email, setEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [accessError, setAccessError] = useState("");

  async function loadArticles() {
    setArticlesLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_FIELDS)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setArticles((data ?? []) as Article[]);
    setArticlesLoading(false);
  }

  async function loadAccess() {
    setAccessError("");
    setInvites([]);
    setContributors([]);
    const [{ data: inviteData, error: inviteError }, { data: roleData, error: roleError }] =
      await Promise.all([
        supabase.from("invites").select("id, email, accepted_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id").eq("role", "author"),
      ]);
    if (inviteError || roleError) {
      setAccessError(inviteError?.message ?? roleError?.message ?? "Unable to load access.");
      return;
    }
    setInvites((inviteData ?? []) as Invite[]);
    const ids = (roleData ?? []).map((role) => role.user_id);
    if (!ids.length) return;
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", ids);
    if (profilesError) {
      setAccessError(profilesError.message);
      return;
    }
    setContributors(
      (profiles ?? []).map((profile) => ({
        user_id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
      })),
    );
  }

  useEffect(() => {
    if (isAuthor) void loadArticles();
    if (isAdmin) void loadAccess();
  }, [isAdmin, isAuthor]);

  const filteredArticles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return articles.filter((article) => {
      const statusMatches = statusFilter === "all" || article.status === statusFilter;
      const searchMatches =
        !term ||
        article.title.toLowerCase().includes(term) ||
        article.category.toLowerCase().includes(term);
      return statusMatches && searchMatches;
    });
  }, [articles, search, statusFilter]);

  const draftCount = articles.filter((article) => article.status === "draft").length;
  const publishedCount = articles.filter((article) => article.status === "published").length;

  function newArticle() {
    editorRef.current = EMPTY_EDITOR;
    setEditor(EMPTY_EDITOR);
    setSlugTouched(false);
    setEditorDirty(false);
    setActiveView("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editArticle(article: Article) {
    const nextEditor = articleToEditor(article);
    editorRef.current = nextEditor;
    setEditor(nextEditor);
    setSlugTouched(true);
    setEditorDirty(false);
    setActiveView("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateEditor<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setEditorDirty(true);
    const nextEditor = { ...editorRef.current, [key]: value };
    editorRef.current = nextEditor;
    setEditor(nextEditor);
  }

  function updateTitle(title: string) {
    setEditorDirty(true);
    const nextEditor = {
      ...editorRef.current,
      title,
      slug: slugTouched ? editorRef.current.slug : slugify(title),
    };
    editorRef.current = nextEditor;
    setEditor(nextEditor);
  }

  function updateSlug(slug: string) {
    setSlugTouched(true);
    updateEditor("slug", slugify(slug));
  }

  function leaveEditor() {
    if (editorDirty && !window.confirm("Discard your unsaved changes?")) return;
    setActiveView("library");
  }

  async function saveArticle(status: "draft" | "published") {
    if (!user) return;
    const currentEditor = editorRef.current;
    const title = currentEditor.title.trim();
    const slug = slugify(currentEditor.slug.trim() || title);
    if (!title) {
      toast.error("Add a headline before saving.");
      return;
    }
    if (!slug) {
      toast.error("Add a usable slug before saving.");
      return;
    }
    const coverImageUrl = optionalHttpUrl(currentEditor.coverImageUrl);
    const ogImageUrl = optionalHttpUrl(currentEditor.ogImageUrl);
    if (currentEditor.coverImageUrl.trim() && !coverImageUrl) {
      toast.error("Enter a valid HTTP or HTTPS cover image URL.");
      return;
    }
    if (currentEditor.ogImageUrl.trim() && !ogImageUrl) {
      toast.error("Enter a valid HTTP or HTTPS Open Graph image URL.");
      return;
    }
    setSaving(true);
    const existing = currentEditor.id ? articles.find((article) => article.id === currentEditor.id) : undefined;
    const duplicate = articles.some((article) => article.slug === slug && article.id !== currentEditor.id);
    if (duplicate) {
      toast.error("That slug is already in use. Choose a different slug.");
      setSaving(false);
      return;
    }
    if (status === "published" && !currentEditor.content.trim()) {
      toast.error("Add article content before publishing.");
      setSaving(false);
      return;
    }
    if (existing?.status === "published" && existing.slug !== slug) {
      toast.error("Published article URLs cannot be changed.");
      setSaving(false);
      return;
    }
    const payload: Database["public"]["Tables"]["articles"]["Insert"] = {
      author_id: existing?.author_id ?? user.id,
      title,
      slug,
      excerpt: currentEditor.excerpt.trim() || null,
      content: currentEditor.content,
      cover_image_url: coverImageUrl,
      category: currentEditor.category.trim() || "Essays",
      tags: splitList(currentEditor.tags),
      status,
      published_at:
        status === "published" ? existing?.published_at ?? new Date().toISOString() : null,
      read_minutes: Math.max(1, Number.parseInt(currentEditor.readMinutes, 10) || 1),
      seo_title: currentEditor.seoTitle.trim() || null,
      seo_description: currentEditor.seoDescription.trim() || null,
      og_image_url: ogImageUrl,
      keywords: splitList(currentEditor.keywords),
    };

    const result = currentEditor.id
      ? await supabase.from("articles").update(payload).eq("id", currentEditor.id).select(ARTICLE_FIELDS).single()
      : await supabase.from("articles").insert(payload).select(ARTICLE_FIELDS).single();

    if (result.error) {
      toast.error(
        result.error.code === "23505"
          ? "That slug is already in use. Choose a different slug."
          : result.error.message,
      );
      setSaving(false);
      return;
    }
    const saved = result.data as Article;
    const savedEditor = articleToEditor(saved);
    editorRef.current = savedEditor;
    setEditor(savedEditor);
    setSlugTouched(true);
    setEditorDirty(false);
    await loadArticles();
    setSaving(false);
    toast.success(status === "published" ? "Article published." : "Draft saved.");
  }

  async function deleteArticle(article: Article) {
    if (!window.confirm(`Delete “${article.title}”? This cannot be undone.`)) return;
    const { error } = await supabase.from("articles").delete().eq("id", article.id);
    if (error) toast.error(error.message);
    else {
      setArticles((current) => current.filter((item) => item.id !== article.id));
      toast.success("Article deleted.");
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccessError("");
    setInviteLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setAccessError("Your session has expired. Please sign in again.");
      setInviteLoading(false);
      return;
    }
    try {
      const result = await inviteContributor({
        data: { email: normalizedEmail, redirectTo: window.location.origin, accessToken },
      });
      toast.success(
        result.alreadyRegistered
          ? `${normalizedEmail} already has an account; access was recorded.`
          : `Invitation sent to ${normalizedEmail}.`,
      );
      setEmail("");
      await loadAccess();
    } catch (inviteError) {
      setAccessError(inviteError instanceof Error ? inviteError.message : "Unable to send invitation.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function revokeInvite(emailAddress: string) {
    setAccessError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setAccessError("Your session has expired. Please sign in again.");
      return;
    }
    try {
      await revokeContributor({ data: { email: emailAddress, accessToken } });
      toast.success("Invitation revoked.");
      await loadAccess();
    } catch (revokeError) {
      setAccessError(revokeError instanceof Error ? revokeError.message : "Unable to revoke access.");
    }
  }

  useEffect(() => {
    if (activeView !== "editor" || !editorDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeView, editorDirty]);

  if (authLoading) {
    return <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">Loading the desk...</main>;
  }

  if (!user || !isAuthor) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8 lg:px-12">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">Writer access required.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The Desk is available to Writeora Admins and invited contributors.
        </p>
        <Link to="/auth" className="mt-6 inline-block text-sm font-medium text-accent underline-reveal">
          Sign in to continue
        </Link>
      </main>
    );
  }

  if (activeView === "editor") {
    return (
      <Editor
        editor={editor}
        saving={saving}
        onBack={leaveEditor}
        onChange={updateEditor}
        onTitleChange={updateTitle}
        onSlugChange={updateSlug}
        onSave={saveArticle}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-rule pb-7 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">The Writeora desk</p>
          <h1 className="mt-3 truncate font-display text-4xl font-medium text-ink sm:text-6xl">Stories</h1>
          <p className="mt-3 hidden max-w-xl text-base text-muted-foreground sm:block">
            Shape a draft, refine the details, then send it into the world.
          </p>
        </div>
        <Button onClick={newArticle} className="shrink-0">
          <Plus /> <span className="hidden sm:inline">New article</span><span className="sm:hidden">New</span>
        </Button>
      </header>

      <Tabs defaultValue="articles" className="mt-7">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-rule bg-transparent p-0 sm:w-auto">
          <TabsTrigger value="articles" className="rounded-none border-b-2 border-transparent px-3 py-3 shadow-none data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <FileText /> Articles
          </TabsTrigger>
          {isAdmin ? (
            <TabsTrigger value="access" className="rounded-none border-b-2 border-transparent px-3 py-3 shadow-none data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              <Users /> Access
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="articles" className="mt-8">
          <section className="grid grid-cols-3 divide-x divide-rule border-y border-rule py-5">
            <Stat label="All stories" value={articles.length} />
            <Stat label="Drafts" value={draftCount} />
            <Stat label="Published" value={publishedCount} />
          </section>

          <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stories"
                className="h-11 bg-card pl-10"
              />
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
              {(["all", "draft", "published"] as const).map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={statusFilter === status ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter(status)}
                  className="capitalize shadow-none"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-6 divide-y divide-rule border-y border-rule">
            {articlesLoading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading stories...</p>
            ) : filteredArticles.length ? (
              filteredArticles.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onEdit={() => editArticle(article)}
                  onDelete={() => void deleteArticle(article)}
                />
              ))
            ) : (
              <div className="py-14 text-center">
                <BookOpen className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 text-lg text-ink">No stories found.</p>
                <p className="mt-1 text-sm text-muted-foreground">Start a new article or adjust your filters.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {isAdmin ? (
          <TabsContent value="access" className="mt-8">
            <AccessPanel
              email={email}
              setEmail={setEmail}
              invite={invite}
              loading={inviteLoading}
              error={accessError}
              invites={invites}
              contributors={contributors}
              revokeInvite={revokeInvite}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 text-center sm:px-6 sm:text-left">
      <p className="font-display text-3xl text-ink sm:text-4xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

function ArticleRow({ article, onEdit, onDelete }: { article: Article; onEdit: () => void; onDelete: () => void }) {
  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] sm:gap-5">
      <button type="button" onClick={onEdit} className="min-w-0 text-left">
        <h2 className="truncate font-display text-xl font-medium text-ink sm:text-2xl">{article.title}</h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {article.category} · Updated {formatDeskDate(article.updated_at)}
        </p>
      </button>
      <span className="hidden text-sm text-muted-foreground sm:block">{article.read_minutes} min read</span>
      <span className={`hidden w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize sm:inline-flex ${article.status === "published" ? "bg-secondary text-secondary-foreground" : "border border-rule text-muted-foreground"}`}>
        {article.status}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${article.title}`} className="shrink-0">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}><Pencil /> Edit</DropdownMenuItem>
          {article.status === "published" ? (
            <DropdownMenuItem asChild>
              <Link to="/articles/$slug" params={{ slug: article.slug }}><ExternalLink /> View article</Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="col-span-2 flex items-center gap-2 sm:hidden">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${article.status === "published" ? "bg-secondary text-secondary-foreground" : "border border-rule text-muted-foreground"}`}>
          {article.status}
        </span>
        <span className="text-xs text-muted-foreground">{article.read_minutes} min read</span>
      </div>
    </article>
  );
}

function Editor({
  editor,
  saving,
  onBack,
  onChange,
  onTitleChange,
  onSlugChange,
  onSave,
}: {
  editor: EditorState;
  saving: boolean;
  onBack: () => void;
  onChange: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  onSave: (status: "draft" | "published") => Promise<void>;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 sm:py-10 lg:px-12">
      <header className="sticky top-0 z-20 -mx-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-8 lg:-mx-12 lg:px-12">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} aria-label="Back to stories"><ArrowLeft /></Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{editor.title || "Untitled article"}</p>
          <p className="text-xs text-muted-foreground">{editor.id ? "Editing story" : "New story"}</p>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex">
          <Button type="button" variant="outline" disabled={saving} onClick={() => void onSave("draft")}>
            {saving ? "Saving..." : "Save draft"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => void onSave("published")}>
            <Check /> Publish
          </Button>
        </div>
      </header>

      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <section className="min-w-0">
          <label className="sr-only" htmlFor="article-title">Headline</label>
          <Textarea
            id="article-title"
            value={editor.title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Story headline"
            rows={2}
            className="min-h-0 resize-none border-0 bg-transparent px-0 font-display text-4xl leading-[1.05] shadow-none focus-visible:ring-0 sm:text-6xl"
          />
          <label className="mt-5 block">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Short excerpt</span>
            <Textarea
              value={editor.excerpt}
              onChange={(event) => onChange("excerpt", event.target.value)}
              placeholder="A concise introduction for article cards and search results."
              rows={3}
              className="mt-2 min-h-24 bg-card text-lg leading-relaxed"
            />
          </label>
          <label className="mt-7 block">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Article body</span>
            <Textarea
              value={editor.content}
              onChange={(event) => onChange("content", event.target.value)}
              placeholder="Begin writing... Separate paragraphs with a blank line."
              className="mt-2 min-h-[32rem] resize-y bg-card text-lg leading-[1.75] sm:min-h-[42rem]"
            />
          </label>
        </section>

        <aside className="space-y-8 border-t border-rule pt-8 lg:sticky lg:top-28 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <EditorGroup title="Story details">
            <Field label="Slug">
              <Input
                value={editor.slug}
                onChange={(event) => onSlugChange(event.target.value)}
                placeholder="story-url"
              />
            </Field>
            <Field label="Cover image URL">
              <Input type="url" value={editor.coverImageUrl} onChange={(event) => onChange("coverImageUrl", event.target.value)} placeholder="https://..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category"><Input value={editor.category} onChange={(event) => onChange("category", event.target.value)} /></Field>
              <Field label="Read time"><Input min="1" type="number" value={editor.readMinutes} onChange={(event) => onChange("readMinutes", event.target.value)} /></Field>
            </div>
            <Field label="Tags"><Input value={editor.tags} onChange={(event) => onChange("tags", event.target.value)} placeholder="Culture, Ideas" /></Field>
          </EditorGroup>

          <EditorGroup title="Search & sharing">
            <Field label="SEO title"><Input value={editor.seoTitle} onChange={(event) => onChange("seoTitle", event.target.value)} placeholder="Defaults to headline" /></Field>
            <Field label="SEO description">
              <Textarea value={editor.seoDescription} onChange={(event) => onChange("seoDescription", event.target.value)} rows={3} placeholder="Defaults to excerpt" />
            </Field>
            <Field label="Open Graph image URL"><Input type="url" value={editor.ogImageUrl} onChange={(event) => onChange("ogImageUrl", event.target.value)} placeholder="https://..." /></Field>
            <Field label="Keywords"><Input value={editor.keywords} onChange={(event) => onChange("keywords", event.target.value)} placeholder="writing, culture" /></Field>
          </EditorGroup>
        </aside>
      </div>
    </main>
  );
}

function EditorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="font-display text-2xl text-ink">{title}</h2><div className="mt-4 space-y-4">{children}</div></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}

function AccessPanel({
  email,
  setEmail,
  invite,
  loading,
  error,
  invites,
  contributors,
  revokeInvite,
}: {
  email: string;
  setEmail: (email: string) => void;
  invite: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  loading: boolean;
  error: string;
  invites: Invite[];
  contributors: Contributor[];
  revokeInvite: (email: string) => Promise<void>;
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.65fr)]">
      <section>
        <h2 className="font-display text-3xl text-ink sm:text-4xl">Invite a contributor</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">Writers receive an email invitation and can manage only their own stories.</p>
        <form onSubmit={invite} className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="writer@example.com" className="h-11 bg-card" />
          <Button type="submit" disabled={loading} className="h-11">{loading ? "Sending..." : "Send invitation"}</Button>
        </form>
        {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}

        <div className="mt-10">
          <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Invitations</h3>
          <div className="mt-3 divide-y divide-rule border-y border-rule">
            {invites.length ? invites.map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4">
                <div className="min-w-0"><p className="truncate text-sm text-ink">{item.email}</p><p className="text-xs text-muted-foreground">{item.accepted_at ? "Joined" : "Pending"}</p></div>
                <Button type="button" variant="ghost" size="sm" onClick={() => void revokeInvite(item.email)}>{item.accepted_at ? "Remove access" : "Revoke"}</Button>
              </div>
            )) : <p className="py-5 text-sm text-muted-foreground">No invitations yet.</p>}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ink">Active contributors</h2>
        <div className="mt-4 divide-y divide-rule border-y border-rule">
          {contributors.length ? contributors.map((contributor) => (
            <div key={contributor.user_id} className="py-4">
              <p className="text-sm font-medium text-ink">{contributor.display_name}</p>
              <p className="truncate text-xs text-muted-foreground">{contributor.email}</p>
            </div>
          )) : <p className="py-5 text-sm text-muted-foreground">No active contributors yet.</p>}
        </div>
      </section>
    </div>
  );
}
