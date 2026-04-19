import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "purple";
  size?: "sm" | "md" | "lg";
  as?: "button" | "a";
  href?: string;
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  as: Tag = "button",
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variants = {
    primary:
      "bg-[#3B5FD4] text-white hover:bg-[#2D4FB8] shadow-lg shadow-blue-500/25 focus-visible:ring-[#3B5FD4]",
    outline:
      "border-2 border-[#3B5FD4] text-[#3B5FD4] hover:bg-blue-50 focus-visible:ring-[#3B5FD4]",
    ghost:
      "text-[#3B5FD4] hover:bg-blue-50 focus-visible:ring-[#3B5FD4]",
    purple:
      "bg-[#7B4DB5] text-white hover:bg-[#6A3BA0] shadow-lg shadow-purple-500/25 focus-visible:ring-[#7B4DB5]",
  };

  if (Tag === "a") {
    return (
      <a href={href} className={cn(base, sizes[size], variants[variant], className)}>
        {children}
      </a>
    );
  }

  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
