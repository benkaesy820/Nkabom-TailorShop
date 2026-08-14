import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { ToastProvider } from "@/components/ui/toast-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider storageKey="nkabom-ui-theme">
      <ToastProvider position="top-right">
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
)
