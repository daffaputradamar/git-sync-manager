import { type NextRequest, NextResponse } from "next/server"
import { validateGitCredentials } from "@/lib/git-sync"

export async function POST(request: NextRequest) {
  try {
    const { type, username, token, url } = await request.json()

    // Validate required fields
    if (!type || !username || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // For GitHub, use api.github.com URL if not provided
    const validationUrl = url || (type === "github" ? "https://github.com" : "")

    if (!validationUrl) {
      return NextResponse.json({ error: "URL is required for TFS credentials" }, { status: 400 })
    }

    // Validate credentials by attempting to connect
    const result = await validateGitCredentials(validationUrl, username, token, type)

    if (result.valid) {
      return NextResponse.json({
        valid: true,
        message: result.message,
      })
    } else {
      return NextResponse.json(
        {
          valid: false,
          message: result.message,
        },
        { status: 401 },
      )
    }
  } catch (error: any) {
    console.error("Validation error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Validation failed",
        message: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
