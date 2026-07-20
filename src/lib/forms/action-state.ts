import type { z } from "zod";

export interface ActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const idleActionState: ActionState = { status: "idle" };

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return fieldErrors;
}
