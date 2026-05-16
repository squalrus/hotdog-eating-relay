/// <reference types="vite/client" />

// Google Analytics gtag — declared so the tracking hook compiles when uncommented
interface Window {
  gtag?: (...args: unknown[]) => void
  dataLayer?: unknown[]
}
