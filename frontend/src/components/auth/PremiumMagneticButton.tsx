"use client";

export function PremiumMagneticButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden group rounded-full font-bold uppercase tracking-[0.15em] text-xs transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${className}`}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
