"use client";

import { useState } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseTrigger,
  Button,
  Input,
  TextArea,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/stores/app-store";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const t = useTranslations("projects");
  const { addProject, isLoading, setIsLoading } = useAppStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || t("createFailed"));
      }

      addProject(result.data);
      setName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Modal>
      <Button variant="secondary" size="sm">
        {t("newProject")}
      </Button>
      <ModalBackdrop isOpen={isOpen} onOpenChange={handleClose}>
        <ModalContainer>
          <ModalDialog>
            <ModalCloseTrigger />
            <ModalHeader>
              <Modal.Heading>{t("newProject")}</Modal.Heading>
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="mb-4 rounded-md bg-danger-50 p-3 text-danger dark:bg-danger-900/20">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-small font-medium">{t("projectName")}</label>
                  <Input
                    placeholder={t("projectNamePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-small font-medium">{t("description")}</label>
                  <TextArea
                    placeholder={t("descriptionPlaceholder")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="secondary"
                onPress={handleClose}
                isDisabled={isLoading}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                isPending={isLoading}
              >
                {t("create")}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
