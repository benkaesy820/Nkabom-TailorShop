import type { Account, AccountRole, AccountStatus } from "@/lib/auth"
import type {
  SellerApplicationData,
  SellerApplicationStatus,
} from "@/lib/seller-application"

export type AdminOverview = {
  roles: Record<AccountRole, number>
  applications: Record<SellerApplicationStatus, number>
}

type Serialized<T> = { data: T }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/admin${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "The administrator request could not be completed."
    throw new Error(message)
  }
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as Serialized<T>).data
  }
  return payload as T
}

export const getAdminOverview = () => request<AdminOverview>("/overview")
export const getAdminAccounts = () => request<Account[]>("/accounts")
export const updateAdminAccount = (
  id: number,
  input: { role: AccountRole; accountStatus: AccountStatus; expectedVersion: number }
) =>
  request<Account>(`/accounts/${id}`, {
    method: "PATCH",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(input),
  })
export const getAdminSellerApplications = (status?: SellerApplicationStatus) =>
  request<SellerApplicationData[]>(
    `/seller-applications${status ? `?status=${encodeURIComponent(status)}` : ""}`
  )
export const reviewAdminSellerApplication = (
  id: number,
  input: { expectedVersion: number; decision: "approved" | "rejected"; reviewNotes: string | null }
) =>
  request<SellerApplicationData>(`/seller-applications/${id}/review`, {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(input),
  })
