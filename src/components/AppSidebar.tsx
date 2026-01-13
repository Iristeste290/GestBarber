import { LayoutDashboard, Calendar, Package, Users, Award, Scissors, LogOut, Target, DollarSign, Zap, ImagePlus, Wallet, Calculator, Settings, TrendingUp, UserCircle, CreditCard, HelpCircle, ChevronDown, Clock, MessageCircle, Crown, ShieldCheck, Shield, BarChart3, ListChecks, UserCog, Smartphone, Rocket } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { FeatureWaitlistDialog } from "@/components/waitlist/FeatureWaitlistDialog";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";

// Core MVP items - always visible
const coreMenuItems = [
  { title: "Painel", url: "/painel", icon: LayoutDashboard },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Barbeiros", url: "/barbeiros", icon: Users },
  { title: "Serviços", url: "/servicos", icon: Scissors },
  { title: "Custos", url: "/custos", icon: DollarSign },
  { title: "Relatórios", url: "/relatorios", icon: TrendingUp },
  { title: "Caixa", url: "/caixa", icon: Calculator },
  { title: "Growth Engine", url: "/growth-engine", icon: Rocket },
];

// Advanced items - hidden in "Mais" submenu (coming soon)
const advancedMenuItems = [
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "Automação", url: "/automacao", icon: Zap },
  { title: "Posts Prontos", url: "/posts-prontos", icon: ImagePlus },
  { title: "Pagamentos", url: "/pagamentos", icon: Wallet },
  { title: "Config WhatsApp", url: "/configuracoes/whatsapp", icon: Settings },
];

// Settings/account items
const settingsMenuItems = [
  { title: "Planos", url: "/planos", icon: CreditCard },
  { title: "Meu Perfil", url: "/perfil", icon: UserCircle },
];

// Help section items
const helpMenuItems = [
  { title: "Central de Ajuda", url: "/ajuda", icon: HelpCircle, proOnly: false },
  { title: "Suporte", url: "/suporte", icon: MessageCircle, proOnly: true },
];

// Admin section items
const adminMenuItems = [
  { title: "Logs de Segurança", url: "/admin/fraude", icon: Shield },
  { title: "Stats Ajuda", url: "/admin/ajuda-stats", icon: BarChart3 },
  { title: "Waitlist", url: "/admin/waitlist", icon: ListChecks },
  { title: "Feedbacks Trial", url: "/admin/feedbacks", icon: MessageCircle },
  { title: "Analytics PWA", url: "/admin/pwa", icon: Smartphone },
  { title: "Gerenciar Roles", url: "/admin/roles", icon: UserCog },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { profile } = useUserProfile(user);
  const { isFreemium } = usePlanValidation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(() => location.pathname.startsWith("/admin"));
  const [waitlistFeature, setWaitlistFeature] = useState<string | null>(null);

  // Handle click on coming soon feature - opens waitlist dialog
  const handleComingSoonClick = (featureName: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setWaitlistFeature(featureName);
  };

  useEffect(() => {
    const checkAdminRole = async (userId: string) => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!data);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => checkAdminRole(session.user.id), 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Logout realizado com sucesso");
      navigate("/");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-3 py-3">
            <SidebarGroupLabel className={`${collapsed ? "px-0" : ""} text-primary font-bold text-lg`}>
              {collapsed ? (
                <span className="text-primary">GB</span>
              ) : (
                <span className="bg-gradient-gold bg-clip-text text-transparent">GestBarber</span>
              )}
            </SidebarGroupLabel>
            {!collapsed && user && <NotificationBell userId={user.id} />}
          </div>
          {profile?.barbershop_name && !collapsed && (
            <div className="px-3 py-2 flex items-center gap-2 border-b border-border/50 mb-2">
              <span className="text-sm text-muted-foreground">{profile.barbershop_name}</span>
              {isAdmin && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                  <ShieldCheck className="h-3 w-3 mr-0.5" />
                  Admin
                </Badge>
              )}
            </div>
          )}
          {!profile?.barbershop_name && !collapsed && isAdmin && (
            <div className="px-3 py-2 border-b border-border/50 mb-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                <ShieldCheck className="h-3 w-3 mr-0.5" />
                Admin
              </Badge>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Core MVP items */}
              {coreMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath === item.url}
                    aria-label={`Navegar para ${item.title}`}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`flex items-center gap-3 transition-all duration-200 rounded-lg ${
                        currentPath === item.url 
                          ? "bg-sidebar-accent text-primary border-l-2 border-primary pl-2.5" 
                          : "hover:bg-sidebar-accent/50"
                      }`}
                      activeClassName="bg-sidebar-accent text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${currentPath === item.url ? "text-primary" : ""}`} aria-hidden="true" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Advanced features - coming soon for non-admins, accessible for admins */}
              {!collapsed && (
                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span>Mais</span>
                          {!isAdmin && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Em breve
                            </Badge>
                          )}
                          {isAdmin && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                              Dev
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {advancedMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        {isAdmin ? (
                          // Admins can navigate normally
                          <SidebarMenuButton 
                            asChild 
                            isActive={currentPath === item.url}
                            aria-label={`Navegar para ${item.title}`}
                          >
                            <NavLink 
                              to={item.url} 
                              end 
                              className="flex items-center gap-3"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        ) : (
                          // Non-admins see coming soon
                          <SidebarMenuButton 
                            aria-label={`${item.title} - Em breve`}
                            className="opacity-50 cursor-not-allowed"
                            onClick={handleComingSoonClick(item.title)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                              <span>{item.title}</span>
                            </div>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Settings items */}
              {settingsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath === item.url}
                    aria-label={`Navegar para ${item.title}`}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Admin section - only visible for admins */}
              {isAdmin && !collapsed && (
                <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                          <span>Admin</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {adminMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={currentPath === item.url}
                          aria-label={`Navegar para ${item.title}`}
                        >
                          <NavLink 
                            to={item.url} 
                            end 
                            className="flex items-center gap-3"
                            activeClassName="bg-accent text-accent-foreground font-medium"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
              {isAdmin && collapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath.startsWith("/admin")}
                    aria-label="Admin"
                  >
                    <NavLink 
                      to="/admin/waitlist" 
                      className="flex items-center gap-3"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Help section - collapsible */}
              {!collapsed ? (
                <Collapsible open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <HelpCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <span>Ajuda</span>
                          {isFreemium && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <Crown className="h-3 w-3 mr-0.5" />
                              Pro
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isHelpOpen ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {helpMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={currentPath === item.url}
                          aria-label={`Navegar para ${item.title}`}
                        >
                          <NavLink 
                            to={item.url} 
                            end 
                            className="flex items-center gap-3"
                            activeClassName="bg-accent text-accent-foreground font-medium"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                            <span>{item.title}</span>
                            {item.proOnly && isFreemium && (
                              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <Crown className="h-3 w-3 mr-0.5" />
                                Pro
                              </Badge>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath === "/ajuda" || currentPath === "/suporte"}
                    aria-label="Navegar para Ajuda"
                  >
                    <NavLink 
                      to="/ajuda" 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <HelpCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setIsLogoutDialogOpen(true)} 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label="Sair da conta"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <ConfirmationDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        onConfirm={handleLogout}
        title="Sair da conta?"
        description="Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema."
        confirmText="Sair"
        cancelText="Cancelar"
        variant="destructive"
      />
      
      <FeatureWaitlistDialog
        open={!!waitlistFeature}
        onOpenChange={(open) => !open && setWaitlistFeature(null)}
        featureName={waitlistFeature || ""}
        userEmail={user?.email}
      />
    </Sidebar>
  );
}
