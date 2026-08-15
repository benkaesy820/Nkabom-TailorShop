import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  ArrowDown01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  Coins01Icon,
  FavouriteIcon,
  Home01Icon,
  Location01Icon,
  Menu01Icon,
  Mail01Icon,
  Message01Icon,
  Notification02Icon,
  SearchIcon,
  Shield01Icon,
  ShoppingBag01Icon,
  SparklesIcon,
  Store01Icon,
  UserIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  NkabomLogo,
  NkabomResponsiveLogo,
} from "@/components/brand/nkabom-logo"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SellerApplication } from "@/components/seller-application"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast-provider"
import {
  getCurrentAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
  signIn,
  signOut,
  verifyEmail,
  type Account,
} from "@/lib/auth"
import { queryKeys } from "@/lib/query-client"
import { useRealtimeSync } from "@/lib/realtime"
import { cn } from "@/lib/utils"
import { AdminAccountsPage } from "@/pages/admin/admin-accounts-page"
import { AdminOverviewPage } from "@/pages/admin/admin-overview-page"
import { AdminSellerApplicationsPage } from "@/pages/admin/admin-seller-applications-page"

const navigation = [
  {
    label: "Discover",
    href: "#discover",
    icon: Home01Icon,
    minBreakpoint: "sm:inline-flex",
    menuOverflowClass: "sm:hidden",
  },
  {
    label: "Tailors",
    href: "#tailors",
    icon: Store01Icon,
    minBreakpoint: "sm:inline-flex",
    menuOverflowClass: "sm:hidden",
  },
  {
    label: "Orders",
    href: "#orders",
    icon: ShoppingBag01Icon,
    badge: "2",
    minBreakpoint: "md:inline-flex",
    menuOverflowClass: "md:hidden",
  },
  {
    label: "Messages",
    href: "#messages",
    icon: Message01Icon,
    dot: true,
    minBreakpoint: "lg:inline-flex",
    menuOverflowClass: "lg:hidden",
  },
] as const

const categories = [
  "All crafts",
  "Bespoke Tailoring",
  "Kente Weaving",
  "Leather & Footwear",
  "Gold & Brass Smithing",
  "Beadwork & Adornment",
  "Wood & Stool Carving",
  "Smock Embroidery",
] as const

const destinations = [
  {
    label: "Browse verified tailors",
    description: "Explore Nkabom Guild ateliers and their work.",
    category: "All crafts",
    href: "#tailors",
    icon: Store01Icon,
  },
  {
    label: "Bespoke commissions",
    description: "Start with a made-to-measure garment brief.",
    category: "Bespoke Tailoring",
    href: "#tailors",
    icon: Store01Icon,
  },
  {
    label: "Kente specialists",
    description: "Find artisans working with woven Ghanaian cloth.",
    category: "Kente Weaving",
    href: "#tailors",
    icon: Store01Icon,
  },
  {
    label: "Leather & Footwear makers",
    description: "Handcrafted slippers, shoes, and luxury leather goods.",
    category: "Leather & Footwear",
    href: "#tailors",
    icon: Store01Icon,
  },
  {
    label: "Gold & Brass smiths",
    description: "Adinkra pendants, cuffs, and heirloom royal metalsmithing.",
    category: "Gold & Brass Smithing",
    href: "#tailors",
    icon: Store01Icon,
  },
  {
    label: "Beadwork & Adornment",
    description: "Krobo powdered glass beads and ceremonial waist adornments.",
    category: "Beadwork & Adornment",
    href: "#tailors",
    icon: Store01Icon,
  },
  {
    label: "Wood & Stool carving",
    description: "Hand-hewn royal stools, ceremonial staff, and bespoke masks.",
    category: "Wood & Stool Carving",
    href: "#tailors",
    icon: Store01Icon,
  },
  {
    label: "Smock Embroidery",
    description: "Authentic handwoven Northern Fugu and royal embroidery.",
    category: "Smock Embroidery",
    href: "#tailors",
    icon: Store01Icon,
  },
  {
    label: "Your orders",
    description: "Review quotes, fittings, payments, and delivery.",
    category: "All crafts",
    href: "#orders",
    icon: ShoppingBag01Icon,
  },
  {
    label: "Saved products",
    description: "Return to tailors and pieces you bookmarked.",
    category: "All crafts",
    href: "#saved",
    icon: FavouriteIcon,
  },
  {
    label: "Become a seller",
    description: "Apply to join the Nkabom Guild artisan network.",
    category: "All crafts",
    href: "#become-a-seller",
    icon: Store01Icon,
  },
] as const

const sellerApplicationHashes = [
  "#become-a-seller",
  "#seller-application",
  "#seller-application-review",
  "#seller-application-status",
] as const

const notifications = [
  {
    id: "quote",
    title: "Bespoke quote received",
    description: "A new quote is ready for review in your orders.",
    time: "10m ago",
  },
  {
    id: "verified",
    title: "Guild verification complete",
    description: "A saved atelier has completed Nkabom identity verification.",
    time: "2h ago",
  },
] as const

const currencies = [
  { value: "GHS", label: "GH₵ GHS" },
  { value: "USD", label: "$ USD" },
  { value: "GBP", label: "£ GBP" },
  { value: "EUR", label: "€ EUR" },
] as const

const regions = [
  "Greater Accra",
  "Ashanti (Kumasi)",
  "Western (Takoradi)",
  "Central (Cape Coast)",
  "Eastern (Koforidua)",
  "Northern (Tamale)",
  "Volta (Ho)",
  "International (Diaspora)",
] as const

type AuthMode =
  "sign-in" | "register" | "forgot" | "verify-email" | "reset-password" | "sso"

const authHashes: Record<AuthMode, string> = {
  "sign-in": "#sign-in",
  register: "#register",
  forgot: "#forgot-password",
  "verify-email": "#verify-email",
  "reset-password": "#reset-password",
  sso: "#sso",
}

const authContent: Record<
  AuthMode,
  { title: string; description: string; submitLabel: string }
> = {
  "sign-in": {
    title: "Welcome back",
    description:
      "Sign in to continue with your orders, messages, and saved work.",
    submitLabel: "Sign in",
  },
  register: {
    title: "Create your Nkabom account",
    description:
      "Discover trusted Ghanaian makers and manage every commission in one place.",
    submitLabel: "Create account",
  },
  forgot: {
    title: "Reset your password",
    description:
      "We’ll send a secure password reset link to your email address.",
    submitLabel: "Send reset link",
  },
  "verify-email": {
    title: "Verify your email",
    description: "Confirm this email address to activate your Nkabom account.",
    submitLabel: "Verify email",
  },
  "reset-password": {
    title: "Choose a new password",
    description: "Enter a new password for your Nkabom account.",
    submitLabel: "Reset password",
  },
  sso: {
    title: "Organization sign-on",
    description: "Single sign-on for approved organizations is coming soon.",
    submitLabel: "SSO coming soon",
  },
}

