import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import { BarberAvatar } from "./BarberAvatar";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { UsageLimitModal } from "@/components/upgrade/UsageLimitModal";
import { useNavigate } from "react-router-dom";

interface NewBarberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBarber: (barber: { name: string; specialty: string; avatar_url: string }) => Promise<void>;
}

export function NewBarberDialog({ open, onOpenChange, onAddBarber }: NewBarberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    avatar_url: "",
  });
  const { checkCanAdd, refetch: refetchLimits } = useUsageLimits();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ current: 0, max: 0 });
  const navigate = useNavigate();

  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou JPEG");
      return;
    }

    // Validar tamanho (máximo 3MB)
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Tamanho máximo: 3MB");
      return;
    }

    setAvatarFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    setUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('barber-avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('barber-avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    // Verificar limite de barbeiros
    const check = checkCanAdd("barbers");
    if (!check.allowed) {
      setLimitInfo({ current: check.current, max: check.max });
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      // Upload avatar if selected
      let avatarUrl = "";
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        avatarUrl = uploadedUrl || "";
      }

      // Call parent handler
      await onAddBarber({
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        avatar_url: avatarUrl,
      });
      
      // Limpar formulário
      setFormData({ name: "", specialty: "", avatar_url: "" });
      setAvatarFile(null);
      setAvatarPreview("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao cadastrar barbeiro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Barbeiro</DialogTitle>
            <DialogDescription>
              Cadastre um novo barbeiro para sua equipe
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do barbeiro"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) =>
                  setFormData({ ...formData, specialty: e.target.value })
                }
                placeholder="Ex: Cortes modernos, Barba"
              />
            </div>
            
            {/* Upload de Foto */}
            <div className="grid gap-2">
              <Label>Foto do Barbeiro</Label>
              
              {avatarPreview ? (
                <div className="flex items-center gap-4">
                  <BarberAvatar
                    name={formData.name || "Novo"}
                    avatarUrl={avatarPreview}
                    size="xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeAvatar}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="avatar"
                    className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar uma foto
                    </span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG ou JPEG (máx. 3MB)
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || uploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        resource="barbers"
        current={limitInfo.current}
        max={limitInfo.max}
      />
    </>
  );
}

