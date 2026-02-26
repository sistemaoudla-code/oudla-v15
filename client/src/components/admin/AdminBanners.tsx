import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Palette,
  Megaphone,
  Upload,
  X,
  Loader2,
  Layout,
  Type,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BannerForm from "./BannerForm";
import ContentCardForm from "./ContentCardForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ContentCard } from "@shared/schema";
import { useRef } from "react";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string | null;
  ctaLink: string | null;
  productId: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  position: string;
  showText: boolean;
  sortOrder: number;
  isActive: boolean;
}

type BannerSection = "carousel" | "cards" | "cta";

export default function AdminBanners() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ctaFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<BannerSection>("carousel");
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [editingCard, setEditingCard] = useState<ContentCard | null>(null);
  const [isUploadingCta, setIsUploadingCta] = useState(false);
  const [isDraggingCta, setIsDraggingCta] = useState(false);
  const [ctaFormInitialized, setCtaFormInitialized] = useState(false);
  const [ctaFormData, setCtaFormData] = useState({
    tagLabel: "",
    title: "",
    description: "",
    buttonText: "",
    buttonBgColor: "#ffffff",
  });

  // Queries
  const { data: bannersData, isLoading: isLoadingBanners } = useQuery<{ banners: Banner[] }>({
    queryKey: ['/api/admin/banners'],
  });

  const { data: cardsData, isLoading: isLoadingCards } = useQuery<{ cards: ContentCard[] }>({
    queryKey: ['/api/admin/content-cards'],
  });

  const { data: ctaData, isLoading: isLoadingCta } = useQuery<{ config: any }>({
    queryKey: ['/api/admin/cta-banner'],
  });

  if (ctaData?.config && !ctaFormInitialized) {
    setCtaFormInitialized(true);
    setCtaFormData({
      tagLabel: ctaData.config.tagLabel || "",
      title: ctaData.config.title || "",
      description: ctaData.config.description || "",
      buttonText: ctaData.config.buttonText || "",
      buttonBgColor: ctaData.config.buttonBgColor || "#ffffff",
    });
  }

  // Mutations for Carousel
  const deleteBannerMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/banners/${bannerId}`);
      if (!response.ok) throw new Error("Erro ao deletar banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      toast({
        title: "Banner deletado",
        description: "O banner foi removido com sucesso.",
      });
      setDeletingBanner(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível deletar o banner.",
      });
    },
  });

  const updateBannerOrderMutation = useMutation({
    mutationFn: async ({ bannerId, newOrder }: { bannerId: string; newOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/admin/banners/${bannerId}`, {
        sortOrder: newOrder,
      });
      if (!response.ok) throw new Error("Erro ao atualizar ordem");
      return response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/admin/banners'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a ordem do banner.",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ bannerId, isActive }: { bannerId: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/banners/${bannerId}`, {
        isActive,
      });
      if (!response.ok) throw new Error("Erro ao atualizar status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/admin/banners'] });
      toast({
        title: "Status atualizado",
        description: "O banner foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do banner.",
      });
    },
  });

  // Mutations for CTA
  const updateCtaMutation = useMutation({
    mutationFn: async (data: typeof ctaFormData) => {
      const response = await apiRequest("PUT", "/api/admin/cta-banner", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cta-banner'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cta-banner'] });
      toast({
        title: "Banner atualizado",
        description: "As configurações foram salvas com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o banner.",
      });
    }
  });

  // CTA handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCta(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const sessionId = localStorage.getItem('admin_session');
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch("/api/admin/cta-banner/image", {
        method: "POST",
        headers,
        body: uploadFormData,
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/cta-banner'] });
        queryClient.invalidateQueries({ queryKey: ['/api/cta-banner'] });
        toast({
          title: "Imagem atualizada",
          description: "A imagem de fundo foi atualizada com sucesso!",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
      });
    } finally {
      setIsUploadingCta(false);
      if (ctaFileInputRef.current) {
        ctaFileInputRef.current.value = '';
      }
    }
  };

  const handleCtaDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCta(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem.",
      });
      return;
    }

    setIsUploadingCta(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const sessionId = localStorage.getItem('admin_session');
      const headers: Record<string, string> = {};
      if (sessionId) headers['x-session-id'] = sessionId;
      const response = await fetch("/api/admin/cta-banner/image", {
        method: "POST",
        headers,
        body: uploadFormData,
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/cta-banner'] });
        queryClient.invalidateQueries({ queryKey: ['/api/cta-banner'] });
        toast({ title: "Imagem atualizada", description: "A imagem de fundo foi atualizada com sucesso!" });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível fazer upload da imagem." });
    } finally {
      setIsUploadingCta(false);
    }
  };

  const handleRemoveCtaImage = async () => {
    try {
      const response = await apiRequest("PUT", "/api/admin/cta-banner", {
        backgroundImageUrl: null
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/cta-banner'] });
        queryClient.invalidateQueries({ queryKey: ['/api/cta-banner'] });
        toast({
          title: "Imagem removida",
          description: "A imagem de fundo foi removida.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a imagem.",
      });
    }
  };

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCtaMutation.mutate(ctaFormData);
  };

  // Carousel data
  const banners = bannersData?.banners || [];
  const sortedBanners = [...banners].sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));

  // Cards data
  const cards = cardsData?.cards || [];
  const featureCard = cards.find(c => c.cardType === 'feature');
  const lifestyleCard = cards.find(c => c.cardType === 'lifestyle');

  // Carousel handlers
  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const current = sortedBanners[index];
    const previous = sortedBanners[index - 1];
    
    // Simplificando a troca de ordens
    const currentOrder = current.sortOrder ?? 0;
    const previousOrder = previous.sortOrder ?? 0;

    // Se as ordens forem iguais, forçamos uma diferença
    const newCurrentOrder = currentOrder === previousOrder ? currentOrder + 1 : previousOrder;
    const newPreviousOrder = currentOrder === previousOrder ? currentOrder : currentOrder;

    try {
      await apiRequest("PATCH", `/api/admin/banners/${current.id}`, { sortOrder: newCurrentOrder });
      await apiRequest("PATCH", `/api/admin/banners/${previous.id}`, { sortOrder: newPreviousOrder });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      toast({
        title: "Ordem atualizada",
        description: "A posição do banner foi alterada.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a ordem.",
      });
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === sortedBanners.length - 1) return;
    
    const current = sortedBanners[index];
    const next = sortedBanners[index + 1];
    
    const currentOrder = current.sortOrder ?? 0;
    const nextOrder = next.sortOrder ?? 0;

    const newCurrentOrder = currentOrder === nextOrder ? currentOrder - 1 : nextOrder;
    const newNextOrder = currentOrder === nextOrder ? currentOrder : currentOrder;

    try {
      await apiRequest("PATCH", `/api/admin/banners/${current.id}`, { sortOrder: newCurrentOrder });
      await apiRequest("PATCH", `/api/admin/banners/${next.id}`, { sortOrder: newNextOrder });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      toast({
        title: "Ordem atualizada",
        description: "A posição do banner foi alterada.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a ordem.",
      });
    }
  };

  // Check if showing form
  if (showForm && activeSection === "carousel") {
    return (
      <BannerForm
        banner={editingBanner}
        onClose={() => {
          setShowForm(false);
          setEditingBanner(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingBanner(null);
        }}
      />
    );
  }

  if (editingCard) {
    return (
      <ContentCardForm
        card={editingCard}
        onClose={() => setEditingCard(null)}
        onSuccess={() => setEditingCard(null)}
      />
    );
  }

  // Main render
  const isLoading = isLoadingBanners || isLoadingCards || isLoadingCta;
  const currentCtaImage = ctaData?.config?.backgroundImageUrl;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-light lowercase truncate">gerenciar banners</h1>
          <p className="text-sm text-muted-foreground lowercase">configure todos os tipos de banners do site</p>
        </div>

        {/* Mobile Dropdown */}
        <div className="block sm:hidden">
          <div className="relative">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as "carousel" | "cards" | "cta")}
              className="w-full appearance-none bg-background border border-border rounded-md px-4 py-2.5 pr-10 text-sm lowercase focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="select-banner-section"
            >
              <option value="carousel">carrossel</option>
              <option value="cards">feature & lifestyle</option>
              <option value="cta">cta banner</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex gap-2 flex-wrap">
          <Button
            variant={activeSection === "carousel" ? "default" : "outline"}
            onClick={() => setActiveSection("carousel")}
            className="lowercase gap-2"
            data-testid="button-tab-carousel"
          >
            <ImageIcon className="h-4 w-4" />
            carrossel
          </Button>
          <Button
            variant={activeSection === "cards" ? "default" : "outline"}
            onClick={() => setActiveSection("cards")}
            className="lowercase gap-2"
            data-testid="button-tab-cards"
          >
            <Palette className="h-4 w-4" />
            feature & lifestyle
          </Button>
          <Button
            variant={activeSection === "cta" ? "default" : "outline"}
            onClick={() => setActiveSection("cta")}
            className="lowercase gap-2"
            data-testid="button-tab-cta"
          >
            <Megaphone className="h-4 w-4" />
            cta banner
          </Button>
        </div>
      </div>

      {/* Carousel Section */}
      {activeSection === "carousel" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-medium lowercase">carrossel da home</h2>
              <p className="text-sm text-muted-foreground lowercase">criar, editar e organizar banners do carrossel</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="gap-2 w-full sm:w-auto"
              data-testid="button-add-banner"
            >
              <Plus className="h-4 w-4" />
              <span className="lowercase">adicionar</span>
            </Button>
          </div>

          {isLoadingBanners ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground lowercase">carregando banners...</p>
            </div>
          ) : sortedBanners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base font-medium lowercase mb-2">nenhum banner cadastrado</h3>
                <p className="text-sm text-muted-foreground lowercase mb-4">
                  comece adicionando seu primeiro banner
                </p>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="lowercase">adicionar banner</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedBanners.map((banner, index) => (
                <Card key={banner.id} className="overflow-hidden hover-elevate transition-all cursor-pointer group" onClick={() => handleEdit(banner)}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Preview */}
                      <div className="relative w-full md:w-48 h-32 bg-muted rounded overflow-hidden flex-shrink-0">
                        {banner.imageUrl ? (
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-lg lowercase truncate">{banner.title}</h3>
                          <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                            <Badge variant={banner.isActive ? "default" : "secondary"} className="lowercase rounded-full px-3 h-6 flex items-center">
                              {banner.isActive ? "ativo" : "inativo"}
                            </Badge>
                            <Badge variant="outline" className="lowercase rounded-full px-3 h-6 flex items-center border-white/10">
                              texto: {banner.position}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground lowercase line-clamp-2 mb-3 opacity-70">
                          {banner.subtitle}
                        </p>
                        {banner.ctaText && (
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/30 border border-white/5">
                            <span className="text-[10px] font-bold text-primary lowercase tracking-wider">{banner.ctaText}</span>
                            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                              {banner.productId ? `produto #${banner.productId.slice(0, 8)}...` : banner.ctaLink}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions - Apple Style Floating Menu */}
                      <div className="flex md:flex-row items-center gap-1 bg-muted/20 p-1 rounded-2xl border border-white/5 h-fit self-center">
                        <div className="flex items-center border-r border-white/10 pr-1 mr-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveUp(index);
                            }}
                            disabled={index === 0}
                            data-testid={`button-move-up-${banner.id}`}
                            className="h-8 w-8 rounded-xl hover:bg-white/10"
                          >
                            <MoveUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveDown(index);
                            }}
                            disabled={index === sortedBanners.length - 1}
                            data-testid={`button-move-down-${banner.id}`}
                            className="h-8 w-8 rounded-xl hover:bg-white/10"
                          >
                            <MoveDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActiveMutation.mutate({ 
                              bannerId: banner.id, 
                              isActive: !banner.isActive 
                            });
                          }}
                          data-testid={`button-toggle-${banner.id}`}
                          className={`h-9 w-9 rounded-xl transition-all ${banner.isActive ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          {banner.isActive ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(banner);
                          }}
                          data-testid={`button-edit-${banner.id}`}
                          className="h-9 w-9 rounded-xl hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingBanner(banner);
                          }}
                          data-testid={`button-delete-${banner.id}`}
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cards Section */}
      {activeSection === "cards" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg md:text-xl font-medium lowercase">cards de conteúdo</h2>
            <p className="text-sm text-muted-foreground lowercase">
              edite os 2 banners fixos da home (feature e lifestyle)
            </p>
          </div>

          {isLoadingCards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feature Card */}
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    <CardTitle className="text-lg lowercase">feature banner</CardTitle>
                  </div>
                </CardHeader>
                {featureCard ? (
                  <>
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={featureCard.imageUrl}
                        alt={featureCard.title || 'Feature Banner'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-medium lowercase">
                          {featureCard.title || 'sem título'}
                        </h3>
                        {featureCard.subtitle && (
                          <p className="text-sm text-muted-foreground lowercase">
                            {featureCard.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${featureCard.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground lowercase">
                          {featureCard.isActive ? 'ativo' : 'inativo'}
                        </span>
                      </div>
                      <Button 
                        onClick={() => setEditingCard(featureCard)}
                        className="w-full lowercase"
                        data-testid="button-edit-feature"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        editar
                      </Button>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-12 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground lowercase mb-4">
                      feature banner não configurado
                    </p>
                    <p className="text-xs text-muted-foreground lowercase mb-4">
                      este banner precisa ser criado no banco de dados
                    </p>
                  </CardContent>
                )}
              </Card>

              {/* Lifestyle Card */}
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    <CardTitle className="text-lg lowercase">lifestyle banner</CardTitle>
                  </div>
                </CardHeader>
                {lifestyleCard ? (
                  <>
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={lifestyleCard.imageUrl}
                        alt={lifestyleCard.title || 'Lifestyle Banner'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-medium lowercase">
                          {lifestyleCard.title || 'sem título'}
                        </h3>
                        {lifestyleCard.subtitle && (
                          <p className="text-sm text-muted-foreground lowercase">
                            {lifestyleCard.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${lifestyleCard.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground lowercase">
                          {lifestyleCard.isActive ? 'ativo' : 'inativo'}
                        </span>
                      </div>
                      <Button 
                        onClick={() => setEditingCard(lifestyleCard)}
                        className="w-full lowercase"
                        data-testid="button-edit-lifestyle"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        editar
                      </Button>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-12 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground lowercase mb-4">
                      lifestyle banner não configurado
                    </p>
                    <p className="text-xs text-muted-foreground lowercase mb-4">
                      este banner precisa ser criado no banco de dados
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* CTA Section */}
      {activeSection === "cta" && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
          <div>
            <h2 className="text-3xl font-light lowercase tracking-tight">banner cta</h2>
            <p className="text-sm text-muted-foreground lowercase opacity-70">configurar o banner "ver todos os produtos"</p>
          </div>

          {isLoadingCta ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground lowercase">carregando configurações...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Preview & Image Upload - Full Width */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Layout className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">visualização e imagem</h3>
                </div>

                <Card className="overflow-hidden border-white/5 bg-muted/20 backdrop-blur-sm transition-all hover:bg-muted/30 rounded-[2rem]">
                  <CardContent className="p-0">
                    {currentCtaImage ? (
                      <div
                        className={`relative group aspect-[21/9] ${isDraggingCta ? 'ring-2 ring-primary/30 ring-inset' : ''}`}
                        onDrop={handleCtaDrop}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCta(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCta(false); }}
                      >
                        <img
                          src={currentCtaImage}
                          alt="Banner background"
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 lowercase"
                            onClick={() => ctaFileInputRef.current?.click()}
                            disabled={isUploadingCta}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingCta ? "enviando..." : "trocar imagem"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-full backdrop-blur-md border-white/10 hover:bg-destructive/80 lowercase"
                            onClick={handleRemoveCtaImage}
                          >
                            <X className="h-4 w-4 mr-2" />
                            remover
                          </Button>
                        </div>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                          {ctaFormData.tagLabel && (
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-2 drop-shadow-md">{ctaFormData.tagLabel}</span>
                          )}
                          <h3 className="text-2xl md:text-3xl font-light text-white mb-2 drop-shadow-lg lowercase">{ctaFormData.title}</h3>
                          <p className="text-xs text-white/80 max-w-md line-clamp-2 drop-shadow-md lowercase">{ctaFormData.description}</p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`aspect-[21/9] flex flex-col items-center justify-center cursor-pointer group ${isDraggingCta ? 'bg-primary/10 ring-2 ring-primary/30 ring-inset' : ''}`}
                        onClick={() => ctaFileInputRef.current?.click()}
                        onDrop={handleCtaDrop}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCta(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCta(false); }}
                      >
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                          <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm font-medium lowercase mb-1">{isDraggingCta ? "solte a imagem aqui" : "clique para upload"}</p>
                        <p className="text-xs text-muted-foreground lowercase text-center px-4">recomendado: 1920x800px para tela cheia</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <input
                  ref={ctaFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Configuration Form - Full Width */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">textos e estilos</h3>
                </div>

                <form onSubmit={handleCtaSubmit} className="rounded-[2rem] bg-muted/10 border border-white/5 backdrop-blur-sm p-6 sm:p-8 space-y-0">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tagLabel" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">label superior</Label>
                      <Input
                        id="tagLabel"
                        value={ctaFormData.tagLabel}
                        onChange={(e) => setCtaFormData({ ...ctaFormData, tagLabel: e.target.value })}
                        placeholder="ex: coleção completa"
                        className="bg-muted/20 border-white/5 rounded-2xl h-12 px-5 lowercase focus:bg-muted/30 transition-all"
                        data-testid="input-cta-tag-label"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 text-primary/70">título *</Label>
                      <Input
                        id="title"
                        value={ctaFormData.title}
                        onChange={(e) => setCtaFormData({ ...ctaFormData, title: e.target.value })}
                        placeholder="ex: explore toda a coleção"
                        required
                        className="bg-muted/20 border-white/5 rounded-2xl h-12 px-5 lowercase focus:bg-muted/30 transition-all"
                        data-testid="input-cta-title"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">descrição</Label>
                      <Textarea
                        id="description"
                        value={ctaFormData.description}
                        onChange={(e) => setCtaFormData({ ...ctaFormData, description: e.target.value })}
                        placeholder="ex: descubra peças únicas..."
                        rows={2}
                        className="bg-muted/20 border-white/5 rounded-2xl px-5 py-3 lowercase focus:bg-muted/30 transition-all resize-none leading-relaxed"
                        data-testid="input-cta-description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buttonText" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 text-primary/70">texto do botão *</Label>
                      <Input
                        id="buttonText"
                        value={ctaFormData.buttonText}
                        onChange={(e) => setCtaFormData({ ...ctaFormData, buttonText: e.target.value })}
                        placeholder="ex: ver todos os produtos"
                        required
                        className="bg-muted/20 border-white/5 rounded-2xl h-12 px-5 lowercase focus:bg-muted/30 transition-all"
                        data-testid="input-cta-button-text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buttonBgColor" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">cor do botão</Label>
                      <div className="flex gap-3 items-center">
                        <Input
                          id="buttonBgColor"
                          type="color"
                          value={ctaFormData.buttonBgColor}
                          onChange={(e) => setCtaFormData({ ...ctaFormData, buttonBgColor: e.target.value })}
                          className="w-12 h-12 p-1 bg-muted/20 border-white/5 rounded-2xl cursor-pointer shrink-0"
                          data-testid="input-cta-button-color"
                        />
                        <div className="flex-1 space-y-1">
                          <Input
                            value={ctaFormData.buttonBgColor}
                            onChange={(e) => setCtaFormData({ ...ctaFormData, buttonBgColor: e.target.value })}
                            placeholder="#ffffff"
                            className="bg-muted/20 border-white/5 rounded-2xl h-12 px-4 lowercase text-xs tracking-widest"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCtaFormData({
                        tagLabel: ctaData?.config?.tagLabel || "",
                        title: ctaData?.config?.title || "",
                        description: ctaData?.config?.description || "",
                        buttonText: ctaData?.config?.buttonText || "",
                        buttonBgColor: ctaData?.config?.buttonBgColor || "#ffffff",
                      })}
                      className="rounded-2xl lowercase"
                    >
                      cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateCtaMutation.isPending}
                      className="rounded-2xl lowercase"
                      data-testid="button-save-cta-config"
                    >
                      {updateCtaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      salvar configurações
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingBanner} onOpenChange={() => setDeletingBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="lowercase">deletar banner?</AlertDialogTitle>
            <AlertDialogDescription className="lowercase">
              tem certeza que deseja deletar "{deletingBanner?.title}"? esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="lowercase" data-testid="button-cancel-delete">cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBanner && deleteBannerMutation.mutate(deletingBanner.id)}
              className="lowercase"
              data-testid="button-confirm-delete"
            >
              deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
