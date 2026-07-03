"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type BotFormInput = {
  name: string;
  description: string;
  systemContext: string;
  avatarUrl?: string;
};

interface CreateBotDialogProps {
  onSubmitBot: (input: BotFormInput) => void;
  mode?: "create" | "edit";
  trigger?: ReactNode;
  initialValues?: BotFormInput;
}

const defaultFormValues: BotFormInput = {
  name: "",
  description: "",
  systemContext: "",
  avatarUrl: "",
};

export function CreateBotDialog({
  onSubmitBot,
  mode = "create",
  trigger,
  initialValues,
}: CreateBotDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialValues?.name ?? defaultFormValues.name);
  const [description, setDescription] = useState(
    initialValues?.description ?? defaultFormValues.description
  );
  const [systemContext, setSystemContext] = useState(
    initialValues?.systemContext ?? defaultFormValues.systemContext
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialValues?.avatarUrl ?? defaultFormValues.avatarUrl
  );

  const isCreateMode = mode === "create";
  const isValid =
    name.trim().length > 1 &&
    description.trim().length > 3 &&
    systemContext.trim().length > 8;

  const syncFromInitialValues = () => {
    setName(initialValues?.name ?? defaultFormValues.name);
    setDescription(initialValues?.description ?? defaultFormValues.description);
    setSystemContext(initialValues?.systemContext ?? defaultFormValues.systemContext);
    setAvatarUrl(initialValues?.avatarUrl ?? defaultFormValues.avatarUrl);
  };

  const resetForm = () => {
    if (isCreateMode) {
      setName(defaultFormValues.name);
      setDescription(defaultFormValues.description);
      setSystemContext(defaultFormValues.systemContext);
      setAvatarUrl(defaultFormValues.avatarUrl);
      return;
    }

    setName(initialValues?.name ?? defaultFormValues.name);
    setDescription(initialValues?.description ?? defaultFormValues.description);
    setSystemContext(initialValues?.systemContext ?? defaultFormValues.systemContext);
    setAvatarUrl(initialValues?.avatarUrl ?? defaultFormValues.avatarUrl);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;

    onSubmitBot({
      name,
      description,
      systemContext,
      avatarUrl,
    });

    resetForm();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          syncFromInitialValues();
          return;
        }

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="w-full sm:w-auto">
            Create New Bot
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "Create New Chatbot" : "Edit Chatbot"}</DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? "Define the bot profile and persona. The system context will guide every response."
              : "Update bot details, avatar URL, and persona context."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="bot-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="bot-name"
              placeholder="e.g. Product Strategist"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bot-avatar-url" className="text-sm font-medium">
              Avatar URL
            </label>
            <Input
              id="bot-avatar-url"
              type="url"
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bot-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="bot-description"
              placeholder="Short summary of what this bot helps with"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bot-context" className="text-sm font-medium">
              System Context / Job
            </label>
            <Textarea
              id="bot-context"
              placeholder="You are a startup advisor focused on GTM strategy..."
              className="min-h-28"
              value={systemContext}
              onChange={(event) => setSystemContext(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            {isCreateMode ? "Save Bot" : "Update Bot"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
