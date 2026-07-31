"use client";

import { forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        <input
          type={type}
          placeholder={label}
          className={cn(
            "w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder:text-gray-400",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-500 font-medium ml-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";
