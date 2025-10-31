import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects } from "@/lib/db/schema"
import type { Project } from "@/lib/types"

// GET - Get all projects
export async function GET() {
  try {
    const allProjects = await db.select().from(projects)
    return NextResponse.json(
      allProjects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        repositories: [],
        createdAt: p.createdAt?.toISOString(),
      }))
    )
  } catch (error) {
    console.error("GET projects error:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const newProject = await db
      .insert(projects)
      .values({
        name,
        description: description || "",
      })
      .returning()

    return NextResponse.json(
      {
        id: newProject[0].id,
        name: newProject[0].name,
        description: newProject[0].description,
        repositories: [],
        createdAt: newProject[0].createdAt?.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST project error:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
