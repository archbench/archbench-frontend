import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white hover:bg-primary/90",
        secondary:
          "border-transparent bg-black/5 text-text hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20",
        destructive: "border-transparent bg-danger text-white hover:bg-danger/90",
        outline: "text-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

