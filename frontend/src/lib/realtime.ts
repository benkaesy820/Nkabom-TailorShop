import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import type { Account } from "@/lib/auth"
import { queryKeys } from "@/lib/query-client"
import type { SellerApplicationData } from "@/lib/seller-application"

const realtimeUrl = "/api/v1/realtime/events"

type RealtimeChange = {
  type: string
  entityType:
    | "account"
    | "seller_application"
    | "admin_accounts"
    | "admin_seller_applications"
  id: number
  version: number
}

function parseChange(value: string): RealtimeChange | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
  const type = Reflect.get(parsed, "type")
  const entityType = Reflect.get(parsed, "entityType")
  const id = Reflect.get(parsed, "id")
  const version = Reflect.get(parsed, "version")
  if (
    typeof type !== "string" ||
    (entityType !== "account" &&
      entityType !== "seller_application" &&
      entityType !== "admin_accounts" &&
      entityType !== "admin_seller_applications") ||
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof version !== "number" ||
    !Number.isSafeInteger(version) ||
    version <= 0
  ) {
    return null
  }
  return { type, entityType, id, version }
}

export function useRealtimeSync(account: Account | null): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!account) return

    const source = new EventSource(realtimeUrl, { withCredentials: true })

    const invalidateKnownServerState = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.account })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerApplication })
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview })
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminAccounts })
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminSellerApplications })
    }

    const onReady = () => {
      // Establish the SSE baseline before trusting any domain query started during this render.
      invalidateKnownServerState()
    }

    const onSyncRequired = () => {
      invalidateKnownServerState()
    }

    const onChange = (event: Event) => {
      if (!(event instanceof MessageEvent) || typeof event.data !== "string") return
      const change = parseChange(event.data)
      if (!change) return

      switch (change.entityType) {
        case "account": {
          const cached = queryClient.getQueryData<Account | null>(queryKeys.account)
          if (!cached || cached.id !== change.id || cached.version < change.version) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.account })
          }
          return
        }
        case "seller_application": {
          const cached = queryClient.getQueryData<SellerApplicationData | null>(
            queryKeys.sellerApplication
          )
          if (!cached || cached.id !== change.id || cached.version < change.version) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.sellerApplication })
          }
          return
        }
        case "admin_accounts": {
          const cached = queryClient.getQueryData<Account[]>(queryKeys.adminAccounts)
          const target = cached?.find((item) => item.id === change.id)
          if (!target || target.version < change.version) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.adminAccounts })
          }
          void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview })
          return
        }
        case "admin_seller_applications": {
          const cached = queryClient.getQueryData<SellerApplicationData[]>(
            queryKeys.adminSellerApplications
          )
          const target = cached?.find((item) => item.id === change.id)
          if (!target || target.version < change.version) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.adminSellerApplications })
          }
          void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview })
        }
      }
    }

    source.addEventListener("ready", onReady)
    source.addEventListener("sync.required", onSyncRequired)
    source.addEventListener("change", onChange)

    return () => {
      source.removeEventListener("ready", onReady)
      source.removeEventListener("sync.required", onSyncRequired)
      source.removeEventListener("change", onChange)
      source.close()
    }
  }, [account?.id, account?.accountStatus, queryClient])
}
