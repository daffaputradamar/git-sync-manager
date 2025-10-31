import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { credentials, repositories } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"

// GET - Get all credentials
export async function GET() {
  try {
    const allCreds = await db.select().from(credentials)
    return NextResponse.json(
      allCreds.map((c) => ({
        id: c.id,
        name: c.username,
        type: c.type,
        username: c.username,
        token: c.token,
        url: c.url,
        createdAt: c.createdAt?.toISOString(),
      }))
    )
  } catch (error) {
    console.error("GET credentials error:", error)
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 })
  }
}

// POST - Create new credential
export async function POST(request: NextRequest) {
  try {
    const { name, type, username, token, url } = await request.json()

    // Validate required fields
    if (!type || !username || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (type !== "github" && type !== "tfs") {
      return NextResponse.json({ error: "Invalid credential type" }, { status: 400 })
    }

    const newCred = await db
      .insert(credentials)
      .values({
        type,
        username,
        token,
        url: url || "",
      })
      .returning()

    return NextResponse.json(
      {
        id: newCred[0].id,
        name: newCred[0].username,
        type: newCred[0].type,
        username: newCred[0].username,
        token: newCred[0].token,
        url: newCred[0].url,
        createdAt: newCred[0].createdAt?.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST credential error:", error)
    return NextResponse.json({ error: "Failed to create credential" }, { status: 500 })
  }
}

// PUT - Update a credential
export async function PUT(request: NextRequest) {
  try {
    const { id, name, username, token, url } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Credential ID is required" }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (username !== undefined) updateData.username = username
    if (token !== undefined) updateData.token = token
    if (url !== undefined) updateData.url = url || ""

    const updated = await db
      .update(credentials)
      .set(updateData)
      .where(eq(credentials.id, id))
      .returning()

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: updated[0].id,
      name: updated[0].username,
      type: updated[0].type,
      username: updated[0].username,
      token: updated[0].token,
      url: updated[0].url,
      createdAt: updated[0].createdAt?.toISOString(),
    })
  } catch (error) {
    console.error("PUT credential error:", error)
    return NextResponse.json({ error: "Failed to update credential" }, { status: 500 })
  }
}

// DELETE - Delete a credential
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Credential ID is required" }, { status: 400 })
    }

    // Check if credential is in use by any repository
    const inUse = await db
      .select()
      .from(repositories)
      .where(or(eq(repositories.tfsCredentialId, id), eq(repositories.githubCredentialId, id)))
      .limit(1)

    if (inUse && inUse.length > 0) {
      return NextResponse.json({ error: "Credential is in use by repositories" }, { status: 400 })
    }

    const deleted = await db.delete(credentials).where(eq(credentials.id, id)).returning()

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE credential error:", error)
    return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 })
  }
}
