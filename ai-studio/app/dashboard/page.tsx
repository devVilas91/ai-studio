"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardContent, Button, Spinner } from "@heroui/react";
import { useAppStore } from "@/lib/stores/app-store";
import { signOut } from "next-auth/react";
import NewProjectModal from "@/components/projects/new-project-modal";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { projects, isLoading, error, fetchProjects } = useAppStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        await fetchProjects();
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadProjects();
  }, [fetchProjects]);

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/login" });
  };

  const handleProjectCreated = () => {
    setIsModalOpen(false);
  };

  if (isInitialLoad) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-default-500">{t("subtitle")}</p>
          </div>
          <Button variant="danger" onPress={handleSignOut}>
            {t("signOut")}
          </Button>
        </header>

        {error && (
          <div className="mb-6 rounded-md bg-danger-50 p-4 text-danger dark:bg-danger-900/20">
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="p-4">
              <CardHeader className="pb-2">
                <h3 className="text-xl font-semibold">{project.name}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-default-500 mb-4">
                  {project.description || t("noDescription")}
                </p>
                <div className="flex items-center justify-between text-small text-default-400">
                  <span>
                    {t("updated")}: {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    {project.members.length} {t("members")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="flex items-center justify-center p-8">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onPress={() => setIsModalOpen(true)}
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </Card>
        </div>

        <NewProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
