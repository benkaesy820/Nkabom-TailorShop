export type AccountRole = "normal" | "seller" | "administrator"
export type AccountStatus = "active" | "suspended" | "disabled"

export type Account = {
  id: number
  fullName: string | null
  email: string
  role: AccountRole
  accountStatus: AccountStatus
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
  initials: string
}

type Serialized<T> = { data: T }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : payload &&
            typeof payload === "object" &&
            "error" in payload &&
            payload.error &&
            typeof payload.error === "object" &&
            "message" in payload.error &&
            typeof payload.error.message === "string"
          ? payload.error.message
          : payload &&
              typeof payload === "object" &&
              "errors" in payload &&
              Array.isArray(payload.errors) &&
              payload.errors.length > 0 &&
              typeof payload.errors[0] === "object" &&
              payload.errors[0] !== null &&
              "message" in payload.errors[0] &&
              typeof payload.errors[0].message === "string"
            ? payload.errors[0].message
            : response.status === 401
              ? "The email address or password is incorrect."
              : "We could not complete that request. Please try again."
    throw new Error(message)
  }

  const payload: unknown = await response.json()
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as Serialized<T>).data
  }
  return payload as T
}

export async function registerAccount(input: {
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
}) {
  return request<Account>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function signIn(input: { email: string; password: string }) {
  return request<Account>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function getCurrentAccount() {
  return request<Account>("/account/profile")
}

export async function signOut() {
  await request<{ message: string }>("/account/logout", { method: "POST" })
}

export const requestEmailVerification = (email: string) =>
  request<{ message: string }>("/auth/verify-email/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
export const verifyEmail = (token: string) =>
  request<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
export const requestPasswordReset = (email: string) =>
  request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
export const resetPassword = (input: {
  token: string
  password: string
  passwordConfirmation: string
}) =>
  request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  })
