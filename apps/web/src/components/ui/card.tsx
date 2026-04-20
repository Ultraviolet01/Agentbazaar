"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    hoverGlow?: boolean;
    variant?: 'elevated' | 'subtle' | 'flat' | 'accent';
    isClickable?: boolean;
  }
>(({ className, hoverGlow = true, variant = 'subtle', isClickable = false, ...props }, ref) => {
  const variantStyles = {
    elevated: "bg-white border-0 shadow-md",
    subtle: "bg-white border border-gray-200 shadow-sm",
    flat: "bg-white border border-gray-100",
    accent: "bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200"
  };

  const interactiveStyles = isClickable 
    ? "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
    : "transition-all duration-200";

  return (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-2xl overflow-hidden relative group",
        variantStyles[variant],
        interactiveStyles,
        className
      )}
      {...(props as any)}
    >
      {hoverGlow && variant === 'subtle' && (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-orange)]/0 via-[var(--accent-orange)]/0 to-[var(--accent-orange)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      <div className="relative z-10 h-full">
          {props.children}
      </div>
    </motion.div>
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-none tracking-tight text-[var(--text-primary)]",
      className
    )}
  {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs font-semibold text-[var(--text-secondary)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
