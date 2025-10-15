import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "overlay" | "inline";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

export const LoadingSpinner = ({
  size = "md",
  variant = "default",
  className,
}: LoadingSpinnerProps) => {
  const spinner = (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  if (variant === "inline") {
    return <span className="inline-flex items-center">{spinner}</span>;
  }

  return spinner;
};