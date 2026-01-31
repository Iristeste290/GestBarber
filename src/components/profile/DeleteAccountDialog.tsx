import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";

interface DeleteAccountDialogProps {
  userId: string;
  userEmail?: string;
}

export function DeleteAccountDialog({ userId, userEmail }: DeleteAccountDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [confirmText, setConfirmText] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const CONFIRM_PHRASE = "EXCLUIR MINHA CONTA";

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_PHRASE) {
      toast.error("Digite a frase de confirmação corretamente");
      return;
    }

    if (!understood) {
      toast.error("Você precisa confirmar que entendeu as consequências");
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Call the LGPD anonymization function
      const { error: anonError } = await supabase.rpc("delete_user_account_lgpd", {
        p_user_id: userId,
      });

      if (anonError) {
        console.error("Error anonymizing data:", anonError);
        throw new Error("Erro ao anonimizar dados: " + anonError.message);
      }

      // 2. Call edge function to delete auth user
      const { error: deleteError } = await supabase.functions.invoke("delete-user-account", {
        body: { userId },
      });

      if (deleteError) {
        console.error("Error deleting auth user:", deleteError);
        throw new Error("Erro ao excluir conta: " + deleteError.message);
      }

      toast.success("Sua conta foi excluída com sucesso", {
        description: "Seus dados pessoais foram removidos conforme a LGPD.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast.error("Erro ao excluir conta", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setStep("warning");
      setConfirmText("");
      setUnderstood(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Excluir Minha Conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {step === "warning" ? (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
              <AlertDialogTitle className="text-center text-xl">
                Exclusão de Conta (LGPD)
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center space-y-3">
                <p>
                  De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem
                  o direito de solicitar a exclusão dos seus dados pessoais.
                </p>
                <div className="bg-muted p-3 rounded-lg text-left text-sm space-y-2">
                  <p className="font-medium text-foreground">O que será excluído:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Seus dados pessoais (nome, telefone, email)</li>
                    <li>Histórico de mensagens e preferências</li>
                    <li>Pontos de fidelidade acumulados</li>
                  </ul>
                  <p className="font-medium text-foreground mt-3">O que será mantido (anonimizado):</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Dados estatísticos de agendamentos</li>
                    <li>Informações agregadas para relatórios</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => setStep("confirm")}
                className="w-full sm:w-auto"
              >
                Continuar
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <AlertDialogTitle className="text-center text-xl">
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                <p className="text-destructive font-medium">
                  Esta ação é irreversível!
                </p>
                <p className="mt-2">
                  Para confirmar, digite: <strong>{CONFIRM_PHRASE}</strong>
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="confirm-text">Frase de confirmação</Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Digite a frase acima"
                  className="text-center font-mono"
                />
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="understood"
                  checked={understood}
                  onCheckedChange={(checked) => setUnderstood(checked === true)}
                />
                <Label htmlFor="understood" className="text-sm leading-relaxed cursor-pointer">
                  Eu entendo que esta ação é permanente e que meus dados pessoais
                  serão excluídos de acordo com a LGPD.
                </Label>
              </div>
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("warning")}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== CONFIRM_PHRASE || !understood}
                className="w-full sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Permanentemente
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
