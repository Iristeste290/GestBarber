import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Store, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarbershopLogoUploadProps {
  userId: string;
  currentLogoUrl: string | null;
  barbershopName: string;
  onLogoChange: (url: string | null) => void;
}

export const BarbershopLogoUpload = ({
  userId,
  currentLogoUrl,
  barbershopName,
  onLogoChange,
}: BarbershopLogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB");
      return;
    }

    setUploading(true);

    try {
      // Delete old logo if exists
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("barbershop-logos")
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("barbershop-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("barbershop-logos")
        .getPublicUrl(filePath);

      const newUrl = urlData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ barbershop_logo_url: newUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      onLogoChange(newUrl);
      toast.success("Logo atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload do logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!currentLogoUrl) return;

    setDeleting(true);

    try {
      // Extract file path from URL
      const urlParts = currentLogoUrl.split("/");
      const fileName = urlParts.pop();
      const filePath = `${userId}/${fileName}`;

      // Delete from storage
      await supabase.storage.from("barbershop-logos").remove([filePath]);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ barbershop_logo_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      onLogoChange(null);
      toast.success("Logo removido com sucesso!");
    } catch (error: any) {
      console.error("Erro ao remover logo:", error);
      toast.error("Erro ao remover logo");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Store className="h-4 w-4" />
        Logo da Barbearia
      </Label>

      <div className="flex items-center gap-4">
        {/* Logo Preview */}
        <div
          className={cn(
            "relative w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors",
            currentLogoUrl ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30"
          )}
        >
          {currentLogoUrl ? (
            <img
              src={currentLogoUrl}
              alt="Logo da barbearia"
              className="w-full h-full object-cover"
            />
          ) : (
            <Store className="w-8 h-8 text-muted-foreground" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || deleting}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            {currentLogoUrl ? "Trocar" : "Upload"}
          </Button>

          {currentLogoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={uploading || deleting}
              className="gap-2 text-destructive hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remover
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Recomendado: imagem quadrada, máximo 2MB. Será exibida na página de agendamento.
      </p>
    </div>
  );
};
