"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@/lib/supabase/client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SubmitButton({ 
  children, 
  isLoading, 
  type = "submit",
  onClick,
  fullWidth = true
}: { 
  children: React.ReactNode; 
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={isLoading}
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 bg-[#F04438] hover:bg-[#d93b2f] hover:shadow-lg hover:-translate-y-0.5 text-white px-8 py-4 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      if (onClick) onClick();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/api/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-6"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      ) : (
        <>
          Continue with Google
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.71 22.36 9.98H12V14.28H17.92C17.67 15.66 16.89 16.84 15.71 17.63V20.43H19.27C21.35 18.51 22.56 15.63 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23.0001C14.97 23.0001 17.46 22.0101 19.27 20.4301L15.71 17.6301C14.73 18.2901 13.48 18.6901 12 18.6901C9.13 18.6901 6.7 16.7401 5.84 14.1301H2.16V16.9801C3.98 20.5901 7.7 23.0001 12 23.0001Z" fill="#34A853"/>
            <path d="M5.84 14.13C5.62 13.48 5.5 12.76 5.5 12C5.5 11.24 5.62 10.52 5.84 9.87V7.02H2.16C1.41 8.51 1 10.2 1 12C1 13.8 1.41 15.49 2.16 16.98L5.84 14.13Z" fill="#FBBC05"/>
            <path d="M12 5.31C13.62 5.31 15.06 5.87 16.2 6.96L19.34 3.82C17.45 2.06 14.96 1 12 1C7.7 1 3.98 3.41 2.16 7.02L5.84 9.87C6.7 7.26 9.13 5.31 12 5.31Z" fill="#EA4335"/>
          </svg>
        </>
      )}
    </button>
  );
}
