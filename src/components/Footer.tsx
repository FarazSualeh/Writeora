export function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-[90rem] flex-col items-start gap-2 border-t border-rule px-6 py-10 text-sm text-muted-foreground sm:px-8 lg:px-12">
      <span className="font-display text-2xl font-medium leading-none text-ink">Writeora</span>
      <span>© {new Date().getFullYear()} · Ink on paper, one reader at a time.</span>
    </footer>
  );
}
