import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast-provider"
import {
  getAdminAccounts,
  getAdminSellerApplications,
  reviewAdminSellerApplication,
} from "@/lib/admin"
import type { Account } from "@/lib/auth"
import { queryKeys } from "@/lib/query-client"
import type { SellerApplicationData } from "@/lib/seller-application"

export function AdminSellerApplicationsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const applicationsQuery = useQuery({
    queryKey: queryKeys.adminSellerApplications,
    queryFn: () => getAdminSellerApplications(),
  })
  const accountsQuery = useQuery({ queryKey: queryKeys.adminAccounts, queryFn: getAdminAccounts })
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [reviewingId, setReviewingId] = useState<number | null>(null)

  const accountById = useMemo(
    () => new Map((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data]
  )

  async function review(application: SellerApplicationData, decision: "approved" | "rejected") {
    const reviewNotes = notes[application.id]?.trim() || null
    if (decision === "rejected" && !reviewNotes) {
      toast({ title: "Add a rejection reason", message: "Give the applicant actionable feedback before rejecting.", variant: "error" })
      return
    }
    setReviewingId(application.id)
    try {
      const updated = await reviewAdminSellerApplication(application.id, {
        expectedVersion: application.version,
        decision,
        reviewNotes,
      })
      queryClient.setQueryData<SellerApplicationData[]>(queryKeys.adminSellerApplications, (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ?? [updated]
      )
      toast({
        title: decision === "approved" ? "Seller approved" : "Application rejected",
        message: decision === "approved" ? "The account now has the seller role." : "The applicant can correct and resubmit the application.",
        variant: "success",
      })
    } catch (reason) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminSellerApplications })
      toast({ title: "Review not saved", message: reason instanceof Error ? reason.message : "Please try again.", variant: "error" })
    } finally {
      setReviewingId(null)
    }
  }

  if (applicationsQuery.isError) return <State title="Applications unavailable" description={applicationsQuery.error.message} />
  if (accountsQuery.isError) return <State title="Accounts unavailable" description={accountsQuery.error.message} />
  const applications = applicationsQuery.data
  const accounts = accountsQuery.data
  if (!applications || !accounts) return <State title="Loading applications" description="Reading seller applications from Turso…" />

  const submitted = applications.filter((application) => application.status === "submitted")
  const history = applications.filter((application) => application.status !== "submitted")

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Administration</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">Seller applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approval atomically promotes a normal account to seller.</p>
      </header>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Awaiting review · {submitted.length}</h2>
        {submitted.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">No submitted applications are waiting.</div>
        ) : submitted.map((application) => {
          const applicant = accountById.get(application.userId)
          return (
            <article className="rounded-2xl border bg-card p-4 sm:p-5" key={application.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="font-heading text-xl font-semibold">{application.atelierName ?? "Unnamed atelier"}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{applicant?.fullName ?? applicant?.email ?? `Account #${application.userId}`} · {application.primaryCategory ?? "Craft not set"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1">{application.region ?? "Region not set"}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1">{application.city ?? "City not set"}</span>
                    <span className="rounded-full bg-muted px-2.5 py-1">{application.yearsOfExperience ?? "Experience not set"}</span>
                  </div>
                  {application.professionalBio ? <p className="mt-3 max-w-3xl text-sm leading-6">{application.professionalBio}</p> : null}
                </div>
                <div className="w-full shrink-0 lg:w-80">
                  <Textarea aria-label={`Review notes for ${application.atelierName ?? "seller application"}`} onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))} placeholder="Review notes or rejection reason…" rows={3} value={notes[application.id] ?? ""} />
                  <div className="mt-2 flex gap-2">
                    <Button className="flex-1" disabled={reviewingId === application.id} onClick={() => void review(application, "approved")}>Approve</Button>
                    <Button className="flex-1" disabled={reviewingId === application.id} onClick={() => void review(application, "rejected")} variant="outline">Reject</Button>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {history.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Application history</h2>
          <div className="overflow-hidden rounded-2xl border bg-card divide-y">
            {history.map((application) => {
              const applicant = accountById.get(application.userId)
              return (
                <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" key={application.id}>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{application.atelierName ?? applicant?.email ?? `Application #${application.id}`}</p><p className="truncate text-xs text-muted-foreground">{applicant?.email ?? `Account #${application.userId}`}{application.reviewNotes ? ` · ${application.reviewNotes}` : ""}</p></div>
                  <span className="text-xs font-semibold capitalize text-muted-foreground">{application.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function State({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-[50vh] items-center justify-center px-5 text-center"><div><h1 className="font-heading text-xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div></div>
}
