import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import PxBorder from "./px-border";
import FocusRing from "./focus-ring";

const buttonVariants = cva(
  "inline-flex items-center select-none relative justify-center gap-2 whitespace-nowrap text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none hover:cursor-pointer font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "bg-background hover:bg-accent",
        ghost: "hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
        neo: "bg-neo-yellow text-foreground",
        neoBlue: "bg-neo-blue text-foreground",
        neoGreen: "bg-neo-green text-foreground",
        neoPurple: "bg-neo-purple text-foreground",
        neoPink: "bg-neo-pink text-foreground",
        neoRed: "bg-neo-red text-foreground",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 text-base has-[>svg]:px-4",
        icon: "size-9",
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
  shadow?: boolean;
  containerClassName?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, shadow = true, containerClassName, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const Btn = (
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className }),
          "group peer",
          shadow
            ? 'relative z-[1] transition-transform ease-in-out hover:translate-x-[3px] hover:translate-y-[3px]'
            : 'm-[3px]',
        )}
        ref={ref}
        {...props}
      >
        <PxBorder width={3} radius="lg" />
        {children}
        <FocusRing width={3} />
      </Comp>
    );

    return shadow ? (
      <div className={cn('relative p-[3px]', containerClassName)}>
        {Btn}
        <div className="absolute -bottom-[3px] left-[9px] h-[3px] w-[calc(100%-12px)] bg-black peer-disabled:bg-black/50" />
        <div className="absolute top-[9px] -right-[3px] h-[calc(100%-12px)] w-[3px] bg-black peer-disabled:bg-black/50" />
        <div className="absolute right-0 bottom-[0px] h-[6px] w-[3px] bg-black peer-disabled:bg-black/50" />
        <div className="absolute right-[3px] bottom-[0px] h-[3px] w-[3px] bg-black peer-disabled:bg-black/50" />
      </div>
    ) : (
      Btn
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