function getAuthMode(hash: string): AuthMode | null {
  const entry = Object.entries(authHashes).find(([, value]) => value === hash)
  return entry ? (entry[0] as AuthMode) : null
}

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      label: "",
      color: "text-muted-foreground",
      hasMinLength: false,
      hasUpperLower: false,
      hasNumber: false,
      hasSpecial: false,
    }
  }

  const hasMinLength = password.length >= 8
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  let score = 0
  if (hasMinLength) score++
  if (hasUpperLower) score++
  if (hasNumber) score++
  if (hasSpecial) score++

  let label = "Strength: Weak (< 1 second)"
  let color = "text-destructive"

  if (score === 2) {
    label = "Strength: Fair (10 minutes)"
    color = "text-warning"
  } else if (score === 3) {
    label = "Strength: Good (3 months)"
    color = "text-success"
  } else if (score >= 4) {
    label = "Strength: Strong (100+ years)"
    color = "text-success"
  }

  return {
    score,
    label,
    color,
    hasMinLength,
    hasUpperLower,
    hasNumber,
    hasSpecial,
  }
}

function AuthPage({
  mode,
  onAuthenticated,
}: {
  mode: AuthMode
  onAuthenticated: (account: Account) => void
}) {
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const actionToken =
    new URLSearchParams(window.location.search).get("token") ?? ""
  const content = authContent[mode]
  const usesPassword =
    mode === "sign-in" || mode === "register" || mode === "reset-password"
  const usesEmail =
    mode === "sign-in" || mode === "register" || mode === "forgot"

  const strength = getPasswordStrength(password)
  const isConfirmMismatch =
    (mode === "register" || mode === "reset-password") &&
    passwordConfirmation.length > 0 &&
    password !== passwordConfirmation

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode === "register" || mode === "reset-password") {
      if (password !== passwordConfirmation) {
        // In-line error is already visibly active above confirm password field
        return
      }
      if (password.length < 8) {
        // In-line requirement indicator is active
        return
      }
    }

    if (mode === "sign-in" || mode === "register") {
      setSubmitting(true)
      try {
        const result =
          mode === "register"
            ? await registerAccount({
                fullName,
                email,
                password,
                passwordConfirmation,
              })
            : await signIn({ email, password })
        if (mode === "register") {
          toast({
            title: "Check your email",
            message:
              "Open the verification link in the local development inbox.",
            tag: "Activation Link",
            variant: "success",
          })
          window.location.hash = authHashes["sign-in"]
          return
        }
        onAuthenticated(result)
        toast({
          title: "Welcome back",
          message: `Signed in as ${result.fullName ?? result.email}.`,
          tag: "Customer Access",
          variant: "success",
        })
        window.location.hash = "#discover"
      } catch (error) {
        toast({
          title: mode === "register" ? "Account not created" : "Sign in failed",
          message: error instanceof Error ? error.message : "Please try again.",
          tag: "Security",
          variant: "error",
        })
      } finally {
        setSubmitting(false)
      }
      return
    }

    setSubmitting(true)
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email)
        toast({
          title: "Check your email",
          message:
            "If the account exists, a reset link is in the development inbox.",
          tag: "Recovery",
          variant: "success",
        })
      } else if (mode === "verify-email") {
        if (!actionToken) {
          throw new Error("This verification link is missing its token.")
        }
        await verifyEmail(actionToken)
        toast({
          title: "Email verified",
          message: "You can now sign in.",
          tag: "Verified",
          variant: "success",
        })
        window.location.hash = authHashes["sign-in"]
      } else if (mode === "reset-password") {
        await resetPassword({
          token: actionToken,
          password,
          passwordConfirmation,
        })
        toast({
          title: "Password reset",
          message: "Sign in with your new password.",
          tag: "Password Updated",
          variant: "success",
        })
        window.location.hash = authHashes["sign-in"]
      }
    } catch (error) {
      toast({
        title: "Authentication action failed",
        message:
          error instanceof Error ? error.message : "Please request a new link.",
        tag: "Security",
        variant: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30 text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-3 supports-backdrop-filter:backdrop-blur-md sm:px-5 lg:px-8">
        <a
          aria-label="Back to Nkabom marketplace"
          className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          href="#discover"
        >
          <NkabomLogo
            className="h-14 w-auto sm:h-[3.75rem]"
            variant="horizontal"
          />
        </a>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle size="icon-lg" />
          <Button asChild className="h-10 px-3 sm:px-4" variant="outline">
            <a href="#discover">
              <HugeiconsIcon data-icon="inline-start" icon={ArrowLeft02Icon} />
              <span className="hidden sm:inline">Back to marketplace</span>
              <span className="sm:hidden">Marketplace</span>
            </a>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-3 sm:p-4 lg:p-5">
        <section className="my-auto grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-2xl sm:rounded-3xl md:grid-cols-[0.82fr_1.18fr] lg:max-w-[57rem]">
          <aside className="hidden flex-col justify-between bg-primary bg-[radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:14px_14px] p-6 text-primary-foreground md:flex lg:p-7">
            <div className="flex flex-col gap-4">
              <NkabomLogo
                className="h-9 w-auto self-start"
                tone="dark"
                variant="horizontal"
              />
              <div className="flex max-w-sm flex-col gap-2.5">
                <p className="text-xs font-semibold tracking-[0.14em] uppercase opacity-75">
                  Made together in Ghana
                </p>
                <h2 className="font-heading text-2xl leading-tight font-semibold sm:text-[1.65rem]">
                  Your trusted path from idea to finished craft.
                </h2>
                <p className="text-xs leading-5 opacity-85 sm:text-sm sm:leading-6">
                  Create one account to explore makers and keep future
                  marketplace activity connected to your identity.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-primary-foreground/20 bg-black/15 p-4 backdrop-blur-xs">
              <p className="font-heading text-sm leading-snug italic sm:text-base">
                “One account can grow with your marketplace activity as more
                Nkabom features are introduced.”
              </p>
              <div className="mt-2.5 flex items-center justify-between text-xs opacity-85">
                <span className="text-[0.6875rem] font-medium sm:text-xs">
                  Normal accounts by default
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[0.6875rem] font-medium text-primary-foreground">
                  Seller access by approval
                </span>
              </div>
            </div>
          </aside>

          <div
            className={cn(
              "flex flex-col justify-center p-5 sm:p-6 lg:p-7",
              mode === "register"
                ? "py-4 sm:py-5 lg:py-5.5"
                : "py-6 sm:py-7 lg:py-8"
            )}
          >
            <div
              className={cn(
                "mx-auto flex w-full max-w-md flex-col",
                mode === "register" ? "gap-2 sm:gap-2.5" : "gap-3.5 sm:gap-4"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-primary uppercase">
                  Secure Nkabom access
                </p>
                <a
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  href={
                    mode === "sign-in" ? "#discover" : authHashes["sign-in"]
                  }
                >
                  <HugeiconsIcon className="size-3" icon={ArrowLeft02Icon} />
                  Back
                </a>
              </div>

              <div
                className={cn(
                  "flex flex-col",
                  mode === "register" ? "gap-0.5" : "gap-1"
                )}
              >
                <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {content.title}
                </h1>
                <p className="text-xs leading-5 text-muted-foreground">
                  {content.description}
                </p>
              </div>

              {mode === "sso" ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border bg-muted/40 px-6 py-10 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HugeiconsIcon className="size-6" icon={Shield01Icon} />
                  </span>
                  <p className="font-serif text-xl font-semibold">
                    Coming soon
                  </p>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    We’re preparing secure organization sign-on for guild
                    partners and approved teams.
                  </p>
                  <Button asChild className="mt-2" variant="outline">
                    <a href={authHashes["sign-in"]}>
                      <HugeiconsIcon
                        data-icon="inline-start"
                        icon={ArrowLeft02Icon}
                      />
                      Back to sign in
                    </a>
                  </Button>
                </div>
              ) : mode === "verify-email" ? (
                <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                  {!actionToken ? (
                    <p className="rounded-xl border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
                      Open the verification link from your email. This page
                      cannot verify an account without that link.
                    </p>
                  ) : null}
                  <Button
                    className="mt-1 h-11 w-full text-xs font-semibold sm:text-sm"
                    disabled={submitting || !actionToken}
                    size="lg"
                    type="submit"
                  >
                    {submitting ? "Verifying..." : content.submitLabel}
                    <HugeiconsIcon
                      data-icon="inline-end"
                      icon={ArrowRight02Icon}
                    />
                  </Button>

                  <div className="pt-1 text-center">
                    <a
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      href={authHashes["sign-in"]}
                    >
                      <HugeiconsIcon
                        className="size-3"
                        icon={ArrowLeft02Icon}
                      />
                      Back to sign in
                    </a>
                  </div>
                </form>
              ) : (
                <form
                  className={cn(
                    "flex flex-col",
                    mode === "register" ? "gap-2" : "gap-3"
                  )}
                  onSubmit={handleSubmit}
                >
                  <FieldGroup
                    className={cn(mode === "register" ? "gap-2" : "gap-3")}
                  >
                    {mode === "register" ? (
                      <Field className="gap-1">
                        <FieldLabel
                          className="text-xs font-medium"
                          htmlFor="auth-name"
                        >
                          Full name
                        </FieldLabel>
                        <InputGroup className="h-10 rounded-xl">
                          <InputGroupAddon
                            align="inline-start"
                            className="pl-3"
                          >
                            <HugeiconsIcon
                              aria-hidden="true"
                              className="size-4.5 text-muted-foreground"
                              icon={UserIcon}
                            />
                          </InputGroupAddon>
                          <InputGroupInput
                            autoComplete="name"
                            className="text-xs sm:text-sm"
                            id="auth-name"
                            onChange={(event) =>
                              setFullName(event.target.value)
                            }
                            placeholder="Ama Mensah"
                            required
                            value={fullName}
                          />
                        </InputGroup>
                      </Field>
                    ) : null}

                    {usesEmail ? (
                      <Field className="gap-1">
                        <div className="flex items-center justify-between">
                          <FieldLabel
                            className="text-xs font-medium"
                            htmlFor="auth-email"
                          >
                            Email address
                          </FieldLabel>
                        </div>
                        <InputGroup
                          className={cn(
                            "rounded-xl",
                            mode === "register" ? "h-10" : "h-11"
                          )}
                        >
                          <InputGroupAddon
                            align="inline-start"
                            className="pl-3"
                          >
                            <HugeiconsIcon
                              aria-hidden="true"
                              className="size-4.5 text-muted-foreground"
                              icon={Mail01Icon}
                            />
                          </InputGroupAddon>
                          <InputGroupInput
                            autoComplete="email"
                            className="text-xs sm:text-sm"
                            id="auth-email"
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            required
                            type="email"
                            value={email}
                          />
                        </InputGroup>
                      </Field>
                    ) : null}

                    {usesPassword ? (
                      <Field className="gap-1">
                        <div className="flex items-center justify-between gap-3">
                          <FieldLabel
                            className="text-xs font-medium"
                            htmlFor="auth-password"
                          >
                            Password
                          </FieldLabel>
                          {mode === "sign-in" ? (
                            <a
                              className="text-xs font-medium text-primary hover:underline"
                              href={authHashes.forgot}
                            >
                              Forgot password?
                            </a>
                          ) : (
                            strength.label && (
                              <span
                                className={cn(
                                  "text-[0.6875rem] font-medium transition-colors",
                                  strength.color
                                )}
                              >
                                {strength.label}
                              </span>
                            )
                          )}
                        </div>
                        <InputGroup
                          className={cn(
                            "rounded-xl",
                            mode === "register" ? "h-10" : "h-11"
                          )}
                        >
                          <InputGroupAddon
                            align="inline-start"
                            className="pl-3"
                          >
                            <HugeiconsIcon
                              aria-hidden="true"
                              className="size-4.5 text-muted-foreground"
                              icon={Shield01Icon}
                            />
                          </InputGroupAddon>
                          <InputGroupInput
                            autoComplete={
                              mode === "register"
                                ? "new-password"
                                : "current-password"
                            }
                            className="text-xs sm:text-sm"
                            id="auth-password"
                            minLength={8}
                            onChange={(event) =>
                              setPassword(event.target.value)
                            }
                            placeholder="At least 8 characters"
                            required
                            type={showPassword ? "text" : "password"}
                            value={password}
                          />
                          <InputGroupAddon
                            align="inline-end"
                            className="pr-1.5 has-[>button]:mr-0"
                          >
                            <Button
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setShowPassword((current) => !current)
                              }
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <HugeiconsIcon
                                aria-hidden="true"
                                className="size-4.5"
                                icon={showPassword ? ViewOffIcon : ViewIcon}
                              />
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>

                        {mode === "register" && password.length > 0 ? (
                          <div className="flex flex-col gap-1.5 pt-0.5">
                            <div className="grid grid-cols-4 gap-1.5">
                              <div
                                className={cn(
                                  "h-1 rounded-full transition-colors",
                                  strength.score >= 1
                                    ? strength.score === 1
                                      ? "bg-destructive"
                                      : strength.score === 2
                                        ? "bg-warning"
                                        : "bg-success"
                                    : "bg-muted"
                                )}
                              />
                              <div
                                className={cn(
                                  "h-1 rounded-full transition-colors",
                                  strength.score >= 2
                                    ? strength.score === 2
                                      ? "bg-warning"
                                      : "bg-success"
                                    : "bg-muted"
                                )}
                              />
                              <div
                                className={cn(
                                  "h-1 rounded-full transition-colors",
                                  strength.score >= 3
                                    ? "bg-success"
                                    : "bg-muted"
                                )}
                              />
                              <div
                                className={cn(
                                  "h-1 rounded-full transition-colors",
                                  strength.score >= 4
                                    ? "bg-success"
                                    : "bg-muted"
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-x-2 gap-y-0.5 pt-0.5 text-[0.6875rem] sm:grid-cols-2">
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 transition-colors",
                                  strength.hasMinLength
                                    ? "font-medium text-success"
                                    : "text-muted-foreground/80"
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-3.5 items-center justify-center rounded-full text-[0.5625rem]",
                                    strength.hasMinLength
                                      ? "bg-success/15 text-success"
                                      : "border border-muted-foreground/30"
                                  )}
                                >
                                  {strength.hasMinLength ? "✓" : ""}
                                </span>
                                <span>At least 8 characters</span>
                              </div>
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 transition-colors",
                                  strength.hasUpperLower
                                    ? "font-medium text-success"
                                    : "text-muted-foreground/80"
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-3.5 items-center justify-center rounded-full text-[0.5625rem]",
                                    strength.hasUpperLower
                                      ? "bg-success/15 text-success"
                                      : "border border-muted-foreground/30"
                                  )}
                                >
                                  {strength.hasUpperLower ? "✓" : ""}
                                </span>
                                <span>Mix of uppercase & lowercase</span>
                              </div>
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 transition-colors",
                                  strength.hasNumber
                                    ? "font-medium text-success"
                                    : "text-muted-foreground/80"
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-3.5 items-center justify-center rounded-full text-[0.5625rem]",
                                    strength.hasNumber
                                      ? "bg-success/15 text-success"
                                      : "border border-muted-foreground/30"
                                  )}
                                >
                                  {strength.hasNumber ? "✓" : ""}
                                </span>
                                <span>Includes at least 1 number</span>
                              </div>
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 transition-colors",
                                  strength.hasSpecial
                                    ? "font-medium text-success"
                                    : "text-muted-foreground/80"
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-3.5 items-center justify-center rounded-full text-[0.5625rem]",
                                    strength.hasSpecial
                                      ? "bg-success/15 text-success"
                                      : "border border-muted-foreground/30"
                                  )}
                                >
                                  {strength.hasSpecial ? "✓" : ""}
                                </span>
                                <span>
                                  Includes a special symbol (!@#$%^&*)
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </Field>
                    ) : null}

                    {mode === "register" || mode === "reset-password" ? (
                      <Field className="gap-1">
                        <div className="flex items-center justify-between">
                          <FieldLabel
                            className="text-xs font-medium"
                            htmlFor="auth-password-confirmation"
                          >
                            Confirm password
                          </FieldLabel>
                          {isConfirmMismatch ? (
                            <span className="text-[0.6875rem] font-medium text-destructive">
                              ✕ Passwords do not match
                            </span>
                          ) : null}
                        </div>
                        <InputGroup
                          className={cn(
                            "h-10 rounded-xl transition-colors",
                            isConfirmMismatch &&
                              "border-destructive/80 text-destructive focus-within:border-destructive"
                          )}
                        >
                          <InputGroupAddon
                            align="inline-start"
                            className="pl-3"
                          >
                            <HugeiconsIcon
                              aria-hidden="true"
                              className={cn(
                                "size-4.5",
                                isConfirmMismatch
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              )}
                              icon={Shield01Icon}
                            />
                          </InputGroupAddon>
                          <InputGroupInput
                            autoComplete="new-password"
                            className="text-xs sm:text-sm"
                            id="auth-password-confirmation"
                            minLength={8}
                            onChange={(event) =>
                              setPasswordConfirmation(event.target.value)
                            }
                            placeholder="Repeat your password"
                            required
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordConfirmation}
                          />
                          <InputGroupAddon
                            align="inline-end"
                            className="pr-1.5 has-[>button]:mr-0"
                          >
                            <Button
                              aria-label={
                                showConfirmPassword
                                  ? "Hide confirm password"
                                  : "Show confirm password"
                              }
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setShowConfirmPassword((current) => !current)
                              }
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <HugeiconsIcon
                                aria-hidden="true"
                                className="size-4.5"
                                icon={
                                  showConfirmPassword ? ViewOffIcon : ViewIcon
                                }
                              />
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>
                      </Field>
                    ) : null}
                  </FieldGroup>

                  <Button
                    className={cn(
                      "w-full text-xs font-semibold sm:text-sm",
                      mode === "register" ? "mt-1 h-10" : "mt-1.5 h-11"
                    )}
                    disabled={submitting}
                    size="lg"
                    type="submit"
                  >
                    {submitting
                      ? `${content.submitLabel}...`
                      : content.submitLabel}
                    <HugeiconsIcon
                      data-icon="inline-end"
                      icon={ArrowRight02Icon}
                    />
                  </Button>
                </form>
              )}

              <Separator className="my-0.5" />
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {mode === "sign-in" ? (
                  <>
                    <span>New to Nkabom?</span>
                    <a
                      className="font-semibold text-primary hover:underline"
                      href={authHashes.register}
                    >
                      Create an account
                    </a>
                    <span aria-hidden="true">·</span>
                    <a
                      className="font-medium hover:text-foreground"
                      href={authHashes.sso}
                    >
                      SSO — coming soon
                    </a>
                  </>
                ) : mode === "register" ? (
                  <>
                    <span>Already registered?</span>
                    <a
                      className="font-semibold text-primary hover:underline"
                      href={authHashes["sign-in"]}
                    >
                      Sign in
                    </a>
                  </>
                ) : (
                  <a
                    className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                    href={authHashes["sign-in"]}
                  >
                    <HugeiconsIcon
                      className="size-3.5"
                      icon={ArrowLeft02Icon}
                    />
                    Back to sign in
                  </a>
                )}
              </div>

              <div className="mt-2 border-t border-border/40 pt-2 text-center text-[0.6875rem] text-muted-foreground">
                Authentication is handled by the Nkabom API using an HTTP-only
                session cookie.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function IconTooltip({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  )
}

