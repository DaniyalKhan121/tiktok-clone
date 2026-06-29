import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full resize-none rounded-lg border border-[#2C2C2C] bg-[#121212] px-4 py-3 text-sm text-white placeholder:text-[#A8A8A8] outline-none transition-colors focus:border-[#FE2C55]",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
