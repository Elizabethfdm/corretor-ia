import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
        primary: "bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200",
        success: "bg-success-100 text-success-800 dark:bg-success-950 dark:text-success-200",
        danger: "bg-danger-100 text-danger-800 dark:bg-danger-950 dark:text-danger-200",
        warning: "bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-200",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
