export function Footer() {
  return (
    <footer className="mx-auto flex max-w-[90rem] flex-col items-start justify-between gap-3 border-t border-rule px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8 lg:px-12">
      <span className="font-display text-lg font-medium text-ink">Writeora</span>
      <span>© {new Date().getFullYear()} Writeora · Ink on paper, one reader at a time.</span>
    </footer>
  );
}
