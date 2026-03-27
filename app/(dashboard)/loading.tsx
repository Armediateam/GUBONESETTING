function DashboardLoadingContent() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-5 xl:p-6">
      <div className="rounded-2xl border bg-background p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
        <div className="mt-3 h-8 w-56 animate-pulse rounded bg-muted/60" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted/40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-background p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-muted/40" />
            <div className="mt-5 h-8 w-16 animate-pulse rounded bg-muted/60" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border bg-background p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-muted/50" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded bg-muted/35" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-background p-5">
          <div className="h-5 w-32 animate-pulse rounded bg-muted/50" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-muted/35" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return <DashboardLoadingContent />
}
