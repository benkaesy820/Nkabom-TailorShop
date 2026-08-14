/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  Alert02Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  MultiplicationSignIcon,
  RotateCcwSquareIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"

export type ToastVariant = "success" | "error" | "warning" | "info" | "undo"
export type ToastPosition =
  | "top-right"
  | "top-center"
  | "bottom-right"
  | "bottom-center"

export type ToastOptions = {
  id?: string
  title: string
  message: string
  tag?: string
  variant?: ToastVariant
  duration?: number
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

type ToastRecord = ToastOptions & {
  id: string
  variant: ToastVariant
  duration: number
  createdAt: number
}

type ToastContextValue = {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const positionClasses: Record<ToastPosition, string> = {
  "top-right": "top-0 right-0 items-end",
  "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "right-0 bottom-0 items-end",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
}

const variantStyles: Record<
  ToastVariant,
  {
    badge: string
    iconColor: string
    iconContainer: string
    defaultTag: string
  }
> = {
  success: {
    badge: "bg-success/10 text-success border-success/20 dark:bg-success/15 dark:border-success/30",
    iconColor: "text-success",
    iconContainer: "border-success/20 bg-success/10 dark:bg-success/15 dark:border-success/30",
    defaultTag: "Confirmed",
  },
  error: {
    badge: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15 dark:border-destructive/30",
    iconColor: "text-destructive",
    iconContainer: "border-destructive/20 bg-destructive/10 dark:bg-destructive/15 dark:border-destructive/30",
    defaultTag: "Security",
  },
  warning: {
    badge: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/15 dark:border-warning/30",
    iconColor: "text-warning",
    iconContainer: "border-warning/20 bg-warning/10 dark:bg-warning/15 dark:border-warning/30",
    defaultTag: "Notice",
  },
  info: {
    badge: "bg-notice/10 text-notice border-notice/20 dark:bg-notice/15 dark:border-notice/30",
    iconColor: "text-notice",
    iconContainer: "border-notice/20 bg-notice/10 dark:bg-notice/15 dark:border-notice/30",
    defaultTag: "Guild Notice",
  },
  undo: {
    badge: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:border-primary/30",
    iconColor: "text-primary",
    iconContainer: "border-primary/20 bg-primary/10 dark:bg-primary/15 dark:border-primary/30",
    defaultTag: "Action",
  },
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const icon =
    variant === "success"
      ? CheckmarkCircle02Icon
      : variant === "error"
        ? Shield01Icon
        : variant === "warning"
          ? Alert02Icon
          : variant === "undo"
            ? RotateCcwSquareIcon
            : InformationCircleIcon

  const config = variantStyles[variant]

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-xs sm:size-10",
        config.iconContainer
      )}
    >
      <HugeiconsIcon
        className={cn("size-4.5 sm:size-5", config.iconColor)}
        icon={icon}
        strokeWidth={1.8}
      />
    </span>
  )
}

export function ToastProvider({
  children,
  position = "top-right",
}: {
  children: ReactNode
  position?: ToastPosition
}) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const clear = useCallback(() => setToasts([]), [])

  const toast = useCallback((options: ToastOptions) => {
    const id = options.id ?? crypto.randomUUID()
    const nextToast: ToastRecord = {
      ...options,
      id,
      variant: options.variant ?? "success",
      duration: options.duration ?? 5000,
      createdAt: Date.now(),
    }

    setToasts((current) =>
      [nextToast, ...current.filter((item) => item.id !== id)].slice(0, 6)
    )

    return id
  }, [])

  useEffect(() => {
    const now = Date.now()
    const expiringToasts = toasts.filter((item) => item.duration > 0)

    if (expiringToasts.length === 0) return

    const nextExpiry = Math.min(
      ...expiringToasts.map((item) =>
        Math.max(0, item.createdAt + item.duration - now)
      )
    )
    const timeout = window.setTimeout(() => {
      const currentTime = Date.now()
      setToasts((current) =>
        current.filter(
          (item) =>
            item.duration === 0 || currentTime < item.createdAt + item.duration
        )
      )
    }, nextExpiry)

    return () => window.clearTimeout(timeout)
  }, [toasts])

  const contextValue = useMemo(
    () => ({ toast, dismiss, clear }),
    [toast, dismiss, clear]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-atomic="false"
        aria-live="polite"
        aria-relevant="additions removals"
        className={cn(
          "pointer-events-none fixed z-50 flex w-full max-w-[min(25rem,calc(100vw-1.5rem))] flex-col gap-2 p-3 sm:p-4",
          positionClasses[position]
        )}
      >
        {toasts.map((item) => {
          const config = variantStyles[item.variant]
          const displayTag = item.tag || config.defaultTag

          return (
            <div
              className="pointer-events-auto relative flex w-full animate-in flex-col rounded-xl border border-border bg-card p-3 text-card-foreground shadow-lg shadow-black/5 duration-200 fade-in slide-in-from-top-3 sm:rounded-2xl sm:p-3.5 sm:slide-in-from-right-3 dark:shadow-2xl dark:shadow-black/60"
              key={item.id}
              role={item.variant === "error" ? "alert" : "status"}
            >
              <div className="flex items-start gap-3">
                <ToastIcon variant={item.variant} />
                <div className="flex min-w-0 flex-1 flex-col pr-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="font-serif text-[0.9375rem] font-semibold tracking-wide text-foreground sm:text-base">
                      {item.title}
                    </h2>
                    {displayTag ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.625rem] font-medium tracking-normal",
                          config.badge
                        )}
                      >
                        {displayTag}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-sans text-xs leading-relaxed text-muted-foreground">
                    {item.message}
                  </p>
                </div>
                <button
                  aria-label={`Dismiss ${item.title}`}
                  className="absolute top-3 right-3 flex size-5.5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  onClick={() => dismiss(item.id)}
                  type="button"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-3.5"
                    icon={MultiplicationSignIcon}
                  />
                </button>
              </div>

              {item.actionLabel ? (
                <div className="mt-2.5 flex items-center gap-2 pl-12 sm:pl-13">
                  <button
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      try {
                        item.onAction?.()
                      } finally {
                        dismiss(item.id)
                      }
                    }}
                    type="button"
                  >
                    {item.variant === "undo" ? (
                      <HugeiconsIcon
                        className="size-3"
                        icon={RotateCcwSquareIcon}
                      />
                    ) : (
                      <HugeiconsIcon
                        className="size-3"
                        icon={ArrowRight01Icon}
                      />
                    )}
                    <span>{item.actionLabel}</span>
                  </button>
                  {item.secondaryActionLabel ? (
                    <button
                      className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        try {
                          item.onSecondaryAction?.()
                        } finally {
                          dismiss(item.id)
                        }
                      }}
                      type="button"
                    >
                      {item.secondaryActionLabel}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }

  return context
}
