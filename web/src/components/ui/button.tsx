import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-2 border-foreground uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md active:translate-x-0 active:translate-y-0 active:shadow-xs",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md",
        outline: "bg-background hover:bg-accent hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md",
        ghost: "border-transparent hover:bg-accent hover:border-foreground",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
        neo: "bg-neo-yellow text-foreground shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md active:translate-x-0 active:translate-y-0 active:shadow-xs",
        neoBlue: "bg-neo-blue text-foreground shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md active:translate-x-0 active:translate-y-0 active:shadow-xs",
        neoGreen: "bg-neo-green text-foreground shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md active:translate-x-0 active:translate-y-0 active:shadow-xs",
        neoPurple: "bg-neo-purple text-foreground shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md active:translate-x-0 active:translate-y-0 active:shadow-xs",
        neoPink: "bg-neo-pink text-foreground shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md active:translate-x-0 active:translate-y-0 active:shadow-xs",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-14 px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
