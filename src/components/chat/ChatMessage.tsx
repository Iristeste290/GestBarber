import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import assistantAvatar from "@/assets/assistant-avatar.png";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      ) : (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={assistantAvatar} alt="Assistente GestBarber" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">GB</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
        isUser 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted rounded-bl-md"
      )}>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}