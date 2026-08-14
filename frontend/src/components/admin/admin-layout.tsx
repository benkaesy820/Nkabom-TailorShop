import { useState, type ReactNode } from "react"
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Audit01Icon,
  DashboardSquare01Icon,
  FileValidationIcon,
  Logout01Icon,
  Menu01Icon,
  Notification02Icon,
  Search01Icon,
  Settings01Icon,
  Shield01Icon,
  Store01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { NkabomLogo } from "@/components/brand/nkabom-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Account } from "@/lib/auth"
import { cn } from "@/lib/utils"

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        href: "#admin/overview",
        icon: DashboardSquare01Icon,
        available: true,
      },
      {
        label: "Seller applications",
        icon: FileValidationIcon,
        available: false,
      },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { label: "Accounts", icon: UserGroupIcon, available: false },
      { label: "Sellers", icon: Store01Icon, available: false },
      { label: "Trust & safety", icon: Shield01Icon, available: false },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Audit trail", icon: Audit01Icon, available: false },
      { label: "Settings", icon: Settings01Icon, available: false },
    ],
  },
] as const

export function AdminLayout({
  account,
  children,
  onSignOut,
}: {
  account: Account | null
  children: ReactNode
  onSignOut: () => void
}) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const roleLabel = account?.isAdministrator
    ? "Administrator"
    : "Layout preview"

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-8 items-center justify-between gap-3 border-b bg-foreground px-3 text-[0.6875rem] text-background sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="truncate font-semibold tracking-wide uppercase">
            Nkabom administration
          </span>
        </div>
        <span className="hidden text-background/65 sm:block">
          Internal operations workspace
        </span>
      </div>

      <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b bg-background/95 px-3 supports-backdrop-filter:backdrop-blur-md sm:px-5 lg:px-6">
        <Sheet
          open={mobileNavigationOpen}
          onOpenChange={setMobileNavigationOpen}
        >
          <SheetTrigger asChild>
            <Button
              aria-label="Open admin navigation"
              className="lg:hidden"
              size="icon"
              variant="outline"
            >
              <HugeiconsIcon icon={Menu01Icon} />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="w-[min(20rem,calc(100vw-2rem))] p-0"
            side="left"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Admin navigation</SheetTitle>
              <SheetDescription>
                Navigate the Nkabom administration workspace.
              </SheetDescription>
            </SheetHeader>
            <SidebarContent mobile />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-muted-foreground sm:inline">Admin</span>
          <span className="hidden text-border sm:inline">/</span>
          <span className="truncate font-semibold">Overview</span>
        </div>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-1 sm:gap-2">
          <div className="relative hidden w-[min(26rem,38vw)] lg:block">
            <HugeiconsIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
            />
            <Input
              aria-label="Search admin workspace"
              className="h-9 rounded-xl bg-muted/35 pl-9"
              placeholder="Search administration…"
              type="search"
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Admin notifications"
                size="icon"
                variant="ghost"
              >
                <HugeiconsIcon icon={Notification02Icon} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>Notifications</TooltipContent>
          </Tooltip>
          <ThemeToggle size="icon" />

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open administrator account menu"
                className="inline-flex h-10 max-w-52 items-center gap-2 rounded-xl border bg-card px-1.5 transition-[background-color,transform] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none active:scale-[0.98] sm:pr-2.5"
                type="button"
              >
                <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {account?.initials ?? "AD"}
                </span>
                <span className="hidden min-w-0 flex-1 flex-col text-left md:flex">
                  <span className="truncate text-xs font-semibold">
                    {account?.fullName ?? "Administrator"}
                  </span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    {roleLabel}
                  </span>
                </span>
                <HugeiconsIcon
                  aria-hidden="true"
                  className="hidden size-3 text-muted-foreground md:block"
                  icon={ArrowDown01Icon}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-xl p-1.5"
              sideOffset={8}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2.5 py-2">
                  <span className="block truncate text-xs font-semibold">
                    {account?.fullName ?? "Administrator"}
                  </span>
                  <span className="block truncate text-[0.6875rem] font-normal text-muted-foreground">
                    {account?.email ?? roleLabel}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="#discover">
                    <HugeiconsIcon icon={ArrowLeft01Icon} />
                    Return to marketplace
                  </a>
                </DropdownMenuItem>
                {account ? (
                  <DropdownMenuItem onSelect={onSignOut} variant="destructive">
                    <HugeiconsIcon icon={Logout01Icon} />
                    Sign out
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
          <SidebarContent />
        </aside>
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-20 items-center border-b px-4">
        <a
          aria-label="Nkabom admin overview"
          className="rounded-lg transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/30"
          href="#admin/overview"
        >
          <NkabomLogo className="h-11 w-auto" variant="horizontal" />
        </a>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5"
      >
        {navigationGroups.map((group) => (
          <div className="flex flex-col gap-1" key={group.label}>
            <p className="px-3 pb-1 text-[0.625rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {group.label}
            </p>
            {group.items.map((item) => {
              const content = (
                <span
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-[background-color,color,transform]",
                    item.available
                      ? "bg-primary font-semibold text-primary-foreground shadow-xs active:scale-[0.99]"
                      : "cursor-default text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon aria-hidden="true" icon={item.icon} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {!item.available ? (
                    <span className="text-[0.5625rem] tracking-wide uppercase opacity-65">
                      Soon
                    </span>
                  ) : null}
                </span>
              )

              if (!item.available) return <div key={item.label}>{content}</div>
              if (mobile)
                return (
                  <SheetClose asChild key={item.label}>
                    <a href={item.href}>{content}</a>
                  </SheetClose>
                )
              return (
                <a href={item.href} key={item.label}>
                  {content}
                </a>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <p className="rounded-xl bg-muted/45 px-3 py-2.5 text-[0.6875rem] leading-5 text-muted-foreground">
          Layout preview. Operational pages and live administrator data come
          next.
        </p>
      </div>
    </div>
  )
}
