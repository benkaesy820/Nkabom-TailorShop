import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import type { ComponentProps } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ThemeToggleProps = {
  size?: ComponentProps<typeof Button>["size"]
}

export function ThemeToggle({ size = "icon-sm" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const label = isDark ? "Use light theme" : "Use dark theme"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          size={size}
          variant="ghost"
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={isDark ? Sun03Icon : Moon02Icon}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  )
}
