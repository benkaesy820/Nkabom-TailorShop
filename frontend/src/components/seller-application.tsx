import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast-provider"
import type { Account } from "@/lib/auth"
import {
  getSellerApplication,
  saveSellerApplication,
  submitSellerApplication,
  type SellerApplicationData,
  type SellerApplicationDraft,
} from "@/lib/seller-application"
import { cn } from "@/lib/utils"

const categories = [
  "Tailoring",
  "Dressmaking",
  "Kente weaving",
  "Textile and fabric work",
  "Embroidery",
  "Leatherwork",
  "Alterations",
  "Other",
]
const businessTypes = [
  ["individual", "Individual artisan"],
  ["sole_proprietor", "Sole proprietor"],
  ["registered_company", "Registered company"],
  ["cooperative", "Cooperative"],
] as const
const regions = [
  "Greater Accra",
  "Ashanti",
  "Central",
  "Eastern",
  "Western",
  "Western North",
  "Volta",
  "Oti",
  "Northern",
  "Savannah",
  "North East",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
]
const stepNames = [
  "Craft profile",
  "Business details",
  "Services & capacity",
  "Review & submit",
]

const emptyDraft: SellerApplicationDraft = {
  primaryCategory: null,
  specialities: [],
  yearsOfExperience: null,
  professionalBio: null,
  languages: ["English"],
  atelierName: null,
  businessType: "individual",
  registrationNumber: null,
  region: null,
  city: null,
  address: null,
  serviceAreas: null,
  phone: null,
  whatsapp: null,
  acceptsCommissions: true,
  offersAlterations: false,
  offersReadyMade: false,
  offersInPersonFittings: true,
  acceptsRemoteOrders: false,
  minLeadTimeDays: null,
  maxLeadTimeDays: null,
  monthlyCapacity: null,
  additionalServices: null,
}

