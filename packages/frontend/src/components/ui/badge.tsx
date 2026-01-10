import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border-2 border-foreground px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs",
        secondary: "bg-secondary text-secondary-foreground shadow-xs",
        destructive: "bg-destructive text-destructive-foreground shadow-xs",
        outline: "bg-background text-foreground",
        neo: "bg-neo-yellow text-foreground shadow-xs",
        neoBlue: "bg-neo-blue text-foreground shadow-xs",
        neoGreen: "bg-neo-green text-foreground shadow-xs",
        neoPurple: "bg-neo-purple text-foreground shadow-xs",
        neoPink: "bg-neo-pink text-foreground shadow-xs",
        neoRed: "bg-neo-red text-foreground shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
