import { prisma } from "../prisma-client";

export interface ProjectCreateInput {
  name: string;
  description?: string;
  userId: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
}

export async function createProject(data: ProjectCreateInput) {
  return await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: data.userId,
      members: {
        create: {
          userId: data.userId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}

export async function getProjectById(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}

export async function getProjectsByUser(userId: string) {
  return await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function updateProject(
  id: string,
  data: ProjectUpdateInput,
  userId: string
) {
  // Check if user has permission (owner or editor)
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: id,
        userId,
      },
    },
  });

  if (!membership || !["OWNER", "EDITOR"].includes(membership.role)) {
    throw new Error("Insufficient permissions");
  }

  return await prisma.project.update({
    where: { id },
    data,
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}

export async function deleteProject(id: string, userId: string) {
  // Only owner can delete
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: id,
        userId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only project owner can delete");
  }

  return await prisma.project.delete({
    where: { id },
  });
}
