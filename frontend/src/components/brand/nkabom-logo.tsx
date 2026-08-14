import { useId, type ComponentProps, type SVGProps } from "react"

import { cn } from "@/lib/utils"

export type NkabomLogoVariant = "mark" | "horizontal" | "badge"
export type NkabomLogoTone = "auto" | "light" | "dark" | "mono"

export type NkabomLogoProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  variant?: NkabomLogoVariant
  tone?: NkabomLogoTone
  title?: string
}

const variantDimensions: Record<
  NkabomLogoVariant,
  { width: number; height: number; viewBox: string }
> = {
  mark: { width: 48, height: 48, viewBox: "0 0 100 100" },
  horizontal: { width: 182, height: 48, viewBox: "0 0 380 100" },
  badge: { width: 154, height: 62, viewBox: "0 0 320 130" },
}

function LogoMark() {
  return (
    <>
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="16"
        stroke="var(--logo-coral)"
        strokeWidth="2"
        opacity="0.2"
      />
      <path
        d="M 24 22 L 24 78"
        stroke="var(--logo-coral)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M 24 22 L 54 78"
        stroke="var(--logo-ink)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M 76 22 L 52 50"
        stroke="var(--logo-gold)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M 52 50 L 76 78"
        stroke="var(--logo-coral)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="52" cy="50" r="5" fill="var(--logo-gold)" />
      <circle cx="52" cy="50" r="2.5" fill="var(--logo-cutout)" />
    </>
  )
}

function HorizontalLogo() {
  return (
    <>
      <LogoMark />
      <text
        x="115"
        y="52"
        fontFamily="'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif"
        fontSize="34"
        fontWeight="700"
        letterSpacing="6"
        fill="var(--logo-ink)"
      >
        NKABOM
      </text>
      <text
        x="117"
        y="74"
        fontFamily="'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif"
        fontSize="11"
        fontWeight="600"
        letterSpacing="3"
        fill="var(--logo-muted)"
      >
        BESPOKE CRAFT GUILD GHANA
      </text>
    </>
  )
}

function BadgeLogo() {
  return (
    <>
      <rect
        x="4"
        y="4"
        width="312"
        height="122"
        rx="16"
        fill="var(--logo-badge-background)"
        stroke="var(--logo-badge-border)"
        strokeWidth="2"
      />
      <g transform="translate(16, 15)">
        <LogoMark />
      </g>
      <text
        x="128"
        y="58"
        fontFamily="'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="5"
        fill="var(--logo-ink)"
      >
        NKABOM
      </text>
      <text
        x="129"
        y="80"
        fontFamily="'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif"
        fontSize="10"
        fontWeight="600"
        letterSpacing="2"
        fill="var(--logo-muted)"
      >
        BESPOKE CRAFT GUILD GHANA
      </text>
    </>
  )
}

export function NkabomLogo({
  variant = "horizontal",
  tone = "auto",
  title,
  className,
  width,
  height,
  ...props
}: NkabomLogoProps) {
  const titleId = useId()
  const dimensions = variantDimensions[variant]

  return (
    <svg
      {...props}
      className={cn("nkabom-logo block shrink-0", className)}
      data-tone={tone}
      width={width ?? dimensions.width}
      height={height ?? dimensions.height}
      viewBox={dimensions.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {variant === "mark" ? <LogoMark /> : null}
      {variant === "horizontal" ? <HorizontalLogo /> : null}
      {variant === "badge" ? <BadgeLogo /> : null}
    </svg>
  )
}

export type NkabomResponsiveLogoProps = Omit<
  ComponentProps<"span">,
  "children" | "title"
> & {
  tone?: NkabomLogoTone
  title?: string
}

export function NkabomResponsiveLogo({
  tone = "auto",
  title = "Nkabom — Bespoke Craft Guild Ghana",
  className,
  ...props
}: NkabomResponsiveLogoProps) {
  return (
    <span
      {...props}
      className={cn("inline-flex min-w-0 items-center", className)}
      role="img"
      aria-label={title}
    >
      <NkabomLogo
        variant="horizontal"
        tone={tone}
        className="h-10 w-auto max-w-[9.5rem] sm:h-12 sm:max-w-[11.5rem] lg:h-[3.75rem] lg:max-w-[14.5rem]"
      />
    </span>
  )
}
