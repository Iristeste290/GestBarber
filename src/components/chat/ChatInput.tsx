import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({ onSend, disabled, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  
  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed);
      setInput("");
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="flex gap-2 items-end p-4 border-t bg-background">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite sua mensagem..."
        disabled={disabled || isLoading}
        className="min-h-[44px] max-h-[120px] resize-none"
        rows={1}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!input.trim() || disabled || isLoading}
        className="shrink-0 h-11 w-11"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
