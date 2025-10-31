// Server-side initialization
// This runs when the Next.js app starts

import { startScheduler } from "./scheduler"

let initialized = false

export function initializeApp() {
  if (initialized) return

  console.log("Initializing Git Sync Manager...")

  // Start the scheduler
  startScheduler()

  initialized = true
  console.log("Git Sync Manager initialized successfully")
}

// Auto-initialize when this module is imported
if (typeof window === "undefined") {
  // Only run on server-side
  initializeApp()
}
