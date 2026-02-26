import { useEffect, useState, useContext } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ImageIcon, 
  ShoppingBag,
  LogOut,
  BookOpen,
  Package,
  Gift,
  Mail,
  MailCheck,
  Truck,
  BarChart3,
  Cookie,
  MousePointer,
  Globe,
  CreditCard,
  Save,
  Loader2
} from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ThemeToggle from "@/components/ThemeToggle";
import { AdminSaveProvider, AdminSaveContext } from "@/contexts/AdminSaveContext";
import AdminBanners from "@/components/admin/AdminBanners";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminVerses from "@/components/admin/AdminVerses";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminGlobalCoupon from "@/components/admin/AdminGlobalCoupon";
import AdminNewsletter from "@/components/admin/AdminNewsletter";
import AdminShipping from "@/components/admin/AdminShipping";
import AdminPixels from "@/components/admin/AdminPixels";
import AdminEmails from "@/components/admin/AdminEmails";
import AdminCookies from "@/components/admin/AdminCookies";
import AdminCTA from "@/components/admin/AdminCTA";
import AdminSEO from "@/components/admin/AdminSEO";
import AdminGateway from "@/components/admin/AdminGateway";

const menuItems = [
  { id: "orders", title: "Pedidos", icon: Package, description: "Gerenciar pedidos" },
  { id: "products", title: "Produtos", icon: ShoppingBag, description: "Criar e editar produtos" },
  { id: "shipping", title: "Frete", icon: Truck, description: "Configurar frete" },
  { id: "gateway", title: "Gateway", icon: CreditCard, description: "Mercado Pago e pagamentos" },
  { id: "cta", title: "CTA", icon: MousePointer, description: "Botões e textos de ação" },
  { id: "coupon", title: "Cupom", icon: Gift, description: "Cupons de desconto" },
  { id: "banners", title: "Banners", icon: ImageIcon, description: "Carrossel, cards e CTA" },
  { id: "verses", title: "Versículos", icon: BookOpen, description: "Versículo do dia" },
  { id: "emails", title: "Emails", icon: MailCheck, description: "Templates de emails transacionais" },
  { id: "newsletter", title: "Newsletter", icon: Mail, description: "Gerenciar inscritos e configurações" },
  { id: "pixels", title: "Pixels", icon: BarChart3, description: "Rastreamento e analytics" },
  { id: "cookies", title: "Cookies", icon: Cookie, description: "Aviso de cookies e consentimento" },
  { id: "seo", title: "SEO", icon: Globe, description: "Open Graph e meta tags" },
  { id: "footer", title: "Footer", icon: BookOpen, description: "Sobre, Políticas, Devoluções" },
];

export default function Admin() {
  const [activeSection, setActiveSection] = useState("orders");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: authCheck, isLoading: isCheckingAuth, isError } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/check'],
    retry: 1,
  });

  useEffect(() => {
    if (authCheck && !authCheck.isAdmin) {
      setLocation("/admin/login");
    }
    if (isError) {
      setLocation("/admin/login");
    }
  }, [authCheck, isError, setLocation]);

  if (isCheckingAuth || isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-sm text-muted-foreground lowercase">
            {isError ? 'redirecionando...' : 'verificando acesso...'}
          </p>
        </div>
      </div>
    );
  }

  if (authCheck && !authCheck.isAdmin) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      localStorage.removeItem('admin_session');
      toast({
        title: "Logout realizado",
        description: "Até breve!",
      });
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "orders":
        return <AdminOrders />;
      case "banners":
        return <AdminBanners />;
      case "products":
        return <AdminProducts />;
      case "shipping":
        return <AdminShipping />;
      case "gateway":
        return <AdminGateway />;
      case "cta":
        return <AdminCTA />;
      case "coupon":
        return <AdminGlobalCoupon />;
      case "emails":
        return <AdminEmails />;
      case "newsletter":
        return <AdminNewsletter />;
      case "pixels":
        return <AdminPixels />;
      case "cookies":
        return <AdminCookies />;
      case "seo":
        return <AdminSEO />;
      case "verses":
        return <AdminVerses />;
      case "footer":
        return <AdminFooter />;
      default:
        return <AdminOrders />;
    }
  };

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  const activeMenuItem = menuItems.find(item => item.id === activeSection);

  const inner = (
    <SidebarProvider style={style as React.CSSProperties} defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        <Sidebar className="hidden md:flex" collapsible="icon">
          <SidebarHeader className="border-b group-data-[collapsible=icon]:p-2 p-6">
            <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <h2 className="text-2xl font-light lowercase tracking-tight truncate">oudla admin</h2>
                <p className="text-xs text-muted-foreground lowercase mt-1 truncate">painel de controle</p>
              </div>
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
                <ThemeToggle />
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="lowercase">navegação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        data-testid={`button-admin-nav-${item.id}`}
                        tooltip={item.title}
                        className="group-data-[collapsible=icon]:justify-center py-5"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="lowercase font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t group-data-[collapsible=icon]:p-2 p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  data-testid="button-admin-logout"
                  tooltip="sair do painel"
                  className="group-data-[collapsible=icon]:justify-center"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span className="lowercase group-data-[collapsible=icon]:hidden">sair do painel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          <div className="hidden md:flex items-center justify-between border-b bg-background sticky top-0 z-10 px-6 py-3 gap-3">
            {activeMenuItem && (
              <div className="min-w-0">
                <h3 className="text-sm font-medium lowercase">{activeMenuItem.title}</h3>
                <p className="text-xs text-muted-foreground lowercase">{activeMenuItem.description}</p>
              </div>
            )}
            <AdminSaveBar />
          </div>

          <div className="md:hidden bg-background sticky top-0 z-20">
            <div className="px-5 pt-6 pb-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-semibold lowercase tracking-tight">oudla admin</h2>
                  <p className="text-[13px] text-muted-foreground/60 lowercase">painel de controle</p>
                </div>
                <div className="flex items-center gap-1">
                  <AdminSaveBar />
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="rounded-full"
                    data-testid="button-admin-logout-mobile"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Select value={activeSection} onValueChange={setActiveSection}>
                <SelectTrigger className="w-full h-12 rounded-2xl border-0 bg-muted/40 px-4 text-[15px] lowercase font-medium shadow-none focus:ring-0" data-testid="select-mobile-section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 rounded-xl border-0 shadow-lg p-1.5">
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="lowercase rounded-lg h-11 text-[14px] px-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-[11px] text-muted-foreground/40 leading-none">{item.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-px bg-border/40" />
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );

  return (
    <AdminSaveProvider key={activeSection}>
      {inner}
    </AdminSaveProvider>
  );
}

function AdminSaveBar() {
  const { hasSave, isSaving, save } = useContext(AdminSaveContext);
  if (!hasSave) return null;
  return (
    <Button
      onClick={save}
      disabled={isSaving}
      size="default"
      className="lowercase shrink-0"
      data-testid="button-admin-save"
    >
      {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      salvar
    </Button>
  );
}
