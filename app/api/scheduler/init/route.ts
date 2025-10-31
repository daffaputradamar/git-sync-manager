import { NextResponse } from "next/server"
import { startScheduler } from "@/lib/scheduler"

// This route initializes the scheduler when the app starts
export async function GET() {
  try {
    startScheduler()
    return NextResponse.json({ message: "Scheduler initialized" })
  } catch (error: any) {
    console.error("Scheduler initialization error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
