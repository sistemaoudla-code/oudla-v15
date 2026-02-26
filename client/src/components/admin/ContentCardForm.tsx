import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, Layout, Type, Link as LinkIcon, Package, Settings, Edit, Loader2, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ImageCropper from "./ImageCropper";
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

interface Product {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
  imageUrl: string | null;
}

interface ContentCardFormProps {
  card: ContentCard | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContentCardForm({ card, onClose, onSuccess }: ContentCardFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<"custom" | "product">(
    card?.productId ? "product" : "custom"
  );
  const [formData, setFormData] = useState({
    cardType: card?.cardType || "feature",
    title: card?.title || "",
    subtitle: card?.subtitle || "",
    ctaText: card?.ctaText || "",
    ctaLink: card?.ctaLink || "",
    productId: card?.productId || "",
    imageUrl: card?.imageUrl || "",
    position: card?.position || "center",
    height: card?.height || "medium",
    isActive: card?.isActive !== false,
    sortOrder: card?.sortOrder || 0,
  });

  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/admin/products'],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = card 
        ? `/api/admin/content-cards/${card.id}`
        : "/api/admin/content-cards";
      
      const dataToSend = {
        ...data,
        ctaLink: linkType === "custom" ? data.ctaLink : null,
        productId: linkType === "product" ? data.productId : null,
        title: data.title || null,
        subtitle: data.subtitle || null,
        ctaText: data.ctaText || null,
      };
      
      const response = await apiRequest(
        card ? "PATCH" : "POST",
        url,
        dataToSend
      );
      
      if (!response.ok) throw new Error("Erro ao salvar card");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content-cards'] });
      toast({
        title: card ? "Card atualizado" : "Card criado",
        description: "As alterações foram salvas com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o card.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!card?.id) return;
      const response = await apiRequest("DELETE", `/api/admin/content-cards/${card.id}`);
      if (!response.ok) throw new Error("Erro ao deletar");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content-cards'] });
      toast({
        title: "Card deletado",
        description: "O card foi removido com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível deletar o card.",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadCroppedImage = async (blob: Blob) => {
    setUploading(true);
    setCropperImage(null);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', new File([blob], 'cropped.jpg', { type: 'image/jpeg' }));
      uploadFormData.append('type', 'banner');

      const headers: Record<string, string> = {};
      const sessionId = localStorage.getItem('admin_session');
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch('/api/admin/upload-banner', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: uploadFormData,
      });

      if (!response.ok) throw new Error("Erro no upload");

      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      
      toast({
        title: "Upload concluído",
        description: "Imagem enviada com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full hover:bg-muted/50"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-light lowercase tracking-tight">
            {card ? "editar card" : "novo card de conteúdo"}
          </h1>
          <p className="text-sm text-muted-foreground lowercase opacity-70">
            personalize o destaque visual da sua página inicial
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
        data-testid="input-file-upload"
      />

      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          aspect={16 / 9}
          onCropComplete={uploadCroppedImage}
          onCancel={() => setCropperImage(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-10 pb-20">
        {/* Mídia e Visual - Apple Style */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Layout className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">imagem principal</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 overflow-hidden border-white/5 bg-muted/20 backdrop-blur-sm transition-all hover:bg-muted/30 rounded-[2rem]">
              <CardContent className="p-0">
                {formData.imageUrl ? (
                  <div className="relative group aspect-video">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 lowercase"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      >
                        <X className="h-4 w-4 mr-2" />
                        remover imagem
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="aspect-video flex flex-col items-center justify-center cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = () => setCropperImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm font-medium lowercase mb-1">clique para upload</p>
                    <p className="text-xs text-muted-foreground lowercase">imagem em alta resolução</p>
                  </div>
                )}
              </CardContent>
              <div className="px-6 py-4 bg-muted/40 border-t border-white/5">
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="cole a URL da imagem aqui..."
                  disabled={uploading}
                  className="bg-transparent border-none px-0 h-8 focus-visible:ring-0 placeholder:text-muted-foreground/50 lowercase"
                  data-testid="input-image-url"
                />
              </div>
            </Card>

            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">tipo de card</Label>
                  <Select
                    value={formData.cardType}
                    onValueChange={(value) => setFormData({ ...formData, cardType: value })}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-muted/40 border-none px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-black/90 backdrop-blur-xl">
                      <SelectItem value="feature" className="rounded-xl focus:bg-white/10 lowercase">Feature (Vertical)</SelectItem>
                      <SelectItem value="lifestyle" className="rounded-xl focus:bg-white/10 lowercase">Lifestyle (Horizontal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">altura da seção</Label>
                  <Select
                    value={formData.height}
                    onValueChange={(value) => setFormData({ ...formData, height: value })}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-muted/40 border-none px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-black/90 backdrop-blur-xl">
                      <SelectItem value="small" className="rounded-xl focus:bg-white/10 lowercase">Pequena (40vh)</SelectItem>
                      <SelectItem value="medium" className="rounded-xl focus:bg-white/10 lowercase">Média (50vh)</SelectItem>
                      <SelectItem value="large" className="rounded-xl focus:bg-white/10 lowercase">Grande (80vh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Conteúdo e Textos */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Type className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">textos e conteúdo</h2>
            </div>
            
            <div className="space-y-6 p-8 rounded-[2rem] bg-muted/10 border border-white/5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: vista sua fé"
                  className="bg-muted/20 border-white/5 rounded-2xl h-14 px-5 focus:bg-muted/30 transition-all text-lg lowercase"
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">subtítulo</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="ex: mais que roupas, um estilo de vida"
                  rows={4}
                  className="bg-muted/20 border-white/5 rounded-2xl px-5 py-4 focus:bg-muted/30 transition-all lowercase resize-none leading-relaxed"
                  data-testid="input-subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">alinhamento do texto</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-white/5 px-5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/10 bg-black/90 backdrop-blur-xl">
                    <SelectItem value="left" className="rounded-xl lowercase">esquerda</SelectItem>
                    <SelectItem value="center" className="rounded-xl lowercase">centro</SelectItem>
                    <SelectItem value="right" className="rounded-xl lowercase">direita</SelectItem>
                    <SelectItem value="bottom" className="rounded-xl lowercase">embaixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Ação e Produto */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">chamada para ação</h2>
            </div>

            <div className="space-y-6 p-8 rounded-[2rem] bg-muted/10 border border-white/5">
              <div className="space-y-2">
                <Label htmlFor="ctaText" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">texto do botão</Label>
                <Input
                  id="ctaText"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="ex: ver coleção"
                  className="bg-muted/20 border-white/5 rounded-2xl h-14 px-5 lowercase shadow-inner"
                  data-testid="input-cta-text"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">tipo de link</Label>
                <RadioGroup 
                  value={linkType} 
                  onValueChange={(value: "custom" | "product") => setLinkType(value)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="custom" id="link-custom" className="peer sr-only" />
                    <Label
                      htmlFor="link-custom"
                      className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-muted/20 p-4 hover:bg-muted/40 peer-data-[state=checked]:border-primary/50 peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer"
                    >
                      <LinkIcon className="mb-2 h-4 w-4 opacity-50" />
                      <span className="text-[11px] lowercase font-medium">personalizado</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="product" id="link-product" className="peer sr-only" />
                    <Label
                      htmlFor="link-product"
                      className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-muted/20 p-4 hover:bg-muted/40 peer-data-[state=checked]:border-primary/50 peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer"
                    >
                      <Package className="mb-2 h-4 w-4 opacity-50" />
                      <span className="text-[11px] lowercase font-medium">produto</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {linkType === "custom" ? (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="ctaLink" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">URL de destino</Label>
                  <Input
                    id="ctaLink"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="ex: /sobre ou https://..."
                    className="bg-muted/20 border-white/5 rounded-2xl h-12 px-5 lowercase"
                    data-testid="input-cta-link"
                  />
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="productId" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">vincular produto</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  >
                    <SelectTrigger className="h-auto min-h-14 py-3 rounded-2xl bg-muted/20 border-white/5 px-5">
                      <SelectValue placeholder="escolha um produto" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-black/95 backdrop-blur-2xl">
                      {productsData?.products?.map((product) => (
                        <SelectItem key={product.id} value={product.id} className="rounded-xl focus:bg-white/10 p-3">
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg" loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-10 h-10 bg-muted/40 rounded-lg flex items-center justify-center text-[10px]">sem foto</div>
                            )}
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-medium lowercase">{product.name}</span>
                              <span className="text-[10px] text-muted-foreground lowercase">R$ {product.price}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Preferências e Ordem */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">preferências do sistema</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-6 rounded-[2rem] bg-muted/10 border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">visibilidade</Label>
                <p className="text-xs text-muted-foreground lowercase">card ativo no site</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
            </div>

            <div className="p-6 rounded-[2rem] bg-muted/10 border border-white/5 space-y-2">
              <Label htmlFor="sortOrder" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">ordem</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="bg-transparent border-none h-8 px-1 focus-visible:ring-0 text-xl font-medium"
                data-testid="input-sort-order"
              />
              <p className="text-[10px] text-muted-foreground lowercase ml-1">maior aparece primeiro</p>
            </div>
          </div>
        </section>

        {/* Action Buttons - Integrated into Flow */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-white/5">
          {card && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all lowercase"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              deletar card
            </Button>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto h-12 px-8 rounded-2xl text-muted-foreground hover:bg-white/5 transition-all lowercase"
          >
            cancelar
          </Button>
          <Button
            type="submit"
            disabled={saveMutation.isPending || uploading || !formData.imageUrl}
            className="w-full sm:w-auto h-12 px-10 rounded-2xl bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 lowercase font-semibold"
          >
            {saveMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "salvar alterações"}
          </Button>
        </div>
      </form>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="lowercase">deletar card?</AlertDialogTitle>
            <AlertDialogDescription className="lowercase">
              essa ação não pode ser desfeita. o card será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="lowercase">cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground lowercase"
              onClick={() => {
                deleteMutation.mutate();
                setShowDeleteDialog(false);
              }}
            >
              deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
