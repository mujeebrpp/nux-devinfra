export default function Loading() {
  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
        Loading…
      </div>
    </div>
  );
}
