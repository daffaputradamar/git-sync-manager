import { NextResponse } from "next/server"
import { loadData } from "@/lib/storage"

export async function GET() {
  try {
    const data = loadData()
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data,
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
