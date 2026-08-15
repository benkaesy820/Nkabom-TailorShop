import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast-provider"
import { getAdminAccounts, updateAdminAccount } from "@/lib/admin"
import type { Account, AccountRole, AccountStatus } from "@/lib/auth"
import { queryKeys } from "@/lib/query-client"

const roles: AccountRole[] = ["normal", "seller", "administrator"]
const statuses: AccountStatus[] = ["active", "suspended", "disabled"]
type Draft = { role: AccountRole; accountStatus: AccountStatus }

function roleFromValue(value: string): AccountRole | null {
  return value === "normal" || value === "seller" || value === "administrator" ? value : null
}
function statusFromValue(value: string): AccountStatus | null {
  return value === "active" || value === "suspended" || value === "disabled" ? value : null
}

export function AdminAccountsPage({ currentAccountId }: { currentAccountId: number }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const accountsQuery = useQuery({ queryKey: queryKeys.adminAccounts, queryFn: getAdminAccounts })
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    if (!accountsQuery.data) return
    setDrafts(Object.fromEntries(accountsQuery.data.map((account) => [account.id, { role: account.role, accountStatus: account.accountStatus }])))
  }, [accountsQuery.data])

  function updateDraft(id: number, patch: Partial<Draft>) {
    setDrafts((current) => {
      const existing = current[id]
      return existing ? { ...current, [id]: { ...existing, ...patch } } : current
    })
  }

  async function save(account: Account) {
    const draft = drafts[account.id]
    if (!draft) return
    setSavingId(account.id)
    try {
      const updated = await updateAdminAccount(account.id, { ...draft, expectedVersion: account.version })
      queryClient.setQueryData<Account[]>(queryKeys.adminAccounts, (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ?? [updated]
      )
      toast({ title: "Account updated", message: `${updated.email} is now ${updated.role} / ${updated.accountStatus}.`, variant: "success" })
    } catch (reason) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminAccounts })
      toast({ title: "Account not updated", message: reason instanceof Error ? reason.message : "Please try again.", variant: "error" })
    } finally {
      setSavingId(null)
    }
  }

  if (accountsQuery.isError) return <State title="Accounts unavailable" description={accountsQuery.error.message} />
  const accounts = accountsQuery.data
  if (!accounts) return <State title="Loading accounts" description="Reading account roles from Turso…" />

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Administration</p><h1 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">Accounts</h1><p className="mt-1 text-sm text-muted-foreground">One exclusive role per account. Changes are enforced by the backend on the next request.</p></header>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="hidden grid-cols-[minmax(12rem,1.5fr)_10rem_10rem_7rem] gap-3 border-b bg-muted/35 px-4 py-2.5 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase md:grid"><span>Account</span><span>Role</span><span>Status</span><span /></div>
        <div className="divide-y">
          {accounts.map((account) => {
            const draft = drafts[account.id]
            if (!draft) return null
            const unchanged = draft.role === account.role && draft.accountStatus === account.accountStatus
            const isSelf = account.id === currentAccountId
            return (
              <div className="grid gap-3 p-4 md:grid-cols-[minmax(12rem,1.5fr)_10rem_10rem_7rem] md:items-center" key={account.id}>
                <div className="min-w-0"><div className="flex items-center gap-2"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">{account.initials}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{account.fullName ?? account.email}</p><p className="truncate text-xs text-muted-foreground">{account.email}{isSelf ? " · You" : ""}</p></div></div></div>
                <label className="grid gap-1 text-xs text-muted-foreground"><span className="md:sr-only">Role</span><select className="h-9 rounded-lg border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30" disabled={isSelf} onChange={(event) => { const role = roleFromValue(event.target.value); if (role) updateDraft(account.id, { role }) }} value={draft.role}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
                <label className="grid gap-1 text-xs text-muted-foreground"><span className="md:sr-only">Status</span><select className="h-9 rounded-lg border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30" disabled={isSelf} onChange={(event) => { const accountStatus = statusFromValue(event.target.value); if (accountStatus) updateDraft(account.id, { accountStatus }) }} value={draft.accountStatus}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                <Button disabled={isSelf || unchanged || savingId === account.id} onClick={() => void save(account)} size="sm">{savingId === account.id ? "Saving…" : "Save"}</Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function State({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-[50vh] items-center justify-center px-5 text-center"><div><h1 className="font-heading text-xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div></div>
}
