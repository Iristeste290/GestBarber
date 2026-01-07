import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { BarberAvatar } from "./BarberAvatar";

interface BarberAvatarUploadProps {
  barberId: string;
  barberName: string;
  currentAvatarUrl?: string | null;
  onAvatarUpdated: () => void;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export function BarberAvatarUpload({
  barberId,
  barberName,
  currentAvatarUrl,
  onAvatarUpdated,
}: BarberAvatarUploadProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou JPEG");
      return;
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Tamanho máximo: 3MB");
      return;
    }

    setSelectedFile(file);

    // Gerar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione uma foto primeiro");
      return;
    }

    setLoading(true);
    try {
      // Deletar avatar antigo se existir
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split("/barber-avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("barber-avatars").remove([oldPath]);
        }
      }

      // Upload nova foto
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
      const fileName = `${barberId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("barber-avatars")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("barber-avatars")
        .getPublicUrl(fileName);

      // Atualizar registro no banco
      const { error: updateError } = await supabase
        .from("barbers")
        .update({ avatar_url: publicUrl })
        .eq("id", barberId);

      if (updateError) throw updateError;

      toast.success("✅ Foto atualizada com sucesso!");
      onAvatarUpdated();
      setOpen(false);
      handleRemoveFile();
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl) {
      toast.error("Não há foto para remover");
      return;
    }

    setLoading(true);
    try {
      // Deletar do storage
      const oldPath = currentAvatarUrl.split("/barber-avatars/")[1];
      if (oldPath) {
        await supabase.storage.from("barber-avatars").remove([oldPath]);
      }

      // Atualizar banco
      const { error } = await supabase
        .from("barbers")
        .update({ avatar_url: null })
        .eq("id", barberId);

      if (error) throw error;

      toast.success("Foto removida com sucesso");
      onAvatarUpdated();
      setOpen(false);
    } catch (error: any) {
      toast.error("Erro ao remover foto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Camera className="h-4 w-4" />
        {currentAvatarUrl ? "Alterar Foto" : "Adicionar Foto"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Foto de Perfil</DialogTitle>
            <DialogDescription>
              Atualize a foto de perfil de {barberName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Preview atual ou novo */}
            <div className="flex flex-col items-center gap-4">
              <BarberAvatar
                name={barberName}
                avatarUrl={previewUrl || currentAvatarUrl}
                size="xl"
              />
              
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-medium">{barberName}</p>
                {currentAvatarUrl && !previewUrl && (
                  <p className="text-xs text-muted-foreground">Foto atual</p>
                )}
                {previewUrl && (
                  <p className="text-xs text-green-600">Nova foto selecionada</p>
                )}
              </div>
            </div>

            {/* Upload de arquivo */}
            {!selectedFile ? (
              <div className="space-y-2">
                <Label htmlFor="avatar-upload" className="text-sm font-medium">
                  Selecionar Nova Foto
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Label
                  htmlFor="avatar-upload"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Clique para selecionar uma foto
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG ou JPEG (máx. 3MB)
                    </p>
                  </div>
                </Label>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Upload className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm truncate">{selectedFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tamanho: {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {currentAvatarUrl && !selectedFile && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemoveAvatar}
                disabled={loading}
                className="sm:mr-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  "Remover Foto"
                )}
              </Button>
            )}
            <div className="flex gap-2 flex-1 sm:flex-initial">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  handleRemoveFile();
                }}
                disabled={loading}
                className="flex-1 sm:flex-initial"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={loading || !selectedFile}
                className="flex-1 sm:flex-initial"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Salvar Foto
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