function toDraft(application: SellerApplicationData): SellerApplicationDraft {
  const {
    status: _status,
    submittedAt: _submittedAt,
    updatedAt: _updatedAt,
    ...draft
  } = application
  void _status
  void _submittedAt
  void _updatedAt
  return draft
}
function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function SellerApplication({
  account,
  onNavigate,
}: {
  account?: Account | null
  initialHash?: string
  onNavigate?: (hash: string) => void
}) {
  const { toast } = useToast()
  const [application, setApplication] = useState<SellerApplicationData | null>(
    null
  )
  const [draft, setDraft] = useState<SellerApplicationDraft>(emptyDraft)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(Boolean(account))
  const [saving, setSaving] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!account) {
      return
    }
    getSellerApplication()
      .then((result) => {
        setApplication(result)
        if (result) setDraft(toDraft(result))
      })
      .catch((error: unknown) =>
        toast({
          title: "Application unavailable",
          message: error instanceof Error ? error.message : "Please try again.",
          variant: "error",
        })
      )
      .finally(() => setLoading(false))
  }, [account, toast])

  function update<K extends keyof SellerApplicationDraft>(
    key: K,
    value: SellerApplicationDraft[K]
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }
  function validateStep(index: number) {
    const next: Record<string, string> = {}
    if (index === 0) {
      if (!draft.primaryCategory)
        next.primaryCategory = "Choose your primary craft."
      if (draft.specialities.length === 0)
        next.specialities = "Add at least one speciality."
      if (!draft.yearsOfExperience)
        next.yearsOfExperience = "Enter your years of experience."
      if (!draft.professionalBio?.trim())
        next.professionalBio = "Introduce your craft practice."
    }
    if (index === 1) {
      if (!draft.atelierName?.trim())
        next.atelierName = "Enter your atelier or trading name."
      if (!draft.region) next.region = "Choose your region."
      if (!draft.city?.trim()) next.city = "Enter your town or city."
      if (!draft.address?.trim()) next.address = "Enter your operating address."
      if (!draft.phone?.trim()) next.phone = "Enter a contact number."
      if (
        (draft.businessType === "registered_company" ||
          draft.businessType === "cooperative") &&
        !draft.registrationNumber?.trim()
      )
        next.registrationNumber = "Enter the registration number."
    }
    if (index === 2) {
      if (!draft.minLeadTimeDays)
        next.minLeadTimeDays = "Enter a minimum lead time."
      if (!draft.maxLeadTimeDays)
        next.maxLeadTimeDays = "Enter a maximum lead time."
      if (
        draft.minLeadTimeDays &&
        draft.maxLeadTimeDays &&
        draft.minLeadTimeDays > draft.maxLeadTimeDays
      )
        next.maxLeadTimeDays = "Maximum must not be shorter than minimum."
      if (!draft.monthlyCapacity)
        next.monthlyCapacity = "Enter your approximate capacity."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }
  async function save(showToast = true) {
    setSaving(true)
    try {
      const result = await saveSellerApplication(draft)
      setApplication(result)
      if (showToast)
        toast({
          title: "Draft saved",
          message: "Your seller application draft is saved.",
          variant: "success",
        })
      return true
    } catch (error) {
      toast({
        title: "Draft not saved",
        message: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      })
      return false
    } finally {
      setSaving(false)
    }
  }
  async function next() {
    if (validateStep(step) && (await save(false)))
      setStep((current) => Math.min(current + 1, 3))
  }
  async function submit() {
    if (
      !acknowledged ||
      !validateStep(0) ||
      !validateStep(1) ||
      !validateStep(2) ||
      !(await save(false))
    )
      return
    setSaving(true)
    try {
      const result = await submitSellerApplication()
      setApplication(result)
      toast({
        title: "Application submitted",
        message: "Your application is ready for administrator review.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Application not submitted",
        message: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!account)
    return (
      <Centered
        title="Sign in to apply"
        description="Seller applications belong to an existing verified buyer account."
      >
        <Button asChild>
          <a href="#sign-in">Sign in</a>
        </Button>
      </Centered>
    )
  if (account.accountType === "seller")
    return (
      <Centered
        title="Seller access active"
        description="This account already has seller access."
      >
        <Button onClick={() => onNavigate?.("#discover")}>
          Return to marketplace
        </Button>
      </Centered>
    )
  if (loading)
    return (
      <Centered
        title="Loading application"
        description="Checking for an existing seller application…"
      />
    )
  if (application?.status === "submitted")
    return (
      <Centered
        title="Application submitted"
        description="Your application is waiting for administrator review. You can continue using your buyer account while it is reviewed."
      >
        <Button variant="outline" onClick={() => onNavigate?.("#discover")}>
          Return to marketplace
        </Button>
      </Centered>
    )

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Seller application
        </p>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Apply to sell on Nkabom
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Tell us about your craft, business and working capacity. Your buyer
          account remains active throughout review.
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label="Application progress"
          className="grid grid-cols-4 gap-1 rounded-xl border bg-card p-1 lg:flex lg:flex-col"
        >
          {stepNames.map((name, index) => (
            <button
              key={name}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "rounded-lg px-2 py-2 text-left text-xs transition-colors sm:px-3",
                step === index
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="block text-[0.625rem] tracking-wide uppercase">
                Step {index + 1}
              </span>
              <span className="hidden sm:block">{name}</span>
            </button>
          ))}
        </nav>
        <div className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6">
          <div className="mb-5">
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of 4
            </p>
            <h2 className="font-heading text-xl font-semibold">
              {stepNames[step]}
            </h2>
          </div>
          {step === 0 ? (
            <CraftStep draft={draft} errors={errors} update={update} />
          ) : null}
          {step === 1 ? (
            <BusinessStep
              account={account}
              draft={draft}
              errors={errors}
              update={update}
            />
          ) : null}
          {step === 2 ? (
            <ServicesStep draft={draft} errors={errors} update={update} />
          ) : null}
          {step === 3 ? (
            <Review
              draft={draft}
              account={account}
              acknowledged={acknowledged}
              setAcknowledged={setAcknowledged}
              setStep={setStep}
            />
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <Button
              variant="ghost"
              disabled={step === 0 || saving}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
            >
              <HugeiconsIcon data-icon="inline-start" icon={ArrowLeft02Icon} />
              Previous
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? "Saving…" : "Save draft"}
              </Button>
              {step < 3 ? (
                <Button disabled={saving} onClick={() => void next()}>
                  Continue
                  <HugeiconsIcon
                    data-icon="inline-end"
                    icon={ArrowRight02Icon}
                  />
                </Button>
              ) : (
                <Button
                  disabled={saving || !acknowledged}
                  onClick={() => void submit()}
                >
                  Submit application
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type Update = <K extends keyof SellerApplicationDraft>(
  key: K,
  value: SellerApplicationDraft[K]
) => void
type StepProps = {
  draft: SellerApplicationDraft
  errors: Record<string, string>
  update: Update
}
function CraftStep({ draft, errors, update }: StepProps) {
  return (
    <FieldGroup>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <Field data-invalid={Boolean(errors.primaryCategory)}>
          <FieldLabel>Primary craft *</FieldLabel>
          <Select
            value={draft.primaryCategory ?? ""}
            onValueChange={(value) => update("primaryCategory", value)}
          >
            <SelectTrigger aria-invalid={Boolean(errors.primaryCategory)}>
              <SelectValue placeholder="Choose a craft" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldError>{errors.primaryCategory}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.specialities)}>
          <FieldLabel htmlFor="specialities">Specialities *</FieldLabel>
          <Input
            id="specialities"
            aria-invalid={Boolean(errors.specialities)}
            value={draft.specialities.join(", ")}
            onChange={(event) =>
              update("specialities", splitList(event.target.value))
            }
            placeholder="Bespoke suits, bridal wear"
          />
          <FieldDescription>
            Separate multiple specialities with commas.
          </FieldDescription>
          <FieldError>{errors.specialities}</FieldError>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.yearsOfExperience)}>
          <FieldLabel htmlFor="experience">Years of experience *</FieldLabel>
          <Input
            id="experience"
            aria-invalid={Boolean(errors.yearsOfExperience)}
            value={draft.yearsOfExperience ?? ""}
            onChange={(event) =>
              update("yearsOfExperience", event.target.value)
            }
            placeholder="5 years"
          />
          <FieldError>{errors.yearsOfExperience}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="languages">Languages</FieldLabel>
          <Input
            id="languages"
            value={draft.languages.join(", ")}
            onChange={(event) =>
              update("languages", splitList(event.target.value))
            }
          />
        </Field>
      </div>
      <Field data-invalid={Boolean(errors.professionalBio)}>
        <FieldLabel htmlFor="bio">Professional introduction *</FieldLabel>
        <Textarea
          id="bio"
          aria-invalid={Boolean(errors.professionalBio)}
          value={draft.professionalBio ?? ""}
          onChange={(event) => update("professionalBio", event.target.value)}
          rows={5}
          placeholder="Describe your craft, experience and approach."
        />
        <FieldError>{errors.professionalBio}</FieldError>
      </Field>
    </FieldGroup>
  )
}

function BusinessStep({
  account,
  draft,
  errors,
  update,
}: StepProps & { account: Account }) {
  const needsRegistration =
    draft.businessType === "registered_company" ||
    draft.businessType === "cooperative"
  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Account name</FieldLabel>
          <Input disabled value={account.fullName ?? "Not provided"} />
        </Field>
        <Field>
          <FieldLabel>Account email</FieldLabel>
          <Input disabled value={account.email} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.atelierName)}>
          <FieldLabel htmlFor="atelier">Atelier or trading name *</FieldLabel>
          <Input
            id="atelier"
            aria-invalid={Boolean(errors.atelierName)}
            value={draft.atelierName ?? ""}
            onChange={(event) => update("atelierName", event.target.value)}
          />
          <FieldError>{errors.atelierName}</FieldError>
        </Field>
        <Field>
          <FieldLabel>Business type *</FieldLabel>
          <Select
            value={draft.businessType ?? "individual"}
            onValueChange={(value) =>
              update(
                "businessType",
                value as SellerApplicationDraft["businessType"]
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {businessTypes.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      {needsRegistration ? (
        <Field data-invalid={Boolean(errors.registrationNumber)}>
          <FieldLabel htmlFor="registration">Registration number *</FieldLabel>
          <Input
            id="registration"
            aria-invalid={Boolean(errors.registrationNumber)}
            value={draft.registrationNumber ?? ""}
            onChange={(event) =>
              update("registrationNumber", event.target.value)
            }
          />
          <FieldError>{errors.registrationNumber}</FieldError>
        </Field>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.region)}>
          <FieldLabel>Region *</FieldLabel>
          <Select
            value={draft.region ?? ""}
            onValueChange={(value) => update("region", value)}
          >
            <SelectTrigger aria-invalid={Boolean(errors.region)}>
              <SelectValue placeholder="Choose region" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {regions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldError>{errors.region}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.city)}>
          <FieldLabel htmlFor="city">Town or city *</FieldLabel>
          <Input
            id="city"
            aria-invalid={Boolean(errors.city)}
            value={draft.city ?? ""}
            onChange={(event) => update("city", event.target.value)}
          />
          <FieldError>{errors.city}</FieldError>
        </Field>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <Field data-invalid={Boolean(errors.address)}>
          <FieldLabel htmlFor="address">
            Workshop or operating address *
          </FieldLabel>
          <Textarea
            id="address"
            aria-invalid={Boolean(errors.address)}
            value={draft.address ?? ""}
            onChange={(event) => update("address", event.target.value)}
          />
          <FieldError>{errors.address}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="areas">Service areas</FieldLabel>
          <Textarea
            id="areas"
            value={draft.serviceAreas ?? ""}
            onChange={(event) => update("serviceAreas", event.target.value)}
            placeholder="Accra, Tema and nearby areas"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.phone)}>
          <FieldLabel htmlFor="phone">Phone number *</FieldLabel>
          <Input
            id="phone"
            aria-invalid={Boolean(errors.phone)}
            value={draft.phone ?? ""}
            onChange={(event) => update("phone", event.target.value)}
          />
          <FieldError>{errors.phone}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="whatsapp">WhatsApp number</FieldLabel>
          <Input
            id="whatsapp"
            value={draft.whatsapp ?? ""}
            onChange={(event) => update("whatsapp", event.target.value)}
          />
        </Field>
      </div>
    </FieldGroup>
  )
}

