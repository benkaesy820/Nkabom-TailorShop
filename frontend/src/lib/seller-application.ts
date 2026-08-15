export type SellerApplicationStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"

export type SellerApplicationData = {
  id: number
  userId: number
  primaryCategory: string | null
  specialities: string[]
  yearsOfExperience: string | null
  professionalBio: string | null
  languages: string[]
  atelierName: string | null
  businessType:
    | "individual"
    | "sole_proprietor"
    | "registered_company"
    | "cooperative"
    | null
  registrationNumber: string | null
  region: string | null
  city: string | null
  address: string | null
  serviceAreas: string | null
  phone: string | null
  whatsapp: string | null
  acceptsCommissions: boolean
  offersAlterations: boolean
  offersReadyMade: boolean
  offersInPersonFittings: boolean
  acceptsRemoteOrders: boolean
  minLeadTimeDays: number | null
  maxLeadTimeDays: number | null
  monthlyCapacity: number | null
  additionalServices: string | null
  status: SellerApplicationStatus
  submittedAt: string | null
  reviewedAt: string | null
  reviewedByAdminId: number | null
  reviewNotes: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export type SellerApplicationDraft = Omit<
  SellerApplicationData,
  | "id"
  | "userId"
  | "status"
  | "submittedAt"
  | "reviewedAt"
  | "reviewedByAdminId"
  | "reviewNotes"
  | "createdAt"
  | "updatedAt"
  | "version"
>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/seller-application${path}`, {
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
        : "We could not complete that request. Please try again."
    throw new Error(message)
  }
  return payload && typeof payload === "object" && "data" in payload
    ? (payload as { data: T }).data
    : (payload as T)
}

export const getSellerApplication = () =>
  request<SellerApplicationData | null>("")
export const saveSellerApplication = (draft: SellerApplicationDraft, expectedVersion: number) =>
  request<SellerApplicationData>("", {
    method: "PUT",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ ...draft, expectedVersion }),
  })
export const submitSellerApplication = (expectedVersion: number) =>
  request<SellerApplicationData>("/submit", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ expectedVersion }),
  })
