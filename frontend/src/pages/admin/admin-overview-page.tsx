import { useQuery } from "@tanstack/react-query"

import { getAdminOverview } from "@/lib/admin"
import { queryKeys } from "@/lib/query-client"

export function AdminOverviewPage() {
  const overviewQuery = useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: getAdminOverview,
  })

  if (overviewQuery.isError) {
    return <AdminState title="Overview unavailable" description={overviewQuery.error.message} />
  }
  if (!overviewQuery.data) {
    return <AdminState title="Loading administration" description="Reading live Turso data…" />
  }

  const overview = overviewQuery.data
  const cards = [
    ["Normal accounts", overview.roles.normal],
    ["Sellers", overview.roles.seller],
    ["Administrators", overview.roles.administrator],
    ["Applications awaiting review", overview.applications.submitted],
  ] as const

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Administration</p>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Overview</h1>
        <p className="text-sm text-muted-foreground">Live account and seller-review state from Turso.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div className="rounded-2xl border bg-card p-5" key={label}>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <a className="rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/35" href="#admin/seller-applications">
          <p className="font-semibold">Seller applications</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Review {overview.applications.submitted} submitted application{overview.applications.submitted === 1 ? "" : "s"}.
          </p>
        </a>
        <a className="rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/35" href="#admin/accounts">
          <p className="font-semibold">Accounts</p>
          <p className="mt-1 text-sm text-muted-foreground">Manage roles and account availability across the marketplace.</p>
        </a>
      </div>
    </section>
  )
}

function AdminState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-[50vh] items-center justify-center px-5 text-center"><div className="max-w-md"><h1 className="font-heading text-xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div></div>
}
