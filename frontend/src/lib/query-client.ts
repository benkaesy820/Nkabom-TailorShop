import { QueryClient } from "@tanstack/react-query"

export const queryKeys = {
  account: ["account"] as const,
  sellerApplication: ["seller-application"] as const,
  adminOverview: ["admin", "overview"] as const,
  adminAccounts: ["admin", "accounts"] as const,
  adminSellerApplications: ["admin", "seller-applications"] as const,
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      retryOnMount: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
    mutations: {
      retry: false,
    },
  },
})
