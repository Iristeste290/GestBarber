import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarberAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-xl",
};

export function BarberAvatar({ name, avatarUrl, size = "md", className }: BarberAvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={avatarUrl || undefined} 
        alt={`Foto de ${name}`}
        className="object-cover"
      />
      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
        {initials || <User className="h-1/2 w-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}
