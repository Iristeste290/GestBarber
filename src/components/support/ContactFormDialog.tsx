import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Loader2, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  subject: z.string().min(1, "Selecione um assunto"),
  message: z.string().trim().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(2000, "Mensagem muito longa"),
});

interface ContactFormDialogProps {
  trigger?: React.ReactNode;
}

export function ContactFormDialog({ trigger }: ContactFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Mensagem enviada com sucesso!", {
        description: "Você receberá uma confirmação por e-mail.",
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        setOpen(false);
        setIsSuccess(false);
        setFormData({ name: "", email: "", subject: "", message: "" });
      }, 2000);
    } catch (error: any) {
      console.error("Error sending contact email:", error);
      toast.error("Erro ao enviar mensagem", {
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = [
    { value: "duvida-plano", label: "Dúvida sobre planos" },
    { value: "problema-tecnico", label: "Problema técnico" },
    { value: "sugestao", label: "Sugestão de melhoria" },
    { value: "parceria", label: "Parceria comercial" },
    { value: "outro", label: "Outro assunto" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <MessageCircle className="w-4 h-4 mr-2" />
            Falar com Suporte
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Falar com Suporte
          </DialogTitle>
          <DialogDescription>
            Preencha o formulário abaixo e nossa equipe entrará em contato em breve.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-center">Mensagem enviada!</p>
            <p className="text-sm text-muted-foreground text-center">
              Verifique seu e-mail para a confirmação.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={isSubmitting}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isSubmitting}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => handleChange("subject", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.subject ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o assunto" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Descreva sua dúvida ou problema..."
                rows={4}
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                disabled={isSubmitting}
                className={errors.message ? "border-destructive" : ""}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {formData.message.length}/2000
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
