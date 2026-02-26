import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, Link as LinkIcon, Package, Settings, Edit, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ImageCropper from "./ImageCropper";

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
  mobilePosition?: string;
  showText: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
  imageUrl: string | null;
}

interface BannerFormProps {
  banner: Banner | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BannerForm({ banner, onClose, onSuccess }: BannerFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingMobile, setIsDraggingMobile] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperTarget, setCropperTarget] = useState<"desktop" | "mobile">("desktop");
  const [linkType, setLinkType] = useState<"custom" | "product">(
    banner?.productId ? "product" : "custom"
  );
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: banner?.title || "",
    subtitle: banner?.subtitle || "",
    ctaText: banner?.ctaText || "",
    ctaLink: banner?.ctaLink || "",
    productId: banner?.productId || "",
    imageUrl: banner?.imageUrl || "",
    mobileImageUrl: banner?.mobileImageUrl || "",
    position: banner?.position || "left",
    mobilePosition: banner?.mobilePosition || "bottom-center",
    showText: banner?.showText !== false,
    isActive: banner?.isActive !== false,
    sortOrder: banner?.sortOrder || 0,
  });

  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/admin/products'],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = banner 
        ? `/api/admin/banners/${banner.id}`
        : "/api/admin/banners";
      
      // Prepare data based on link type
      const dataToSend = {
        ...data,
        ctaLink: linkType === "custom" 
          ? (data.ctaLink.startsWith('http') || data.ctaLink.startsWith('/') ? data.ctaLink : `https://${data.ctaLink}`) 
          : null,
        productId: linkType === "product" ? data.productId : null,
      };
      
      const response = await apiRequest(
        banner ? "PATCH" : "POST",
        url,
        dataToSend
      );
      
      if (!response.ok) throw new Error("Erro ao salvar banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      toast({
        title: banner ? "Banner atualizado" : "Banner criado",
        description: "As alterações foram salvas com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o banner.",
      });
    },
  });

  const openCropper = (file: File, target: "desktop" | "mobile") => {
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
      setCropperTarget(target);
      setCropperImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openCropper(file, "desktop");
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMobileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openCropper(file, "mobile");
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = '';
  };

  const uploadCroppedBanner = async (blob: Blob) => {
    const isMobile = cropperTarget === "mobile";
    if (isMobile) setUploadingMobile(true); else setUploading(true);
    setCropperImage(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', new File([blob], 'cropped.jpg', { type: 'image/jpeg' }));
      uploadFormData.append('type', isMobile ? 'banner-mobile' : 'banner');
      uploadFormData.append('variant', isMobile ? 'mobile' : 'desktop');

      const uploadHeaders: Record<string, string> = {};
      const sid = localStorage.getItem('admin_session');
      if (sid) {
        uploadHeaders['x-session-id'] = sid;
      }

      const response = await fetch('/api/admin/upload-banner', {
        method: 'POST',
        headers: uploadHeaders,
        credentials: 'include',
        body: uploadFormData,
      });

      if (!response.ok) throw new Error("Erro no upload");

      const data = await response.json();
      if (isMobile) {
        setFormData((prev) => ({ ...prev, mobileImageUrl: data.imageUrl }));
      } else {
        setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      }
      
      toast({
        title: "Upload concluído",
        description: `Imagem ${isMobile ? 'mobile' : 'desktop'} enviada com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
      });
    } finally {
      if (isMobile) setUploadingMobile(false); else setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) openCropper(file, "desktop");
  };

  const handleDropMobile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMobile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) openCropper(file, "mobile");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOverMobile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMobile(true);
  };

  const handleDragLeaveMobile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMobile(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-light lowercase">
            {banner ? "editar banner" : "novo banner"}
          </h1>
          <p className="text-sm text-muted-foreground lowercase">
            configure os detalhes do banner do carrossel
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-12">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageSelect}
          data-testid="input-file-upload"
        />

        {cropperImage && (
          <ImageCropper
            imageSrc={cropperImage}
            aspect={cropperTarget === "mobile" ? 9 / 16 : 21 / 9}
            onCropComplete={uploadCroppedBanner}
            onCancel={() => setCropperImage(null)}
          />
        )}
        {/* Upload de Imagem - Seção de Destaque */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">imagem desktop</h2>
          </div>
          <Card className="overflow-hidden border-white/5 bg-muted/20 backdrop-blur-sm transition-all hover:bg-muted/30">
            <CardContent className="p-0">
              {formData.imageUrl ? (
                <div className="relative group aspect-[21/9] md:aspect-[21/7]">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                  className={`aspect-[21/9] md:aspect-[21/7] flex flex-col items-center justify-center cursor-pointer group transition-all duration-300 ${isDragging ? 'bg-primary/10 ring-2 ring-primary/30 ring-inset' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  data-testid="dropzone-banner-image"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                      <p className="text-sm font-medium lowercase mb-1">enviando imagem...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-medium lowercase mb-1">{isDragging ? 'solte a imagem aqui' : 'clique ou arraste para upload'}</p>
                      <p className="text-xs text-muted-foreground lowercase">recomendado: 1920x800px (desktop)</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
            <div className="px-6 py-4 bg-muted/40 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="ou cole a URL da imagem aqui..."
                    disabled={uploading}
                    className="bg-transparent border-none px-0 h-8 focus-visible:ring-0 placeholder:text-muted-foreground/50 lowercase"
                    data-testid="input-image-url"
                  />
                </div>
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
          </Card>
        </section>

        <input
          type="file"
          ref={mobileFileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleMobileImageSelect}
          data-testid="input-file-upload-mobile"
        />
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">imagem mobile</h2>
            <span className="text-xs text-muted-foreground/60 lowercase ml-auto">opcional</span>
          </div>
          <Card className="overflow-hidden border-white/5 bg-muted/20 backdrop-blur-sm transition-all hover:bg-muted/30">
            <CardContent className="p-0">
              {formData.mobileImageUrl ? (
                <div className="relative group aspect-[9/16]">
                  <img
                    src={formData.mobileImageUrl}
                    alt="Preview mobile"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 lowercase"
                      onClick={() => setFormData({ ...formData, mobileImageUrl: "" })}
                    >
                      <X className="h-4 w-4 mr-2" />
                      remover imagem
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`aspect-[9/16] flex flex-col items-center justify-center cursor-pointer group transition-all duration-300 ${isDraggingMobile ? 'bg-primary/10 ring-2 ring-primary/30 ring-inset' : ''}`}
                  onClick={() => mobileFileInputRef.current?.click()}
                  onDrop={handleDropMobile}
                  onDragOver={handleDragOverMobile}
                  onDragLeave={handleDragLeaveMobile}
                  data-testid="dropzone-banner-image-mobile"
                >
                  {uploadingMobile ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                      <p className="text-sm font-medium lowercase mb-1">enviando imagem...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-medium lowercase mb-1">{isDraggingMobile ? 'solte a imagem aqui' : 'clique ou arraste para upload'}</p>
                      <p className="text-xs text-muted-foreground lowercase">recomendado: 1080x1920px (9:16 vertical)</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
            <div className="px-6 py-4 bg-muted/40 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    id="mobileImageUrl"
                    value={formData.mobileImageUrl}
                    onChange={(e) => setFormData({ ...formData, mobileImageUrl: e.target.value })}
                    placeholder="ou cole a URL da imagem mobile aqui..."
                    disabled={uploadingMobile}
                    className="bg-transparent border-none px-0 h-8 focus-visible:ring-0 placeholder:text-muted-foreground/50 lowercase"
                    data-testid="input-mobile-image-url"
                  />
                </div>
                {uploadingMobile && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Textos e Conteúdo */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Edit className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">conteúdo e textos</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">título principal</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: novos produtos"
                  required
                  className="bg-muted/20 border-white/5 rounded-xl h-12 px-4 focus:bg-muted/30 transition-all lowercase"
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">subtítulo</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="ex: conecte-se com sua comunidade"
                  required
                  rows={4}
                  className="bg-muted/20 border-white/5 rounded-xl px-4 py-3 focus:bg-muted/30 transition-all lowercase resize-none"
                  data-testid="input-subtitle"
                />
              </div>
            </div>
          </section>

          {/* Chamada para Ação e Links */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">chamada para ação</h2>
            </div>

            <Card className="border-white/5 bg-muted/20 rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ctaText" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">texto do botão</Label>
                  <Input
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="ex: ver produto"
                    className="bg-muted/40 border-none rounded-xl h-11 lowercase"
                    data-testid="input-cta-text"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">destino do clique</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLinkType("custom")}
                      className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all cursor-pointer ${
                        linkType === "custom"
                          ? "border-primary bg-primary/5"
                          : "border-white/5 bg-muted/40 hover:bg-muted/60"
                      }`}
                      data-testid="button-link-custom"
                    >
                      <LinkIcon className="mb-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-xs lowercase font-medium">link personalizado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkType("product")}
                      className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all cursor-pointer ${
                        linkType === "product"
                          ? "border-primary bg-primary/5"
                          : "border-white/5 bg-muted/40 hover:bg-muted/60"
                      }`}
                      data-testid="button-link-product"
                    >
                      <Package className="mb-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-xs lowercase font-medium">produto do site</span>
                    </button>
                  </div>
                </div>

                {linkType === "custom" && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="ctaLink" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">URL de destino</Label>
                    <Input
                      id="ctaLink"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      placeholder="ex: /colecao ou https://..."
                      required
                      className="bg-muted/40 border-none rounded-xl h-11 lowercase"
                      data-testid="input-cta-link"
                    />
                  </div>
                )}
                {linkType === "product" && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">produto vinculado</Label>
                    {(() => {
                      const sortedProducts = [...(productsData?.products || [])].sort((a, b) =>
                        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
                      );
                      const selected = sortedProducts.find((p) => p.id === formData.productId);
                      return (
                        <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              data-testid="select-product"
                              className="w-full h-auto min-h-12 py-2.5 px-3 rounded-xl bg-muted/40 border-none justify-between font-normal"
                            >
                              {selected ? (
                                <div className="flex items-center gap-3 min-w-0">
                                  {selected.imageUrl ? (
                                    <img src={selected.imageUrl} alt={selected.name} className="w-8 h-8 object-cover rounded-lg shrink-0" loading="lazy" decoding="async" />
                                  ) : (
                                    <div className="w-8 h-8 bg-muted/40 rounded-lg shrink-0" />
                                  )}
                                  <span className="text-sm lowercase truncate">{selected.name}</span>
                                  <span className={`h-2 w-2 rounded-full shrink-0 ${selected.status === "published" ? "bg-green-500" : "bg-red-500"}`} />
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm lowercase">escolha um produto</span>
                              )}
                              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40 ml-2" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-white/10 bg-popover" align="start">
                            <Command>
                              <CommandInput placeholder="pesquisar produto..." className="h-10 text-sm lowercase" data-testid="input-product-search" />
                              <CommandList className="max-h-[260px]">
                                <CommandEmpty className="py-4 text-center text-sm text-muted-foreground lowercase">nenhum produto encontrado</CommandEmpty>
                                <CommandGroup>
                                  {sortedProducts.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={product.name}
                                      onSelect={() => {
                                        setFormData({ ...formData, productId: product.id });
                                        setProductSearchOpen(false);
                                      }}
                                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
                                      data-testid={`option-product-${product.id}`}
                                    >
                                      {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-9 h-9 object-cover rounded-lg shrink-0" loading="lazy" decoding="async" />
                                      ) : (
                                        <div className="w-9 h-9 bg-muted/40 rounded-lg flex items-center justify-center text-[9px] text-muted-foreground shrink-0">
                                          foto
                                        </div>
                                      )}
                                      <div className="flex flex-col text-left min-w-0 flex-1">
                                        <span className="text-sm font-medium lowercase truncate">{product.name}</span>
                                        <span className="text-[10px] text-muted-foreground">R$ {product.price}</span>
                                      </div>
                                      <span
                                        className={`h-2 w-2 rounded-full shrink-0 ${product.status === "published" ? "bg-green-500" : "bg-red-500"}`}
                                        title={product.status === "published" ? "publicado" : "rascunho"}
                                      />
                                      {formData.productId === product.id && (
                                        <Check className="h-4 w-4 shrink-0 opacity-60" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Configurações Gerais - Layout Clean */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium lowercase text-muted-foreground tracking-tight">preferências de exibição</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">texto</Label>
                <p className="text-[11px] text-muted-foreground lowercase">exibir na imagem</p>
              </div>
              <Switch
                checked={formData.showText}
                onCheckedChange={(checked) => setFormData({ ...formData, showText: checked })}
                data-testid="switch-show-text"
              />
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">status</Label>
                <p className="text-[11px] text-muted-foreground lowercase">banner visível</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">alinhamento desktop</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData({ ...formData, position: value })}
              >
                <SelectTrigger data-testid="select-position" className="h-12 rounded-2xl bg-muted/20 border-white/5 px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-black/90 backdrop-blur-xl">
                  <SelectItem value="left" className="rounded-lg focus:bg-white/10 lowercase">esquerda</SelectItem>
                  <SelectItem value="center" className="rounded-lg focus:bg-white/10 lowercase">centro</SelectItem>
                  <SelectItem value="right" className="rounded-lg focus:bg-white/10 lowercase">direita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobilePosition" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">alinhamento mobile</Label>
              <Select
                value={formData.mobilePosition}
                onValueChange={(value) => setFormData({ ...formData, mobilePosition: value })}
              >
                <SelectTrigger data-testid="select-mobile-position" className="h-12 rounded-2xl bg-muted/20 border-white/5 px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-black/90 backdrop-blur-xl">
                  <SelectItem value="bottom-left" className="rounded-lg focus:bg-white/10 lowercase">inferior esquerda</SelectItem>
                  <SelectItem value="bottom-center" className="rounded-lg focus:bg-white/10 lowercase">inferior centro</SelectItem>
                  <SelectItem value="bottom-right" className="rounded-lg focus:bg-white/10 lowercase">inferior direita</SelectItem>
                  <SelectItem value="center-left" className="rounded-lg focus:bg-white/10 lowercase">centro esquerda</SelectItem>
                  <SelectItem value="center-center" className="rounded-lg focus:bg-white/10 lowercase">centro</SelectItem>
                  <SelectItem value="center-right" className="rounded-lg focus:bg-white/10 lowercase">centro direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Botões de Ação Final - Sticky Bottom Bar Style */}
        <div className="flex items-center justify-end gap-4 pt-8 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-12 px-8 rounded-full text-muted-foreground hover:bg-muted/30 transition-all lowercase"
            data-testid="button-cancel"
          >
            cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              saveMutation.isPending || 
              uploading || 
              uploadingMobile ||
              !formData.imageUrl ||
              (linkType === "custom" && !formData.ctaLink) ||
              (linkType === "product" && !formData.productId)
            }
            className="h-12 px-10 rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all lowercase shadow-lg shadow-primary/20"
            data-testid="button-save"
          >
            {saveMutation.isPending ? "salvando..." : banner ? "salvar alterações" : "concluir e criar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
