export type SellerApplicationStatus = "draft" | "submitted"

export type SellerApplicationData = {
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
  updatedAt: string | null
}

export type SellerApplicationDraft = Omit<
  SellerApplicationData,
  "status" | "submittedAt" | "updatedAt"
>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/seller-application${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
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
export const saveSellerApplication = (draft: SellerApplicationDraft) =>
  request<SellerApplicationData>("", {
    method: "PUT",
    body: JSON.stringify(draft),
  })
export const submitSellerApplication = () =>
  request<SellerApplicationData>("/submit", { method: "POST" })
