import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";

interface PostGeneratorFormProps {
  title: string;
  description: string;
  placeholder: string;
  type: "weekly" | "promotion" | "campaign";
  onGenerate: (type: "weekly" | "promotion" | "campaign", context: string) => void;
  isGenerating: boolean;
}

export const PostGeneratorForm = ({
  title,
  description,
  placeholder,
  type,
  onGenerate,
  isGenerating,
}: PostGeneratorFormProps) => {
  const [context, setContext] = useState("");

  const handleGenerate = () => {
    onGenerate(type, context);
    setContext("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${type}-context`}>
            Detalhes (opcional)
          </Label>
          <Textarea
            id={`${type}-context`}
            placeholder={placeholder}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Post com IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};