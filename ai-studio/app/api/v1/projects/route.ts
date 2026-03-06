import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProject, getProjectsByUser } from "@/lib/db/models/project";
import { withValidation } from "@/lib/middleware/validation";
import { CreateProjectSchema } from "@/lib/validation/project";

// GET /api/v1/projects - List projects for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const projects = await getProjectsByUser(session.user.id);

    return NextResponse.json(
      { success: true, data: projects },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch projects" } },
      { status: 500 }
    );
  }
}

// POST /api/v1/projects - Create new project
export const POST = withValidation(CreateProjectSchema, async (req, validatedData) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const project = await createProject({
      ...validatedData,
      userId: session.user.id,
    });

    return NextResponse.json(
      { success: true, data: project },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create project" } },
      { status: 500 }
    );
  }
});
