import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg border border-[#2C2C2C] bg-[#121212] px-4 text-sm text-white placeholder:text-[#A8A8A8] outline-none transition-colors focus:border-[#FE2C55]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
