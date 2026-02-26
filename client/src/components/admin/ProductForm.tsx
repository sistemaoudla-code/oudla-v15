import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Color } from "@shared/schema";
import SizeChartEditor from "./SizeChartEditor";
import AdminProductReviews from "./AdminProductReviews";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  ArrowLeft, 
  Upload, 
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Palette,
  GripVertical,
  Package
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProductFormProps {
  product?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const productSchema = z.object({
  sku: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.string().min(1, "Preço é obrigatório"),
  originalPrice: z.string().optional(),
  productType: z.enum(["tshirt", "accessory"]),
  category: z.string().optional(),
  isNew: z.boolean().default(false),
  displayOrder: z.number().default(0),
  customizable: z.boolean().default(false),
  customizableFront: z.boolean().default(false),
  customizableBack: z.boolean().default(false),
  fabricTech: z.string().optional(),
  fabricDescription: z.string().optional(),
  careInstructions: z.string().optional(),
  sizeChartImage: z.string().optional().nullable(),
  sizesEnabled: z.boolean().default(false),
  sizeChartEnabled: z.boolean().default(false),
  fabricsEnabled: z.boolean().default(false),
  reviewsEnabled: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  previewToken: z.string().optional().nullable(),
  rating: z.union([z.string(), z.number()]).optional(),
  reviewsCount: z.union([z.string(), z.number()]).optional(),
  userCity: z.string().optional(),
  showInstallments: z.boolean().default(false),
  installmentsMax: z.union([z.string(), z.number()]).default(12),
  installmentsValue: z.union([z.string(), z.number()]).optional().nullable(),
  installmentsInterestFree: z.boolean().default(true),
  sectionLabel: z.string().optional().nullable(),
  sectionTitle: z.string().optional().nullable(),
  sectionSubtitle: z.string().optional().nullable(),
  shippingWeight: z.union([z.string(), z.number()]).optional().nullable(),
  shippingHeight: z.union([z.string(), z.number()]).optional().nullable(),
  shippingWidth: z.union([z.string(), z.number()]).optional().nullable(),
  shippingLength: z.union([z.string(), z.number()]).optional().nullable(),
}).refine((data) => {
  if (data.customizable) {
    return data.customizableFront || data.customizableBack;
  }
  return true;
}, {
  message: "selecione pelo menos uma posição para a estampa (frente ou costas)",
  path: ["customizable"],
});

type ProductFormData = z.infer<typeof productSchema>;

const AVAILABLE_SIZES = ["Infantil", "PP", "P", "M", "G", "GG", "XG", "2XG", "3XG"];

export default function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<any[]>(product?.images || []);
  const [colors, setColors] = useState<Color[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [installmentOptions, setInstallmentOptions] = useState<any[]>([]);

  // Load installment options if editing
  useEffect(() => {
    if (product?.id) {
      fetch(`/api/products/${product.id}/installments`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setInstallmentOptions(data);
          }
        })
        .catch(err => console.error("Error loading installments:", err));
    }
  }, [product?.id]);

  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#");
  const [newFabricName, setNewFabricName] = useState("");
  const [newFabricPrice, setNewFabricPrice] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(product?.sizes || []);
  const [sizeChartImage, setSizeChartImage] = useState<string | null>(product?.sizeChartImage || null);
  const [activeImageTab, setActiveImageTab] = useState<string>("presentation");
  const [uploadColorSelection, setUploadColorSelection] = useState<string>("presentation");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: false,
    images: false,
    colors: false,
    sizes: false,
    options: false,
    customizable: false,
    fabric: false,
    sizeChart: false,
    reviews: false,
    installments: false,
    sectionTexts: false,
    shipping: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizeChartInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: product?.sku || "",
      slug: product?.slug || "",
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "",
      originalPrice: product?.originalPrice || "",
      productType: product?.productType || "tshirt",
      category: product?.category || "",
      isNew: product?.isNew || false,
      displayOrder: product?.displayOrder || 0,
      customizable: product?.customizable || false,
      customizableFront: product?.customizableFront || false,
      customizableBack: product?.customizableBack || false,
      fabricTech: product?.fabricTech?.join(", ") || "",
      fabricDescription: product?.fabricDescription || "",
      careInstructions: product?.careInstructions || "",
      sizeChartImage: product?.sizeChartImage || null,
      sizesEnabled: product?.sizesEnabled || false,
      sizeChartEnabled: product?.sizeChartEnabled || false,
      fabricsEnabled: product?.fabricsEnabled || false,
      reviewsEnabled: product?.reviewsEnabled || false,
      status: product?.status || "draft",
      previewToken: product?.previewToken || null,
      rating: product?.rating || "4.5",
      reviewsCount: product?.reviewsCount?.toString() || "0",
      installmentsMax: product?.installmentsMax || 12,
      installmentsValue: product?.installmentsValue || null,
      installmentsInterestFree: product?.installmentsInterestFree !== false,
      sectionLabel: product?.sectionLabel || "",
      sectionTitle: product?.sectionTitle || "",
      sectionSubtitle: product?.sectionSubtitle || "",
      shippingWeight: product?.shippingWeight || null,
      shippingHeight: product?.shippingHeight || null,
      shippingWidth: product?.shippingWidth || null,
      shippingLength: product?.shippingLength || null,
    },
  });

  useEffect(() => {
    const productId = product?.id || null;
    console.log("🟣 [INIT_EFFECT] useEffect rodou! product?:", !!product, "initializedRef:", initializedRef.current, "productId:", productId);
    if (product && initializedRef.current !== productId) {
      initializedRef.current = productId;
      console.log("🟣 [INIT_EFFECT] Inicializando dados do produto. Colors raw:", typeof product.colors, product.colors);
      let parsedColors: Color[] = [];
      
      if (product.colors) {
        if (typeof product.colors === 'string') {
          try {
            const parsed = JSON.parse(product.colors);
            if (Array.isArray(parsed) && parsed[0]?.name && parsed[0]?.hex) {
              parsedColors = parsed;
            } else if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
              parsedColors = parsed.map((hex: string) => ({ name: hex, hex }));
            }
          } catch {
            parsedColors = [];
          }
        } else if (Array.isArray(product.colors)) {
          if (product.colors[0]?.name && product.colors[0]?.hex) {
            parsedColors = product.colors;
          } else if (typeof product.colors[0] === 'string') {
            parsedColors = product.colors.map((hex: string) => ({ name: hex, hex }));
          }
        }
      }
      
      setColors(parsedColors);

      let parsedFabrics: any[] = [];
      if (product.fabrics) {
        if (typeof product.fabrics === 'string') {
          try {
            parsedFabrics = JSON.parse(product.fabrics);
          } catch {
            parsedFabrics = [];
          }
        } else if (Array.isArray(product.fabrics)) {
          parsedFabrics = product.fabrics;
        }
      }
      setFabrics(parsedFabrics);

      setImages(product.images || []);
      setSizeChartImage(product.sizeChartImage || null);
      setSelectedSizes(product.sizes || []);
      form.reset({
        sku: product.sku || "",
        slug: product.slug || "",
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        originalPrice: product.originalPrice || "",
        productType: product.productType || "tshirt",
        category: product.category || "",
        isNew: product.isNew || false,
        displayOrder: product.displayOrder || 0,
        customizable: product.customizable || false,
        customizableFront: product.customizableFront || false,
        customizableBack: product.customizableBack || false,
        fabricTech: product.fabricTech?.join(", ") || "",
        fabricDescription: product.fabricDescription || "",
        careInstructions: product.careInstructions || "",
        sizeChartImage: product.sizeChartImage || null,
        sizesEnabled: product.sizesEnabled || false,
        sizeChartEnabled: product.sizeChartEnabled || false,
        fabricsEnabled: product.fabricsEnabled || false,
        showInstallments: product.showInstallments === true,
        reviewsEnabled: product.reviewsEnabled || false,
        status: product.status || "draft",
        previewToken: product.previewToken || null,
        rating: product.rating || "4.5",
        reviewsCount: product.reviewsCount?.toString() || "0",
        installmentsMax: product.installmentsMax || 12,
        installmentsValue: product.installmentsValue || null,
        installmentsInterestFree: product.installmentsInterestFree !== false,
        shippingWeight: product.shippingWeight || null,
        shippingHeight: product.shippingHeight || null,
        shippingWidth: product.shippingWidth || null,
        shippingLength: product.shippingLength || null,
      });
    }
  }, [product]);

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🟡 [MUTATION] mutationFn chamada!");
      console.log("🟡 [MUTATION] data.colors:", JSON.stringify(data.colors));
      const endpoint = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const method = product ? "PATCH" : "POST";
      console.log("🟡 [MUTATION] Enviando para:", method, endpoint);
      const response = await apiRequest(method, endpoint, data);
      console.log("🟡 [MUTATION] Response status:", response.status);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar produto");
      }
      
      const result = await response.json();
      
      // Salvar opções de parcelamento
      const productId = product?.id || result.id || (result.product && result.product.id);
      const showInstallments = data.showInstallments;
      
      if (productId && productId !== 'undefined' && showInstallments) {
        await apiRequest("POST", `/api/admin/products/${productId}/installments`, installmentOptions);
      } else if (productId && productId !== 'undefined' && !showInstallments) {
        console.log("Parcelamento desativado, pulando salvamento de opções customizadas");
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      if (product?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products', product.id] });
      }
      toast({
        title: product ? "produto atualizado" : "produto criado",
        description: "as alterações foram salvas com sucesso.",
      });
      if (!product) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "erro",
        description: error.message || "não foi possível salvar o produto.",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!product?.id) {
        throw new Error("salve o produto primeiro antes de adicionar imagens");
      }
      const formData = new FormData();
      formData.append('image', file);
      
      const sessionId = localStorage.getItem('admin_session');
      const headers: Record<string, string> = {};
      
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await fetch(`/api/admin/products/${product.id}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "erro ao fazer upload");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      const imageType = uploadColorSelection === "presentation" ? "presentation" : "carousel";
      const color = uploadColorSelection === "presentation" ? null : uploadColorSelection;
      
      try {
        const result = await updateImageMetadataMutation.mutateAsync({
          imageId: data.image.id,
          imageType,
          color: color || null,
        });
        
        setImages([...images, result.image]);
        toast({
          title: "imagem adicionada",
          description: "a imagem foi carregada com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao atualizar metadata:", error);
        toast({
          variant: "destructive",
          title: "erro",
          description: "erro ao associar imagem à cor.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "erro",
        description: error.message || "não foi possível fazer upload da imagem.",
      });
    },
  });

  const updateImageMetadataMutation = useMutation({
    mutationFn: async ({ imageId, imageType, color }: { imageId: string; imageType: string; color: string | null }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/images/${imageId}`, {
        imageType,
        color: color || null,
      });
      if (!response.ok) throw new Error("erro ao atualizar imagem");
      return response.json();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "erro",
        description: error.message || "não foi possível atualizar a imagem.",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/images/${imageId}`);
      if (!response.ok) throw new Error("erro ao deletar imagem");
      return response.json();
    },
    onSuccess: (_, imageId) => {
      setImages(images.filter(img => img.id !== imageId));
      toast({
        title: "imagem removida",
        description: "a imagem foi deletada com sucesso.",
      });
    },
  });

  const updateImageOrderMutation = useMutation({
    mutationFn: async ({ imageId, newOrder }: { imageId: string; newOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/images/${imageId}`, {
        sortOrder: newOrder,
      });
      if (!response.ok) throw new Error("erro ao reordenar");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "ordem alterada",
        description: "a ordem das imagens foi atualizada.",
      });
    },
  });

  const uploadSizeChartMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!product?.id) {
        throw new Error("salve o produto primeiro");
      }
      const formData = new FormData();
      formData.append('image', file);
      
      const sessionId = localStorage.getItem('admin_session');
      const headers: Record<string, string> = {};
      
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await fetch(`/api/admin/products/${product.id}/upload-size-chart`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "erro ao fazer upload");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSizeChartImage(data.sizeChartImage);
      form.setValue('sizeChartImage', data.sizeChartImage);
      toast({
        title: "tabela de medidas adicionada",
        description: "a imagem foi carregada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "erro",
        description: error.message || "não foi possível fazer upload.",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    console.log("🟢 [SUBMIT] onSubmit chamado!");
    console.log("🟢 [SUBMIT] colors state atual:", JSON.stringify(colors));
    console.log("🟢 [SUBMIT] colors.length:", colors.length);
    console.log("🟢 [SUBMIT] showInstallments:", data.showInstallments);
    console.log("🟢 [SUBMIT] installmentOptions.length:", installmentOptions.length);
    if (data.customizable && !data.customizableFront && !data.customizableBack) {
      toast({
        variant: "destructive",
        title: "erro de validação",
        description: "quando a posição das estampas está ativa, selecione pelo menos frente ou costas.",
      });
      return;
    }

    // Validate custom installments only if installments are enabled
    const showInstallments = data.showInstallments;
    if (showInstallments) {
      if (installmentOptions.length === 0) {
        toast({
          variant: "destructive",
          title: "erro de validação",
          description: "quando o parcelamento está ativo, cadastre pelo menos uma parcela.",
        });
        return;
      }
      const emptyInstallments = installmentOptions.filter(opt => opt.customValue === null || opt.customValue === "");
      if (emptyInstallments.length > 0) {
        toast({
          variant: "destructive",
          title: "erro de validação",
          description: "por favor, preencha o valor de todas as parcelas personalizadas ou remova as que não serão usadas.",
        });
        return;
      }
    }

    const submitData = {
      ...data,
      colors: colors,
      fabrics: fabrics,
      sizes: selectedSizes,
      fabricTech: data.fabricTech ? data.fabricTech.split(',').map(t => t.trim()) : [],
      rating: data.rating ? Number(data.rating) : 4.5,
      reviewsCount: data.reviewsCount ? Number(data.reviewsCount) : 0,
      installmentsMax: data.installmentsMax ? Number(data.installmentsMax) : 12,
      installmentsValue: data.installmentsValue ? Number(data.installmentsValue) : null,
      shippingWeight: data.shippingWeight ? Number(data.shippingWeight) : null,
      shippingHeight: data.shippingHeight ? Number(data.shippingHeight) : null,
      shippingWidth: data.shippingWidth ? Number(data.shippingWidth) : null,
      shippingLength: data.shippingLength ? Number(data.shippingLength) : null,
    };

    console.log("🟢 [SUBMIT] submitData.colors:", JSON.stringify(submitData.colors));
    console.log("🟢 [SUBMIT] submitData completo keys:", Object.keys(submitData));
    console.log("🟢 [SUBMIT] chamando createProductMutation.mutate...");

    const onError = (errors: any) => {
      console.log("🔴 [SUBMIT] Form Errors:", errors);
      const errorMessages = Object.entries(errors)
        .map(([key, value]: [string, any]) => {
          if (value.message) return value.message;
          if (value.root?.message) return value.root.message;
          return null;
        })
        .filter(Boolean);

      if (errorMessages.length > 0) {
        toast({
          variant: "destructive",
          title: "erro de validação",
          description: errorMessages[0] as string,
        });
      } else {
        toast({
          variant: "destructive",
          title: "erro",
          description: "por favor, verifique os campos obrigatórios.",
        });
      }
    };

    createProductMutation.mutate(submitData);
  };

  const handleAddColor = () => {
    console.log("🔵 [ADD_COLOR] Tentando adicionar cor:", { name: newColorName, hex: newColorHex });
    console.log("🔵 [ADD_COLOR] Colors antes:", JSON.stringify(colors));
    const hex = newColorHex.trim().toUpperCase();
    if (!newColorName.trim() || hex.length !== 7) {
      toast({
        variant: "destructive",
        title: "erro",
        description: "preencha o nome e um código hex válido (#RRGGBB)",
      });
      return;
    }
    const newColor = { name: newColorName.trim(), hex };
    const newColors = [...colors, newColor];
    console.log("🔵 [ADD_COLOR] Colors depois:", JSON.stringify(newColors));
    setColors(newColors);
    setNewColorName("");
    setNewColorHex("#");
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleMoveColor = (index: number, direction: 'up' | 'down') => {
    const newColors = [...colors];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newColors.length) return;
    [newColors[index], newColors[targetIndex]] = [newColors[targetIndex], newColors[index]];
    setColors(newColors);
  };

  const handleAddFabric = () => {
    if (!newFabricName.trim()) {
      toast({
        variant: "destructive",
        title: "erro",
        description: "preencha o nome do tecido",
      });
      return;
    }
    const newFabric = { 
      name: newFabricName, 
      description: "", 
      price: newFabricPrice ? parseFloat(newFabricPrice) : 0 
    };
    setFabrics([...fabrics, newFabric]);
    setNewFabricName("");
    setNewFabricPrice("");
  };

  const handleRemoveFabric = (index: number) => {
    setFabrics(fabrics.filter((_, i) => i !== index));
  };

  const handleToggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const productType = form.watch("productType");
  const currentPrice = form.watch("price");
  const originalPrice = form.watch("originalPrice");

  const discountPercentage = useMemo(() => {
    const price = parseFloat(currentPrice || "0");
    const original = parseFloat(originalPrice || "0");
    if (price > 0 && original > 0 && original > price) {
      return Math.round(((original - price) / original) * 100);
    }
    return null;
  }, [currentPrice, originalPrice]);

  return (
    <div className="w-full">
      {/* Header Sticky */}
      <Form {...form}>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b py-3 mb-5 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-back"
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-light lowercase truncate flex-1">
              {product ? "editar" : "novo"} produto
            </h1>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex items-center space-y-0">
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-9 w-[105px] rounded-lg text-xs border-0 bg-muted/50 lowercase">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft" className="text-xs lowercase">rascunho</SelectItem>
                        <SelectItem value="published" className="text-xs lowercase">publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            {product && (
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0 rounded-lg"
                asChild
              >
                <a 
                  href={`/${product.slug || product.sku || product.id}${product.previewToken ? `?preview=${product.previewToken}` : ''}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-testid="button-view-product"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button
              onClick={() => {
                form.handleSubmit(onSubmit, (errors) => {
                  const firstError = Object.values(errors)[0];
                  if (firstError?.message) {
                    toast({
                      variant: "destructive",
                      title: "erro de validação",
                      description: firstError.message as string,
                    });
                  }
                })();
              }}
              disabled={createProductMutation.isPending}
              className="lowercase flex-shrink-0 rounded-lg px-4"
              size="sm"
              data-testid="button-save-product-header"
            >
              {createProductMutation.isPending ? "salvando..." : product ? "salvar" : "criar"}
            </Button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log("Validation Errors:", errors);
          const firstError = Object.values(errors)[0];
          if (firstError?.message) {
            toast({
              variant: "destructive",
              title: "erro de validação",
              description: firstError.message as string,
            });
          }
        })} className="px-4 sm:px-6 space-y-3">
          
          {/* Basic Info */}
          <Collapsible open={openSections.basic} onOpenChange={() => toggleSection('basic')}>
            <CollapsibleTrigger className="w-full">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm lowercase">informações básicas</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.basic ? 'rotate-180' : ''}`} />
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-5 pb-3 space-y-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">URL personalizada (slug)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="ex: camiseta-teste" 
                        data-testid="input-product-slug" 
                        className="lowercase border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground/70 lowercase">
                      o link do produto será: {window.location.host}/{field.value || 'seu-slug'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">SKU (código de referência)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="ex: CAM-PR-P" 
                        data-testid="input-product-sku" 
                        className="uppercase border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">nome</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="ex: camiseta oudla" 
                        data-testid="input-product-name" 
                        className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        placeholder="descreva..." 
                        rows={2} 
                        data-testid="input-product-description" 
                        className="border-0 bg-muted/50 rounded-xl px-4 py-3 text-sm focus-visible:ring-1 min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-type" className="h-11 rounded-xl text-sm border-0 bg-muted/50 px-4">
                          <SelectValue placeholder="selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tshirt">camiseta</SelectItem>
                        <SelectItem value="accessory">acessório</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {productType === "accessory" && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium lowercase">categoria</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="ex: bonés" 
                        data-testid="input-product-category" 
                        className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                      />
                    </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium lowercase">preço (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          data-testid="input-product-price" 
                          className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium lowercase">preço original</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          data-testid="input-product-original-price" 
                          className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                        />
                      </FormControl>
                      {discountPercentage && (
                        <FormDescription className="text-xs lowercase text-primary font-medium">
                          desconto de {discountPercentage}%
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Options */}
          <Collapsible open={openSections.options} onOpenChange={() => toggleSection('options')}>
            <CollapsibleTrigger className="w-full">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm lowercase">configurações</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.options ? 'rotate-180' : ''}`} />
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-5 pb-3 space-y-4">
              <FormField
                control={form.control}
                name="showInstallments"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between px-4 py-4 rounded-xl hover-elevate">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm lowercase font-medium">mostrar parcelamento</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-installments" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customizable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between px-4 py-4 rounded-xl hover-elevate">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm lowercase font-medium">posição das estampas</FormLabel>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) {
                            form.setValue("customizableFront", false);
                            form.setValue("customizableBack", false);
                          }
                        }} 
                        data-testid="switch-customizable" 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sizesEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between px-4 py-4 rounded-xl hover-elevate">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm lowercase font-medium">habilitar tamanhos</FormLabel>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        data-testid="switch-sizes-enabled" 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sizeChartEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between px-4 py-4 rounded-xl hover-elevate">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm lowercase font-medium">tabela de medidas</FormLabel>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        data-testid="switch-size-chart-enabled" 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fabricsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between px-4 py-4 rounded-xl hover-elevate">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm lowercase font-medium">escolha de tecidos</FormLabel>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        data-testid="switch-fabrics-enabled" 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reviewsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between px-4 py-4 rounded-xl hover-elevate">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm lowercase font-medium">habilitar avaliações</FormLabel>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        data-testid="switch-reviews-enabled" 
                        className="data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Installments - Aparece apenas quando ativado */}
          {form.watch("showInstallments") && (
            <Collapsible open={openSections.installments} onOpenChange={() => toggleSection('installments')}>
              <CollapsibleTrigger className="w-full">
                <Card className="cursor-pointer hover:bg-accent/50">
                  <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm lowercase">parcelamento</CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.installments ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-5 pb-3 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="installmentsMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium lowercase">máx. parcelas</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min={1} 
                          max={24}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 12)}
                          data-testid="input-product-installments-max" 
                          className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installmentsValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium lowercase">valor da parcela (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01"
                          placeholder="valor fixo"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-product-installments-value" 
                          className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="installmentsInterestFree"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end py-3">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-product-installments-interest-free"
                        />
                      </FormControl>
                      <FormLabel className="text-sm lowercase font-medium cursor-pointer">sem juros</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Installments Editor */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium lowercase">parcelamento personalizado</h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="rounded-xl h-9 lowercase"
                    onClick={() => {
                      // Find the highest installment number and add 1
                      const maxInstallments = installmentOptions.length > 0 
                        ? Math.max(...installmentOptions.map(o => o.installments)) 
                        : 0;
                      const nextNum = maxInstallments + 1;
                      
                      setInstallmentOptions([...installmentOptions, { 
                        installments: nextNum, 
                        isInterestFree: true,
                        customValue: null 
                      }]);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> adicionar parcela
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {installmentOptions.sort((a,b) => a.installments - b.installments).map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover-elevate group">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-8 font-medium">{opt.installments}x</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="valor" 
                          value={opt.customValue || ""} 
                          onChange={(e) => {
                            const newOpts = [...installmentOptions];
                            newOpts[idx].customValue = e.target.value ? parseFloat(e.target.value) : null;
                            setInstallmentOptions(newOpts);
                          }}
                          className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1 w-24"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={opt.isInterestFree}
                          onCheckedChange={(checked) => {
                            const newOpts = [...installmentOptions];
                            newOpts[idx].isInterestFree = !!checked;
                            setInstallmentOptions(newOpts);
                          }}
                        />
                        <span className="text-xs lowercase text-muted-foreground whitespace-nowrap">sem acréscimo</span>
                      </div>
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => {
                          const filtered = installmentOptions.filter((_, i) => i !== idx);
                          // Reorder installments to be sequential 1, 2, 3...
                          const reordered = filtered
                            .sort((a, b) => a.installments - b.installments)
                            .map((opt, i) => ({
                              ...opt,
                              installments: i + 1
                            }));
                          setInstallmentOptions(reordered);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {installmentOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 italic">nenhuma parcela personalizada configurada</p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
            </Collapsible>
          )}

          {/* Sizes */}
          {form.watch("sizesEnabled") && (
            <Collapsible open={openSections.sizes} onOpenChange={() => toggleSection('sizes')}>
              <CollapsibleTrigger className="w-full">
                <Card className="cursor-pointer hover:bg-accent/50">
                  <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm lowercase">tamanhos ({selectedSizes.length})</CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.sizes ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-5 pb-3 space-y-4">
                <div className="grid grid-cols-3 gap-2.5">
                  {AVAILABLE_SIZES.map((size) => (
                    <Button
                      key={size}
                      type="button"
                      onClick={() => handleToggleSize(size)}
                      variant={selectedSizes.includes(size) ? "default" : "outline"}
                      className="lowercase h-11 rounded-xl text-sm"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Size Chart - Aparece apenas quando ativado */}
          {form.watch("sizeChartEnabled") && product?.id && (
            <Collapsible open={openSections.sizeChart} onOpenChange={() => toggleSection('sizeChart')}>
              <CollapsibleTrigger className="w-full">
                <Card className="cursor-pointer hover:bg-accent/50">
                  <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm lowercase">tabela de medidas</CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.sizeChart ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-5 pb-3 space-y-6">
                <SizeChartEditor productId={product.id} selectedSizes={selectedSizes} />

                <div className="border-t border-border/30 pt-5 space-y-4">
                  <p className="text-xs text-muted-foreground/60 lowercase">imagem da tabela (opcional)</p>
                  <input
                    ref={sizeChartInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        uploadSizeChartMutation.mutate(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    data-testid="input-size-chart"
                  />
                  {sizeChartImage ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl overflow-hidden bg-muted/30">
                        <img src={sizeChartImage} alt="tabela de medidas" className="w-full" loading="lazy" decoding="async" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => sizeChartInputRef.current?.click()}
                          className="flex-1 lowercase rounded-xl h-11 gap-2"
                          variant="outline"
                          disabled={uploadSizeChartMutation.isPending}
                        >
                          <Upload className="h-4 w-4" />
                          {uploadSizeChartMutation.isPending ? "enviando..." : "trocar imagem"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setSizeChartImage(null);
                            form.setValue('sizeChartImage', null);
                          }}
                          className="rounded-xl h-11 lowercase"
                          variant="ghost"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={() => sizeChartInputRef.current?.click()} 
                      className="w-full gap-2 lowercase rounded-xl h-11"
                      variant="outline"
                      disabled={uploadSizeChartMutation.isPending}
                    >
                      <Upload className="h-4 w-4" />
                      {uploadSizeChartMutation.isPending ? "enviando..." : "enviar imagem da tabela"}
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Colors */}
          <Collapsible open={openSections.colors} onOpenChange={() => toggleSection('colors')}>
            <CollapsibleTrigger className="w-full">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardHeader className="p-4 flex flex-row items-center justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-sm lowercase">cores</CardTitle>
                    {colors.length > 0 && (
                      <div className="flex items-center -space-x-1.5">
                        {colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full ring-2 ring-background"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${openSections.colors ? 'rotate-180' : ''}`} />
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 pb-2">
              {colors.length > 0 && (
                <div className="space-y-1 mb-5">
                  {colors.map((color, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl group hover-elevate transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-full ring-1 ring-border/30 flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="text-sm lowercase font-medium leading-tight">{color.name}</span>
                        <span className="text-[11px] text-muted-foreground uppercase font-mono tracking-wider">{color.hex}</span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveColor(i, 'up')}
                          disabled={i === 0}
                          className="invisible group-hover:visible"
                          data-testid={`button-move-color-up-${i}`}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveColor(i, 'down')}
                          disabled={i === colors.length - 1}
                          className="invisible group-hover:visible"
                          data-testid={`button-move-color-down-${i}`}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(i)}
                          className="invisible group-hover:visible text-muted-foreground/40 hover:text-destructive transition-all p-1.5 rounded-full"
                          data-testid={`button-remove-color-${i}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {colors.length === 0 && (
                <p className="text-center text-sm text-muted-foreground/60 lowercase py-8">nenhuma cor adicionada</p>
              )}

              <div className="border-t border-border/40 pt-5 px-2">
                <input
                  ref={colorPickerRef}
                  type="color"
                  value={newColorHex.length === 7 ? newColorHex : '#000000'}
                  onChange={(e) => setNewColorHex(e.target.value.toUpperCase())}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => colorPickerRef.current?.click()}
                    className="w-12 h-12 rounded-full ring-1 ring-border/30 flex-shrink-0 shadow-sm transition-all duration-200 relative group/picker cursor-pointer"
                    style={{ backgroundColor: newColorHex.length === 7 ? newColorHex : 'hsl(var(--muted))' }}
                    data-testid="button-color-picker"
                  >
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover/picker:bg-black/20 transition-colors">
                      <Palette className="h-4 w-4 text-white opacity-0 group-hover/picker:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </button>
                  <div className="flex-1 flex flex-col gap-2">
                    <Input
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="nome da cor"
                      className="text-sm h-11 border-0 bg-muted/50 rounded-xl px-4 focus-visible:ring-1 lowercase"
                      data-testid="input-color-name"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newColorHex}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^#0-9a-fA-F]/g, '');
                          val = val.replace(/#/g, '');
                          val = '#' + val.slice(0, 6);
                          setNewColorHex(val);
                        }}
                        placeholder="#FFFFFF"
                        maxLength={7}
                        className="text-sm h-11 w-32 border-0 bg-muted/50 rounded-xl px-4 uppercase font-mono tracking-wider focus-visible:ring-1"
                        data-testid="input-color-hex"
                      />
                      <Button
                        type="button"
                        onClick={handleAddColor}
                        className="lowercase rounded-xl h-11 px-5 flex-1"
                        data-testid="button-add-color"
                      >
                        adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Images */}
          <Collapsible open={openSections.images} onOpenChange={() => toggleSection('images')}>
            <CollapsibleTrigger className="w-full">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardHeader className="p-4 flex flex-row items-center justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-sm lowercase">imagens</CardTitle>
                    {images.length > 0 && (
                      <span className="text-xs text-muted-foreground">{images.length}</span>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${openSections.images ? 'rotate-180' : ''}`} />
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 pb-2 overflow-x-hidden">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    uploadImageMutation.mutate(e.target.files[0]);
                  }
                }}
                className="hidden"
                data-testid="input-product-image"
              />

              <div className="px-2 mb-5">
                <div className="flex items-center gap-3">
                  <Select value={uploadColorSelection} onValueChange={setUploadColorSelection}>
                    <SelectTrigger className="text-sm h-11 border-0 bg-muted/50 rounded-xl flex-1 px-4 focus:ring-1">
                      <SelectValue placeholder="categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presentation">
                        <span className="lowercase">principal</span>
                      </SelectItem>
                      {colors.map((color) => (
                        <SelectItem key={color.name} value={color.name}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full ring-1 ring-border/30" style={{ backgroundColor: color.hex }} />
                            <span className="lowercase">{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="gap-2.5 lowercase rounded-xl h-11 px-5 flex-shrink-0" 
                    disabled={uploadImageMutation.isPending}
                    data-testid="button-upload-image"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadImageMutation.isPending ? "enviando..." : "enviar"}
                  </Button>
                </div>
              </div>

              {images.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground/60 lowercase py-8">nenhuma imagem adicionada</p>
              ) : (
                <div className="space-y-3">
                  {/* Principal Images */}
                  {(() => {
                    const presentationImages = images.filter(img => img.imageType === "presentation").sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                    return (
                      <Collapsible defaultOpen={true}>
                        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover-elevate">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm lowercase font-medium">principal</span>
                            <span className="text-xs text-muted-foreground">{presentationImages.length}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground/60 transition-transform" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-2 pb-2 pt-1">
                          {presentationImages.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground/50 lowercase py-4">sem imagens</p>
                          ) : (
                            <div className="space-y-1">
                              {presentationImages.map((img, idx, arr) => (
                                <div key={img.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group hover-elevate">
                                  <img src={img.imageUrl} alt="" className="h-14 w-14 object-cover rounded-lg flex-shrink-0 cursor-pointer" loading="lazy" decoding="async" onClick={() => setPreviewImage(img.imageUrl)} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm lowercase text-muted-foreground">imagem {idx + 1}</p>
                                  </div>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <Button type="button" size="icon" variant="ghost" onClick={() => {
                                      if (idx > 0) {
                                        const prevImg = arr[idx - 1];
                                        const newSortOrder = (prevImg.sortOrder || 0) - 1;
                                        updateImageOrderMutation.mutate({ imageId: img.id, newOrder: newSortOrder });
                                        setImages(prev => prev.map(i => i.id === img.id ? { ...i, sortOrder: newSortOrder } : i));
                                      }
                                    }} disabled={idx === 0} className="invisible group-hover:visible">
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => {
                                      if (idx < arr.length - 1) {
                                        const nextImg = arr[idx + 1];
                                        const newSortOrder = (nextImg.sortOrder || 0) + 1;
                                        updateImageOrderMutation.mutate({ imageId: img.id, newOrder: newSortOrder });
                                        setImages(prev => prev.map(i => i.id === img.id ? { ...i, sortOrder: newSortOrder } : i));
                                      }
                                    }} disabled={idx === arr.length - 1} className="invisible group-hover:visible">
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => deleteImageMutation.mutate(img.id)} className="invisible group-hover:visible text-muted-foreground hover:text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}

                  {/* Color Image Groups */}
                  {colors.map((color) => {
                    const colorImages = images.filter(img => img.imageType === "carousel" && img.color === color.name).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                    return (
                      <Collapsible key={color.name}>
                        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover-elevate">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full ring-1 ring-border/30 flex-shrink-0" style={{ backgroundColor: color.hex }} />
                            <span className="text-sm lowercase font-medium">{color.name}</span>
                            <span className="text-xs text-muted-foreground">{colorImages.length}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground/60 transition-transform" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-2 pb-2 pt-1">
                          {colorImages.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground/50 lowercase py-4">sem imagens</p>
                          ) : (
                            <div className="space-y-1">
                              {colorImages.map((img, idx, arr) => (
                                <div key={img.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group hover-elevate">
                                  <img src={img.imageUrl} alt="" className="h-14 w-14 object-cover rounded-lg flex-shrink-0 cursor-pointer" loading="lazy" decoding="async" onClick={() => setPreviewImage(img.imageUrl)} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm lowercase text-muted-foreground">imagem {idx + 1}</p>
                                  </div>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <Button type="button" size="icon" variant="ghost" onClick={() => {
                                      if (idx > 0) {
                                        const prevImg = arr[idx - 1];
                                        const newSortOrder = (prevImg.sortOrder || 0) - 1;
                                        updateImageOrderMutation.mutate({ imageId: img.id, newOrder: newSortOrder });
                                        setImages(prev => prev.map(i => i.id === img.id ? { ...i, sortOrder: newSortOrder } : i));
                                      }
                                    }} disabled={idx === 0} className="invisible group-hover:visible">
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => {
                                      if (idx < arr.length - 1) {
                                        const nextImg = arr[idx + 1];
                                        const newSortOrder = (nextImg.sortOrder || 0) + 1;
                                        updateImageOrderMutation.mutate({ imageId: img.id, newOrder: newSortOrder });
                                        setImages(prev => prev.map(i => i.id === img.id ? { ...i, sortOrder: newSortOrder } : i));
                                      }
                                    }} disabled={idx === arr.length - 1} className="invisible group-hover:visible">
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => deleteImageMutation.mutate(img.id)} className="invisible group-hover:visible text-muted-foreground hover:text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Customizable - Aparece apenas quando ativado */}
          {form.watch("customizable") && (
            <Collapsible open={openSections.customizable} onOpenChange={() => toggleSection('customizable')}>
              <CollapsibleTrigger className="w-full">
                <Card className="cursor-pointer hover:bg-accent/50">
                  <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm lowercase">posição das estampas</CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.customizable ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-5 pb-3 space-y-4">
                <FormField
                  control={form.control}
                  name="customizableFront"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between px-4 py-4 rounded-xl hover-elevate">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm lowercase font-medium">personalizar frente</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-customizable-front" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customizableBack"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between px-4 py-4 rounded-xl hover-elevate">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm lowercase font-medium">personalizar costas</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-customizable-back" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Fabrics */}
          {form.watch("fabricsEnabled") && (
            <Collapsible open={openSections.fabrics} onOpenChange={() => toggleSection('fabrics')}>
              <CollapsibleTrigger className="w-full">
                <Card className="cursor-pointer hover:bg-accent/50">
                  <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm lowercase">tecidos ({fabrics.length})</CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.fabrics ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-5 pb-3 space-y-5">
                {fabrics.length > 0 && (
                  <div className="space-y-1.5">
                    {fabrics.map((fabric, i) => (
                      <div key={i} className="rounded-2xl bg-muted/30 overflow-hidden group">
                        <div className="flex items-center gap-4 px-5 py-4">
                          <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center flex-shrink-0">
                            <span className="text-base font-light text-muted-foreground">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium lowercase block leading-tight">{fabric.name}</span>
                            <span className="text-[11px] text-muted-foreground/60">
                              {fabric.price > 0 ? `+ R$ ${Number(fabric.price).toFixed(2)}` : 'preço base'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFabric(i)}
                            className="text-muted-foreground/30 hover:text-destructive transition-colors p-1.5 rounded-full invisible group-hover:visible"
                            data-testid={`button-remove-fabric-${i}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="px-5 pb-4">
                          <Textarea 
                            placeholder="descrição do tecido (opcional)" 
                            value={fabric.description || ""} 
                            onChange={(e) => {
                              const updatedFabrics = [...fabrics];
                              updatedFabrics[i].description = e.target.value;
                              setFabrics(updatedFabrics);
                            }}
                            className="border-0 bg-background/60 rounded-xl px-4 py-3 text-sm focus-visible:ring-1 min-h-[70px] resize-none lowercase"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {fabrics.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <p className="text-xs text-muted-foreground/50 lowercase">nenhum tecido adicionado</p>
                  </div>
                )}

                <div className="border-t border-border/30 pt-5 space-y-3">
                  <Input 
                    value={newFabricName} 
                    onChange={(e) => setNewFabricName(e.target.value)} 
                    placeholder="nome do tecido" 
                    className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1 lowercase" 
                  />
                  <div className="flex gap-2">
                    <Input 
                      value={newFabricPrice} 
                      onChange={(e) => setNewFabricPrice(e.target.value)} 
                      placeholder="preço adicional (ex: 40)" 
                      className="flex-1 border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1" 
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddFabric} 
                      className="flex-shrink-0 rounded-xl h-11 px-5 lowercase gap-2"
                    >
                      <Plus className="h-4 w-4" /> adicionar
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Section Texts */}
          <Collapsible open={openSections.sectionTexts} onOpenChange={() => toggleSection('sectionTexts')}>
            <CollapsibleTrigger className="w-full">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm lowercase">textos da página</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.sectionTexts ? 'rotate-180' : ''}`} />
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-5 pb-3 space-y-5">
              <p className="text-xs text-muted-foreground/50 lowercase">textos exibidos na seção de personalização do produto. deixe vazio para não exibir.</p>

              <div className="rounded-2xl bg-muted/30 p-5 space-y-4">
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest font-medium">seção de personalização</p>
                <FormField
                  control={form.control}
                  name="sectionLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium lowercase text-muted-foreground/70">etiqueta</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          placeholder="ex: personalize" 
                          className="border-0 bg-background/60 rounded-xl h-11 px-4 text-sm focus-visible:ring-1 lowercase"
                          data-testid="input-section-label"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sectionTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium lowercase text-muted-foreground/70">título</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          placeholder="ex: escolha os detalhes da sua peça" 
                          className="border-0 bg-background/60 rounded-xl h-11 px-4 text-sm focus-visible:ring-1 lowercase"
                          data-testid="input-section-title"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sectionSubtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium lowercase text-muted-foreground/70">subtítulo</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          placeholder="ex: selecione as opções abaixo para adicionar à sua mochila" 
                          className="border-0 bg-background/60 rounded-xl h-11 px-4 text-sm focus-visible:ring-1 lowercase"
                          data-testid="input-section-subtitle"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Fabric */}
          <Collapsible open={openSections.fabric} onOpenChange={() => toggleSection('fabric')}>
            <CollapsibleTrigger className="w-full">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm lowercase">informações</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.fabric ? 'rotate-180' : ''}`} />
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-5 pb-3 space-y-4">
              <FormField
                control={form.control}
                name="fabricDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="descreva..." rows={2} className="border-0 bg-muted/50 rounded-xl px-4 py-3 text-sm focus-visible:ring-1 min-h-[80px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fabricTech"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">tecnologias (separadas por vírgula)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ex: lycra, algodão" className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="careInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">cuidados</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="lavar à máquina..." rows={2} className="border-0 bg-muted/50 rounded-xl px-4 py-3 text-sm focus-visible:ring-1 min-h-[80px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.shipping} onOpenChange={() => toggleSection('shipping')}>
            <CollapsibleTrigger className="w-full">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardHeader className="p-5 flex flex-row items-center justify-between gap-1 space-y-0">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 opacity-60" />
                    <CardTitle className="text-sm lowercase">dimensões para envio</CardTitle>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.shipping ? 'rotate-180' : ''}`} />
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-5 pb-3 space-y-4">
              <p className="text-xs text-muted-foreground lowercase">opcional — se preenchido, será usado no cálculo do frete pelos correios no lugar dos valores padrão.</p>
              <FormField
                control={form.control}
                name="shippingWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium lowercase">peso (gramas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="ex: 300"
                        className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-shipping-weight"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="shippingHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium lowercase">altura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="ex: 4"
                          className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          data-testid="input-shipping-height"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium lowercase">largura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="ex: 30"
                          className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          data-testid="input-shipping-width"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium lowercase">comprimento (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="ex: 40"
                          className="border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          data-testid="input-shipping-length"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Reviews - Aparece apenas quando ativado */}
          {form.watch("reviewsEnabled") && product?.id && (
            <Collapsible open={openSections.reviews} onOpenChange={() => toggleSection('reviews')}>
              <CollapsibleTrigger className="w-full">
                <Card className="cursor-pointer hover:bg-accent/50">
                  <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm lowercase">avaliações</CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.reviews ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-5 pb-3 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground lowercase">ajuste a nota inicial e gerencie os comentários dos clientes.</p>
                </div>
                <AdminProductReviews product={product} />
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="h-4" />
        </form>
      </Form>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 rounded-2xl bg-background/95 backdrop-blur border-0" data-testid="dialog-image-preview">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-close-preview"
          >
            <X className="h-4 w-4" />
          </button>
          {previewImage && (
            <img
              src={previewImage}
              alt=""
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              data-testid="img-preview-full"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
