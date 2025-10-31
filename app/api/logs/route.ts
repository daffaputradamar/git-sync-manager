import { type NextRequest, NextResponse } from "next/server"

// GET - Sync logs are no longer tracked
export async function GET(request: NextRequest) {
  try {
    // Sync logs are no longer tracked in the new version
    // This endpoint is kept for backward compatibility
    return NextResponse.json([])
  } catch (error) {
    console.error("GET sync logs error:", error)
    return NextResponse.json({ error: "Failed to fetch sync logs" }, { status: 500 })
  }
}