function AdminAccessState({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5 text-center text-foreground">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-card p-7 shadow-sm">
        <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-primary">
          <HugeiconsIcon icon={Shield01Icon} />
        </span>
        <h1 className="font-heading text-xl font-semibold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {children ? <div className="pt-1">{children}</div> : null}
      </div>
    </main>
  )
}

export function App() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const accountQuery = useQuery({
    queryKey: queryKeys.account,
    queryFn: async () => {
      try {
        return await getCurrentAccount()
      } catch {
        return null
      }
    },
  })
  const account = accountQuery.data ?? null
  const accountLoaded = !accountQuery.isPending
  useRealtimeSync(account)
  const [routeHash, setRouteHash] = useState(
    window.location.hash || "#discover"
  )
  const [authMode, setAuthMode] = useState<AuthMode | null>(() =>
    getAuthMode(window.location.hash)
  )
  const [category, setCategory] = useState("All crafts")
  const [currency, setCurrency] = useState("GHS")
  const [region, setRegion] = useState("Greater Accra")
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [compactSearchExpanded, setCompactSearchExpanded] = useState(false)
  const [compactResultsOpen, setCompactResultsOpen] = useState(false)
  const unreadCount = notifications.length
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const compactSearchRef = useRef<HTMLInputElement>(null)

  async function handleSignOut() {
    try {
      await signOut()
      queryClient.setQueryData<Account | null>(queryKeys.account, null)
      queryClient.removeQueries({ queryKey: ["admin"] })
      queryClient.removeQueries({ queryKey: queryKeys.sellerApplication })
      toast({
        title: "Signed out",
        message: "Your Nkabom session has ended safely.",
        tag: "Session Ended",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Could not sign out",
        message: error instanceof Error ? error.message : "Please try again.",
        tag: "Security",
        variant: "error",
      })
    }
  }

  useEffect(() => {
    function syncAuthRoute() {
      setRouteHash(window.location.hash || "#discover")
      setAuthMode(getAuthMode(window.location.hash))
    }

    window.addEventListener("hashchange", syncAuthRoute)
    return () => window.removeEventListener("hashchange", syncAuthRoute)
  }, [])

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return destinations.filter((item) => {
      const categoryMatches =
        category === "All crafts" || item.category === category
      const searchable =
        `${item.label} ${item.description} ${item.category}`.toLowerCase()
      return (
        categoryMatches &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      )
    })
  }, [category, query])

  useEffect(() => {
    if (!compactSearchExpanded) return

    const animationFrame = window.requestAnimationFrame(() => {
      compactSearchRef.current?.focus()
      setCompactResultsOpen(true)
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [compactSearchExpanded])

  const resultList = (
    <div
      aria-label="Search results"
      className="flex flex-col gap-1 p-1"
      role="listbox"
    >
      <p className="px-3 pt-2 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
        {query ? "Matching destinations" : "Quick access"}
      </p>
      {searchResults.length > 0 ? (
        searchResults.slice(0, 6).map((item) => (
          <Button
            asChild
            className="h-auto min-h-14 w-full justify-start gap-3 px-3 py-2.5 text-left whitespace-normal"
            key={`${item.category}-${item.label}`}
            variant="ghost"
          >
            <a
              href={item.href}
              onClick={() => {
                setSearchOpen(false)
                setCompactSearchExpanded(false)
                setCompactResultsOpen(false)
              }}
              role="option"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <HugeiconsIcon className="size-4" icon={item.icon} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </a>
          </Button>
        ))
      ) : (
        <div className="flex min-h-24 flex-col items-center justify-center gap-1 px-5 text-center">
          <p className="text-sm font-medium">No matching section yet</p>
          <p className="text-xs text-muted-foreground">
            Try another craft or a broader search.
          </p>
        </div>
      )}
    </div>
  )

  if (authMode) {
    return (
      <TooltipProvider delayDuration={250}>
        <AuthPage
          key={authMode}
          mode={authMode}
          onAuthenticated={(authenticatedAccount) =>
            queryClient.setQueryData(queryKeys.account, authenticatedAccount)
          }
        />
      </TooltipProvider>
    )
  }

  if (routeHash.startsWith("#admin/")) {
    if (!accountLoaded) {
      return (
        <TooltipProvider delayDuration={250}>
          <AdminAccessState
            description="Checking your current Nkabom role…"
            title="Checking administrator access"
          />
        </TooltipProvider>
      )
    }

    if (!account) {
      return (
        <TooltipProvider delayDuration={250}>
          <AdminAccessState
            description="Sign in with an administrator account to open this workspace."
            title="Administrator sign-in required"
          >
            <Button asChild>
              <a href="#sign-in">Sign in</a>
            </Button>
          </AdminAccessState>
        </TooltipProvider>
      )
    }

    if (account.role !== "administrator") {
      return (
        <TooltipProvider delayDuration={250}>
          <AdminAccessState
            description="Your current account does not have the administrator role."
            title="Administrator access required"
          >
            <Button asChild variant="outline">
              <a href="#discover">Return to marketplace</a>
            </Button>
          </AdminAccessState>
        </TooltipProvider>
      )
    }

    const adminPage =
      routeHash === "#admin/accounts" ? (
        <AdminAccountsPage currentAccountId={account.id} />
      ) : routeHash === "#admin/seller-applications" ? (
        <AdminSellerApplicationsPage />
      ) : (
        <AdminOverviewPage />
      )

    return (
      <TooltipProvider delayDuration={250}>
        <AdminLayout
          account={account}
          currentHash={routeHash}
          onSignOut={() => {
            void handleSignOut().then(() => {
              window.location.hash = "#discover"
            })
          }}
        >
          {adminPage}
        </AdminLayout>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/95 supports-backdrop-filter:backdrop-blur-md">
          {/* Top announcement & utility bar */}
          <div className="border-b border-white/10 bg-[#1c1815] text-[#fbf9f4] dark:border-border dark:bg-[#15110e]">
            <div className="flex h-9 w-full items-center justify-between gap-2 px-3 text-xs sm:px-5 xl:px-8">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <HugeiconsIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-brand-accent dark:text-[#f0b359]"
                  icon={SparklesIcon}
                />
                <p className="min-w-0 truncate text-[0.6875rem] font-medium text-[#fbf9f4]/90 sm:text-xs">
                  <span className="hidden sm:inline">
                    Discover Ghanaian makers and manage commissions in one place
                  </span>
                  <span className="sm:hidden">Made together in Ghana</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Select delivery region"
                      className="inline-flex h-6.5 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 text-[0.6875rem] font-medium text-[#fbf9f4] transition-colors hover:border-white/25 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-7 sm:gap-1.5 sm:px-2.5 sm:text-xs"
                      type="button"
                    >
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-primary dark:text-[#e27555]"
                        icon={Location01Icon}
                      />
                      <span className="max-w-[4.5rem] truncate sm:max-w-none">
                        {region}
                      </span>
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-3 shrink-0 text-[#fbf9f4]/60"
                        icon={ArrowDown01Icon}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 rounded-xl p-1.5"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2.5 py-1.5 text-[0.625rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        Delivery region
                      </DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        onValueChange={setRegion}
                        value={region}
                      >
                        {regions.map((item) => (
                          <DropdownMenuRadioItem
                            className="min-h-8 rounded-lg px-2.5 text-xs"
                            key={item}
                            value={item}
                          >
                            {item}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Select display currency"
                      className="inline-flex h-6.5 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 text-[0.6875rem] font-medium text-[#fbf9f4] transition-colors hover:border-white/25 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-7 sm:gap-1.5 sm:px-2.5 sm:text-xs"
                      type="button"
                    >
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-brand-accent dark:text-[#f0b359]"
                        icon={Coins01Icon}
                      />
                      <span>{currency}</span>
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-3 shrink-0 text-[#fbf9f4]/60"
                        icon={ArrowDown01Icon}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-44 rounded-xl p-1.5"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2.5 py-1.5 text-[0.625rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        Display currency
                      </DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        onValueChange={setCurrency}
                        value={currency}
                      >
                        {currencies.map((item) => (
                          <DropdownMenuRadioItem
                            className="min-h-8 rounded-lg px-2.5 text-xs"
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="relative flex h-16 w-full items-center gap-2 px-3 sm:px-5 md:gap-3 xl:grid xl:grid-cols-[auto_auto_minmax(18rem,1fr)_auto] xl:gap-5 xl:px-8">
              <a
                aria-label="Nkabom home"
                className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                href="#discover"
              >
                <NkabomResponsiveLogo />
              </a>

              <nav
                aria-label="Primary navigation"
                className="hidden items-center justify-center gap-1 sm:flex sm:flex-1 sm:px-2 md:px-4 xl:flex-none xl:justify-start xl:px-0"
              >
                {navigation.map((item) => (
                  <a
                    aria-current={item.href === routeHash ? "page" : undefined}
                    className={cn(
                      "hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 lg:px-3 lg:text-sm",
                      item.minBreakpoint,
                      item.href === routeHash &&
                        "bg-accent font-semibold text-accent-foreground"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <span>{item.label}</span>
                    {"badge" in item && account ? (
                      <span className="flex size-4 items-center justify-center rounded-full bg-[#ba5436] text-[0.5625rem] font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                    {"dot" in item && account ? (
                      <span className="size-1.5 rounded-full bg-[#e09f3e]" />
                    ) : null}
                  </a>
                ))}
              </nav>

              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverAnchor asChild>
                  <div className="hidden h-11 w-full max-w-xl min-w-0 items-center rounded-full border border-border/80 bg-background/90 px-1 shadow-xs transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 xl:flex">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Select craft category"
                          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full pr-2.5 pl-3.5 text-xs font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none sm:text-sm"
                          type="button"
                        >
                          <span className="max-w-[7.5rem] truncate sm:max-w-[9rem]">
                            {category}
                          </span>
                          <HugeiconsIcon
                            aria-hidden="true"
                            className="size-3 shrink-0 text-muted-foreground"
                            icon={ArrowDown01Icon}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-60 rounded-2xl border border-white/10 bg-[#181412] p-1.5 text-[#fcfbf9] shadow-2xl"
                        sideOffset={8}
                      >
                        <div className="px-3 py-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-muted-foreground/75 uppercase">
                          Select craft category
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {categories.map((item) => {
                            const isSelected = item === category
                            return (
                              <button
                                className={cn(
                                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors sm:text-sm",
                                  isSelected
                                    ? "bg-[#38261b] font-medium text-[#fcfbf9]"
                                    : "text-[#fcfbf9]/80 hover:bg-white/5 hover:text-[#fcfbf9]"
                                )}
                                key={item}
                                onClick={() => setCategory(item)}
                                type="button"
                              >
                                <span>{item}</span>
                                {isSelected ? (
                                  <HugeiconsIcon
                                    className="size-3.5 text-[#e09f3e]"
                                    icon={CheckmarkCircle02Icon}
                                  />
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div
                      aria-hidden="true"
                      className="mx-1 h-5 w-px shrink-0 bg-border/60"
                    />

                    <input
                      aria-autocomplete="list"
                      aria-expanded={searchOpen}
                      className="flex-1 bg-transparent px-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 sm:text-sm"
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setSearchOpen(true)
                      }}
                      onFocus={() => setSearchOpen(true)}
                      placeholder="Search verified tailors and crafts..."
                      ref={desktopSearchRef}
                      role="combobox"
                      type="text"
                      value={query}
                    />

                    <IconTooltip label="Search marketplace">
                      <button
                        aria-label="Search marketplace"
                        className="mr-0.5 flex size-8.5 shrink-0 items-center justify-center rounded-full bg-[#ba5436] text-white shadow-xs transition-colors hover:bg-[#a34428]"
                        onClick={() => setSearchOpen(true)}
                        type="button"
                      >
                        <HugeiconsIcon
                          aria-hidden="true"
                          className="size-4"
                          icon={SearchIcon}
                        />
                      </button>
                    </IconTooltip>
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] gap-0 rounded-2xl p-0"
                  onOpenAutoFocus={(event) => event.preventDefault()}
                  sideOffset={8}
                >
                  {resultList}
                </PopoverContent>
              </Popover>

              <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
                <IconTooltip
                  label={
                    compactSearchExpanded
                      ? "Close search"
                      : "Search marketplace"
                  }
                >
                  <Button
                    aria-expanded={compactSearchExpanded}
                    aria-label={
                      compactSearchExpanded
                        ? "Close marketplace search"
                        : "Search marketplace"
                    }
                    className="xl:hidden"
                    onClick={() => {
                      const nextExpanded = !compactSearchExpanded
                      setCompactSearchExpanded(nextExpanded)
                      setCompactResultsOpen(nextExpanded)
                    }}
                    size="icon-lg"
                    variant="ghost"
                  >
                    <HugeiconsIcon aria-hidden="true" icon={SearchIcon} />
                  </Button>
                </IconTooltip>

                <IconTooltip label="Saved products">
                  <Button
                    asChild
                    aria-label="Saved products"
                    className="hidden min-[30rem]:inline-flex"
                    size="icon-lg"
                    variant="ghost"
                  >
                    <a href="#saved">
                      <HugeiconsIcon aria-hidden="true" icon={FavouriteIcon} />
                    </a>
                  </Button>
                </IconTooltip>

                <Popover>
                  <IconTooltip
                    label={
                      unreadCount
                        ? `${unreadCount} unread notifications`
                        : "Notifications"
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        aria-label={
                          unreadCount
                            ? `${unreadCount} unread notifications`
                            : "Notifications"
                        }
                        className="relative"
                        size="icon-lg"
                        variant="ghost"
                      >
                        <HugeiconsIcon
                          aria-hidden="true"
                          icon={Notification02Icon}
                        />
                        {unreadCount ? (
                          <span
                            aria-hidden="true"
                            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[0.5625rem] font-semibold text-primary-foreground ring-2 ring-background"
                          >
                            {unreadCount}
                          </span>
                        ) : null}
                      </Button>
                    </PopoverTrigger>
                  </IconTooltip>
                  <PopoverContent
                    align="end"
                    className="w-[min(27rem,calc(100vw-1.5rem))] gap-0 overflow-hidden rounded-2xl p-0"
                    sideOffset={10}
                  >
                    <div className="flex min-h-16 items-center justify-between gap-3 border-b px-5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <HugeiconsIcon
                          className="size-4 shrink-0 text-primary"
                          icon={Notification02Icon}
                        />
                        <h2 className="font-heading text-base font-semibold">
                          Guild notifications
                        </h2>
                        {unreadCount ? (
                          <span className="rounded-full bg-accent px-2 py-1 text-[0.625rem] font-semibold">
                            {unreadCount} new
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex h-80 flex-col items-center justify-center gap-2 px-6 text-center">
                      <HugeiconsIcon
                        className="size-6 text-muted-foreground"
                        icon={Notification02Icon}
                      />
                      <p className="text-sm font-medium">
                        No notifications yet
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Account and marketplace updates will appear here.
                      </p>
                    </div>
                    <div className="flex min-h-12 items-center justify-center border-t text-[0.6875rem] text-muted-foreground">
                      Your Nkabom account updates
                    </div>
                  </PopoverContent>
                </Popover>

                <ThemeToggle size="icon-lg" />

                {account ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={`Account menu for ${account.fullName ?? account.email}`}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-border/80 bg-background/80 pr-2.5 pl-1.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                        type="button"
                      >
                        <div className="relative flex size-7.5 items-center justify-center rounded-xl bg-gradient-to-br from-[#ba5436] to-[#e09f3e] text-xs font-bold text-white shadow-xs">
                          {account.initials}
                          <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                        </div>
                        <div className="hidden flex-col text-left xl:flex">
                          <span className="max-w-[7.5rem] truncate text-xs leading-tight font-semibold text-foreground">
                            {account.fullName ?? account.email}
                          </span>
                          <span className="text-[0.625rem] leading-tight text-muted-foreground">
                            {account.role === "administrator"
                              ? "Administrator"
                              : account.role === "seller"
                                ? "Seller"
                                : "Customer"}
                          </span>
                        </div>
                        <HugeiconsIcon
                          aria-hidden="true"
                          className="hidden size-3 text-muted-foreground xl:block"
                          icon={ArrowDown01Icon}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-72 rounded-2xl p-2"
                      sideOffset={10}
                    >
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ba5436] to-[#e09f3e] text-xs font-bold text-white shadow-xs">
                          {account.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {account.fullName ?? account.email}
                            </p>
                            <HugeiconsIcon
                              className="size-3.5 shrink-0 text-emerald-500"
                              icon={CheckmarkCircle02Icon}
                            />
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {account.email}
                          </p>
                        </div>
                      </div>

                      <DropdownMenuSeparator />

                      {/* Smart Overflow Navigation Items (hidden when visible in header) */}
                      <DropdownMenuGroup className="lg:hidden">
                        <DropdownMenuLabel className="px-3 py-1.5 text-[0.625rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:hidden">
                          Navigation
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          asChild
                          className="min-h-10 rounded-lg px-3 text-sm sm:hidden"
                        >
                          <a href="#discover">
                            <HugeiconsIcon icon={Home01Icon} />
                            <span>Discover Crafts</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="min-h-10 rounded-lg px-3 text-sm sm:hidden"
                        >
                          <a href="#tailors">
                            <HugeiconsIcon icon={Store01Icon} />
                            <span>Tailors & Artisans</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="min-h-10 rounded-lg px-3 text-sm md:hidden"
                        >
                          <a href="#orders">
                            <HugeiconsIcon icon={ShoppingBag01Icon} />
                            <span className="flex-1">Orders & Commissions</span>
                            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[0.5625rem] font-semibold text-primary">
                              2 Active
                            </span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="min-h-10 rounded-lg px-3 text-sm lg:hidden"
                        >
                          <a href="#messages">
                            <HugeiconsIcon icon={Message01Icon} />
                            <span className="flex-1">Artisan Messages</span>
                            <span className="size-1.5 rounded-full bg-primary" />
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="px-3 py-1.5 text-[0.625rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                          Account
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          asChild
                          className="min-h-10 rounded-lg px-3 text-sm min-[30rem]:hidden"
                        >
                          <a href="#saved">
                            <HugeiconsIcon icon={FavouriteIcon} />
                            <span>Saved Craft Portfolio</span>
                          </a>
                        </DropdownMenuItem>
                        {account.role === "normal" ? (
                          <DropdownMenuItem
                            asChild
                            className="min-h-10 rounded-lg px-3 text-sm"
                          >
                            <a href="#become-a-seller">
                              <HugeiconsIcon icon={Store01Icon} />
                              <span>Become a seller</span>
                            </a>
                          </DropdownMenuItem>
                        ) : null}
                        {account.role === "administrator" ? (
                          <DropdownMenuItem
                            asChild
                            className="min-h-10 rounded-lg px-3 text-sm"
                          >
                            <a href="#admin/overview">
                              <HugeiconsIcon icon={Shield01Icon} />
                              <span>Administration</span>
                            </a>
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="min-h-10 rounded-lg px-3 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20"
                        onClick={handleSignOut}
                        variant="destructive"
                      >
                        <HugeiconsIcon icon={ArrowRight02Icon} />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <IconTooltip label="Sign in or register">
                      <Button
                        asChild
                        aria-label="Sign in or register"
                        className="sm:hidden"
                        size="icon-lg"
                        variant="ghost"
                      >
                        <a href={authHashes["sign-in"]}>
                          <HugeiconsIcon aria-hidden="true" icon={UserIcon} />
                        </a>
                      </Button>
                    </IconTooltip>

                    <Button
                      asChild
                      className="hidden whitespace-nowrap sm:inline-flex"
                      size="lg"
                      variant="outline"
                    >
                      <a href={authHashes["sign-in"]}>
                        <HugeiconsIcon
                          aria-hidden="true"
                          data-icon="inline-start"
                          icon={UserIcon}
                        />
                        Sign in / Register
                      </a>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label="Open navigation"
                          size="icon-lg"
                          title="Open navigation"
                          variant="ghost"
                        >
                          <HugeiconsIcon aria-hidden="true" icon={Menu01Icon} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-72 rounded-2xl p-2"
                        sideOffset={10}
                      >
                        <DropdownMenuGroup className="lg:hidden">
                          <DropdownMenuLabel className="px-3 py-2 text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
                            Browse
                          </DropdownMenuLabel>
                          {navigation.map((item) => (
                            <DropdownMenuItem
                              asChild
                              className={cn(
                                "min-h-10 rounded-lg px-3 text-sm",
                                item.menuOverflowClass,
                                item.href === routeHash &&
                                  "bg-accent text-accent-foreground"
                              )}
                              key={item.href}
                            >
                              <a
                                aria-current={
                                  item.href === routeHash ? "page" : undefined
                                }
                                href={item.href}
                              >
                                <HugeiconsIcon icon={item.icon} />
                                {item.label}
                              </a>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="px-3 py-2 text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
                            Preferences
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            asChild
                            className="min-h-10 rounded-lg px-3 text-sm min-[30rem]:hidden"
                          >
                            <a href="#saved">
                              <HugeiconsIcon icon={FavouriteIcon} />
                              Saved products
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            className="min-h-10 rounded-lg px-3 text-sm"
                          >
                            <a href={authHashes["sign-in"]}>
                              <HugeiconsIcon icon={Store01Icon} />
                              Become a seller
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>

            {compactSearchExpanded ? (
              <div className="w-full px-4 pb-2 sm:px-5 lg:px-8 xl:hidden">
                <Popover
                  open={compactResultsOpen}
                  onOpenChange={setCompactResultsOpen}
                >
                  <PopoverAnchor asChild>
                    <div className="flex h-11 w-full items-center rounded-full border border-border/80 bg-background/90 px-1 shadow-xs transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label="Select craft category"
                            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full pr-2 pl-3 text-xs font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none"
                            type="button"
                          >
                            <span className="max-w-[5.5rem] truncate sm:max-w-[7.5rem]">
                              {category}
                            </span>
                            <HugeiconsIcon
                              aria-hidden="true"
                              className="size-3 shrink-0 text-muted-foreground"
                              icon={ArrowDown01Icon}
                            />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-56 rounded-2xl border border-white/10 bg-[#181412] p-1.5 text-[#fcfbf9] shadow-2xl"
                          sideOffset={8}
                        >
                          <div className="px-3 py-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-muted-foreground/75 uppercase">
                            Select craft category
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {categories.map((item) => {
                              const isSelected = item === category
                              return (
                                <button
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors sm:text-sm",
                                    isSelected
                                      ? "bg-[#38261b] font-medium text-[#fcfbf9]"
                                      : "text-[#fcfbf9]/80 hover:bg-white/5 hover:text-[#fcfbf9]"
                                  )}
                                  key={item}
                                  onClick={() => setCategory(item)}
                                  type="button"
                                >
                                  <span>{item}</span>
                                  {isSelected ? (
                                    <HugeiconsIcon
                                      className="size-3.5 text-[#e09f3e]"
                                      icon={CheckmarkCircle02Icon}
                                    />
                                  ) : null}
                                </button>
                              )
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div
                        aria-hidden="true"
                        className="mx-1 h-5 w-px shrink-0 bg-border/60"
                      />

                      <input
                        aria-autocomplete="list"
                        aria-expanded={compactResultsOpen}
                        className="flex-1 bg-transparent px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 sm:text-sm"
                        onChange={(event) => {
                          setQuery(event.target.value)
                          setCompactResultsOpen(true)
                        }}
                        onFocus={() => setCompactResultsOpen(true)}
                        placeholder="Search verified tailors and crafts..."
                        ref={compactSearchRef}
                        role="combobox"
                        type="text"
                        value={query}
                      />

                      <button
                        aria-label="Search marketplace"
                        className="mr-0.5 flex size-8.5 shrink-0 items-center justify-center rounded-full bg-[#ba5436] text-white shadow-xs transition-colors hover:bg-[#a34428]"
                        onClick={() => setCompactResultsOpen(true)}
                        type="button"
                      >
                        <HugeiconsIcon
                          aria-hidden="true"
                          className="size-4"
                          icon={SearchIcon}
                        />
                      </button>
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] gap-0 rounded-2xl p-0"
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    sideOffset={8}
                  >
                    {resultList}
                  </PopoverContent>
                </Popover>
              </div>
            ) : null}
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          {sellerApplicationHashes.includes(
            routeHash as (typeof sellerApplicationHashes)[number]
          ) ? (
            <SellerApplication
              account={account}
              initialHash={routeHash}
              onNavigate={(hash) => {
                window.location.hash = hash
                setRouteHash(hash)
              }}
            />
          ) : (
            <div className="flex flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
              <section className="mx-auto flex w-full max-w-xl flex-col gap-3 lg:mx-0 lg:ml-[max(0rem,calc((100vw-80rem)/2))]">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Frontend foundation
                </p>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ready to build Nkabom.
                </h1>
                <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                  React, Vite, Tailwind CSS and shadcn/ui are configured with a
                  compact responsive system and persistent light, dark and
                  system themes.
                </p>
              </section>
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
