import { useState, useEffect } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, UserPlus, Trash2, ShieldCheck, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface UserWithRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    full_name: string;
    barbershop_name: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  barbershop_name: string;
}

const AdminUserRoles = () => {
  const { loading: authLoading, user: currentUser } = useRequireAdmin();
  const [roles, setRoles] = useState<UserWithRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<UserWithRole | null>(null);

  const fetchData = async () => {
    try {
      // Fetch all user roles with profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles for these users
      const userIds = rolesData?.map(r => r.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, barbershop_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge roles with profiles
      const rolesWithProfiles = rolesData?.map(role => ({
        ...role,
        profile: profilesData?.find(p => p.id === role.user_id)
      })) || [];

      setRoles(rolesWithProfiles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Erro ao carregar roles");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error("Digite um email ou nome para buscar");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, barbershop_name")
        .or(`full_name.ilike.%${searchEmail}%,barbershop_name.ilike.%${searchEmail}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users who already have admin role
      const adminUserIds = roles.filter(r => r.role === "admin").map(r => r.user_id);
      const filteredResults = data?.filter(p => !adminUserIds.includes(p.id)) || [];
      
      setSearchResults(filteredResults);
      
      if (filteredResults.length === 0) {
        toast.info("Nenhum usuário encontrado ou todos já são admins");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Erro ao buscar usuários");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddAdmin = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) throw error;

      // Log audit action
      await supabase.from("admin_audit_logs").insert({
        action: "role_added",
        performed_by: currentUser?.id,
        target_user_id: userId,
        target_role: "admin",
        details: { target_name: userName }
      });

      toast.success(`${userName} agora é admin!`);
      setSearchResults([]);
      setSearchEmail("");
      fetchData();
    } catch (error: any) {
      console.error("Error adding admin:", error);
      if (error.code === "23505") {
        toast.error("Este usuário já possui esta role");
      } else {
        toast.error("Erro ao adicionar admin");
      }
    }
  };

  const handleRemoveRole = async () => {
    if (!roleToDelete) return;

    // Prevent removing own admin role
    if (roleToDelete.user_id === currentUser?.id && roleToDelete.role === "admin") {
      toast.error("Você não pode remover sua própria role de admin");
      setRoleToDelete(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleToDelete.id);

      if (error) {
        // Handle last admin protection
        if (error.message?.includes("último administrador")) {
          toast.error("Não é possível remover o último administrador do sistema");
          setRoleToDelete(null);
          return;
        }
        throw error;
      }

      // Log audit action
      await supabase.from("admin_audit_logs").insert({
        action: "role_removed",
        performed_by: currentUser?.id,
        target_user_id: roleToDelete.user_id,
        target_role: roleToDelete.role,
        details: { target_name: roleToDelete.profile?.full_name }
      });

      toast.success("Role removida com sucesso");
      setRoleToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error("Error removing role:", error);
      toast.error(error.message || "Erro ao remover role");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const adminCount = roles.filter(r => r.role === "admin").length;

  return (
    <AppLayout
      title="Gerenciar Roles"
      description="Adicione ou remova permissões de administrador"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Admins</CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminCount}</div>
              <p className="text-xs text-muted-foreground">usuários com acesso admin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Roles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">roles atribuídas</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Adicionar Admin
            </CardTitle>
            <CardDescription>
              Busque um usuário por nome ou barbearia para conceder permissões de admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome ou barbearia..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y">
                {searchResults.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{profile.full_name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{profile.barbershop_name || "Sem barbearia"}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddAdmin(profile.id, profile.full_name || "Usuário")}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Tornar Admin
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Roles Ativas
                </CardTitle>
                <CardDescription>
                  Lista de todas as roles atribuídas no sistema
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma role encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Barbearia</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Adicionado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {role.profile?.full_name || "Sem nome"}
                            {role.user_id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">Você</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{role.profile?.barbershop_name || "-"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={role.role === "admin" ? "default" : "secondary"}
                            className={role.role === "admin" ? "bg-primary" : ""}
                          >
                            {role.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(role.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setRoleToDelete(role)}
                            disabled={role.user_id === currentUser?.id && role.role === "admin"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
        onConfirm={handleRemoveRole}
        title="Remover Role"
        description={`Tem certeza que deseja remover a role "${roleToDelete?.role}" de ${roleToDelete?.profile?.full_name || "este usuário"}?`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
      />
    </AppLayout>
  );
};

export default AdminUserRoles;