function ServicesStep({ draft, errors, update }: StepProps) {
  const toggle = (
    key:
      | "acceptsCommissions"
      | "offersAlterations"
      | "offersReadyMade"
      | "offersInPersonFittings"
      | "acceptsRemoteOrders",
    label: string
  ) => (
    <label
      key={key}
      className="flex items-center gap-2 rounded-lg border p-3 text-sm"
    >
      <input
        type="checkbox"
        checked={draft[key]}
        onChange={(event) => update(key, event.target.checked)}
      />
      {label}
    </label>
  )
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Services offered</FieldLabel>
        <div className="grid gap-2 sm:grid-cols-2">
          {toggle("acceptsCommissions", "Bespoke commissions")}
          {toggle("offersAlterations", "Alterations")}
          {toggle("offersReadyMade", "Ready-made products")}
          {toggle("offersInPersonFittings", "In-person fittings")}
          {toggle("acceptsRemoteOrders", "Remote orders")}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          id="minLead"
          label="Minimum lead time (days) *"
          value={draft.minLeadTimeDays}
          error={errors.minLeadTimeDays}
          onChange={(value) => update("minLeadTimeDays", value)}
        />
        <NumberField
          id="maxLead"
          label="Maximum lead time (days) *"
          value={draft.maxLeadTimeDays}
          error={errors.maxLeadTimeDays}
          onChange={(value) => update("maxLeadTimeDays", value)}
        />
        <NumberField
          id="capacity"
          label="Monthly capacity *"
          value={draft.monthlyCapacity}
          error={errors.monthlyCapacity}
          onChange={(value) => update("monthlyCapacity", value)}
        />
      </div>
      <Field>
        <FieldLabel htmlFor="additional">
          Additional service information
        </FieldLabel>
        <Textarea
          id="additional"
          value={draft.additionalServices ?? ""}
          onChange={(event) => update("additionalServices", event.target.value)}
        />
      </Field>
    </FieldGroup>
  )
}
function NumberField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  value: number | null
  error?: string
  onChange: (value: number | null) => void
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        min={1}
        aria-invalid={Boolean(error)}
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : null)
        }
      />
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function Review({
  draft,
  account,
  acknowledged,
  setAcknowledged,
  setStep,
}: {
  draft: SellerApplicationDraft
  account: Account
  acknowledged: boolean
  setAcknowledged: (value: boolean) => void
  setStep: (step: number) => void
}) {
  const sections = [
    {
      title: "Craft profile",
      step: 0,
      lines: [
        draft.primaryCategory,
        draft.specialities.join(", "),
        draft.yearsOfExperience,
      ],
    },
    {
      title: "Business details",
      step: 1,
      lines: [
        draft.atelierName,
        `${draft.city ?? ""}, ${draft.region ?? ""}`,
        draft.phone,
      ],
    },
    {
      title: "Services & capacity",
      step: 2,
      lines: [
        `${draft.minLeadTimeDays ?? "—"}–${draft.maxLeadTimeDays ?? "—"} days`,
        `${draft.monthlyCapacity ?? "—"} orders per month`,
      ],
    },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Applicant</p>
        <p className="text-muted-foreground">
          {account.fullName ?? account.email} · {account.email}
        </p>
      </div>
      {sections.map((section) => (
        <div key={section.title} className="rounded-xl border p-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-heading font-semibold">{section.title}</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStep(section.step)}
            >
              Edit
            </Button>
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            {section.lines.filter(Boolean).map((line) => (
              <p key={String(line)}>{line}</p>
            ))}
          </div>
        </div>
      ))}
      <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
        <input
          className="mt-0.5"
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        <span>
          I confirm that the information is accurate and understand that Nkabom
          may request additional details.
        </span>
      </label>
    </div>
  )
}
function Centered({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <section className="mx-auto flex min-h-[28rem] max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon
          icon={
            title.includes("submitted") ? CheckmarkCircle02Icon : Store01Icon
          }
        />
      </span>
      <div>
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  )
}
