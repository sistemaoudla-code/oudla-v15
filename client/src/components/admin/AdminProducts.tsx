import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  MoveUp,
  MoveDown,
  ChevronDown,
  ChevronRight,
  Shirt,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ProductForm from "./ProductForm";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Product {
  id: string;
  sku?: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  productType: string;
  category?: string;
  colors?: string[];
  sizes?: string[];
  isNew: boolean;
  isActive: boolean;
  status?: string;
  displayOrder: number;
  customizableFront: boolean;
  customizableBack: boolean;
}

interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  color?: string;
  sortOrder: number;
}

export default function AdminProducts() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [productsOpen, setProductsOpen] = useState(false);
  const [accessoriesOpen, setAccessoriesOpen] = useState(false);

  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/admin/products'],
  });

  const { data: imagesData } = useQuery<{ [productId: string]: ProductImage[] }>({
    queryKey: ['/api/admin/products', 'images-all'],
    queryFn: async () => {
      if (!productsData?.products) return {};
      
      const imagesMap: { [productId: string]: ProductImage[] } = {};
      
      for (const product of productsData.products) {
        const response = await fetch(`/api/admin/products/${product.id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          imagesMap[product.id] = data.product.images || [];
        }
      }
      
      return imagesMap;
    },
    enabled: !!productsData?.products,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${productId}`);
      if (!response.ok) throw new Error("Erro ao deletar produto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: "Produto deletado",
        description: "O produto foi removido com sucesso.",
      });
      setDeletingProduct(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível deletar o produto.",
      });
    },
  });

  const updateDisplayOrderMutation = useMutation({
    mutationFn: async ({ productId, newOrder }: { productId: string; newOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${productId}`, {
        displayOrder: newOrder,
      });
      if (!response.ok) throw new Error("Erro ao atualizar ordem");
      return response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/admin/products'] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar ordem:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a ordem do produto.",
      });
    },
  });

  const products = productsData?.products || [];
  
  // Separate products by type
  const tshirts = products.filter(p => p.productType === 'tshirt');
  const accessories = products.filter(p => p.productType === 'accessory');
  
  // Sort each category separately by displayOrder
  const sortedTshirts = [...tshirts].sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0));
  const sortedAccessories = [...accessories].sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0));

  const handleEdit = async (product: Product) => {
    try {
      const response = await apiRequest("GET", `/api/admin/products/${product.id}`);
      const data = await response.json();
      setEditingProduct(data.product);
      setShowForm(true);
    } catch (error) {
      console.error("Error loading product:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os detalhes do produto.",
      });
    }
  };

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  // New swap-based ordering that guarantees one-by-one movement
  const handleMoveUp = async (productList: Product[], index: number) => {
    console.log("🔼 handleMoveUp chamado", { index, totalItems: productList.length });
    
    if (index === 0) {
      console.log("⚠️ Já está no topo, nada a fazer");
      return;
    }
    
    const currentProduct = productList[index];
    const previousProduct = productList[index - 1];
    
    console.log("🔼 Produtos:", {
      current: { id: currentProduct.id, name: currentProduct.name, order: currentProduct.displayOrder },
      previous: { id: previousProduct.id, name: previousProduct.name, order: previousProduct.displayOrder }
    });
    
    // Swap the displayOrder values
    const currentOrder = currentProduct.displayOrder || 0;
    const previousOrder = previousProduct.displayOrder || 0;
    
    try {
      console.log("🔼 Atualizando ordens...");
      // Update both products
      await updateDisplayOrderMutation.mutateAsync({ 
        productId: currentProduct.id, 
        newOrder: previousOrder 
      });
      
      await updateDisplayOrderMutation.mutateAsync({ 
        productId: previousProduct.id, 
        newOrder: currentOrder 
      });
      
      console.log("✅ Ordens atualizadas com sucesso");
      toast({
        title: "Ordem atualizada",
        description: "O produto foi movido para cima.",
      });
    } catch (error) {
      console.error("❌ Erro ao mover produto:", error);
    }
  };

  const handleMoveDown = async (productList: Product[], index: number) => {
    console.log("🔽 handleMoveDown chamado", { index, totalItems: productList.length });
    
    if (index === productList.length - 1) {
      console.log("⚠️ Já está no final, nada a fazer");
      return;
    }
    
    const currentProduct = productList[index];
    const nextProduct = productList[index + 1];
    
    console.log("🔽 Produtos:", {
      current: { id: currentProduct.id, name: currentProduct.name, order: currentProduct.displayOrder },
      next: { id: nextProduct.id, name: nextProduct.name, order: nextProduct.displayOrder }
    });
    
    // Swap the displayOrder values
    const currentOrder = currentProduct.displayOrder || 0;
    const nextOrder = nextProduct.displayOrder || 0;
    
    try {
      console.log("🔽 Atualizando ordens...");
      // Update both products
      await updateDisplayOrderMutation.mutateAsync({ 
        productId: currentProduct.id, 
        newOrder: nextOrder 
      });
      
      await updateDisplayOrderMutation.mutateAsync({ 
        productId: nextProduct.id, 
        newOrder: currentOrder 
      });
      
      console.log("✅ Ordens atualizadas com sucesso");
      toast({
        title: "Ordem atualizada",
        description: "O produto foi movido para baixo.",
      });
    } catch (error) {
      console.error("❌ Erro ao mover produto:", error);
    }
  };

  const renderProductCard = (product: Product, index: number, productList: Product[]) => {
    const productImages = imagesData?.[product.id] || [];
    const mainImage = productImages.find(img => img.sortOrder === 0) || productImages[0];

    return (
      <Card key={product.id} className="overflow-hidden hover-elevate transition-all cursor-pointer group" data-testid={`card-product-${product.id}`} onClick={() => handleEdit(product)}>
        <CardContent className="p-0 sm:p-4">
          {/* Mobile Layout - Vertical */}
          <div className="sm:hidden">
            <div className="w-full h-48 bg-muted overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="p-3 space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium lowercase truncate" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    {product.sku && (
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {product.isNew && (
                      <Badge variant="default" className="lowercase text-xs">novo</Badge>
                    )}
                    {product.status === "draft" && (
                      <Badge variant="secondary" className="lowercase text-xs">rascunho</Badge>
                    )}
                    {product.status === "published" && (
                      <Badge variant="outline" className="lowercase text-xs text-green-600 border-green-600">publicado</Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground lowercase line-clamp-2 mb-2">
                  {product.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <div>
                    <span className="font-medium">R$ {product.price}</span>
                    {product.originalPrice && (
                      <span className="text-muted-foreground line-through ml-1 text-xs">
                        R$ {product.originalPrice}
                      </span>
                    )}
                  </div>
                  
                  {productImages.length > 0 && (
                    <div className="text-muted-foreground text-xs">
                      {productImages.length} {productImages.length === 1 ? 'imagem' : 'imagens'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMoveUp(productList, index)}
                  disabled={index === 0}
                  className="flex-1 gap-1"
                  data-testid={`button-move-up-${product.id}`}
                >
                  <MoveUp className="h-4 w-4" />
                  <span className="lowercase">subir</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMoveDown(productList, index)}
                  disabled={index === productList.length - 1}
                  className="flex-1 gap-1"
                  data-testid={`button-move-down-${product.id}`}
                >
                  <MoveDown className="h-4 w-4" />
                  <span className="lowercase">descer</span>
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="flex-1 gap-2"
                  data-testid={`button-edit-${product.id}`}
                >
                  <Edit className="h-4 w-4" />
                  <span className="lowercase">editar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(product);
                  }}
                  className="flex-1 gap-2"
                  data-testid={`button-delete-${product.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="lowercase">deletar</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden sm:flex gap-4">
            <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0 overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage.imageUrl}
                  alt={product.name}
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

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium lowercase truncate" data-testid={`text-product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  {product.sku && (
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">
                      SKU: {product.sku}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {product.isNew && (
                    <Badge variant="default" className="lowercase text-xs">novo</Badge>
                  )}
                  {product.status === "draft" && (
                    <Badge variant="secondary" className="lowercase text-xs">rascunho</Badge>
                  )}
                  {product.status === "published" && (
                    <Badge variant="outline" className="lowercase text-xs text-green-600 border-green-600">publicado</Badge>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground lowercase line-clamp-2 mb-2">
                {product.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <div>
                  <span className="font-medium">R$ {product.price}</span>
                  {product.originalPrice && (
                    <span className="text-muted-foreground line-through ml-1 text-xs">
                      R$ {product.originalPrice}
                    </span>
                  )}
                </div>
                
                {productImages.length > 0 && (
                  <div className="text-muted-foreground">
                    {productImages.length} {productImages.length === 1 ? 'imagem' : 'imagens'}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveUp(productList, index);
                }}
                disabled={index === 0}
                className="h-8 w-8"
                data-testid={`button-move-up-${product.id}`}
              >
                <MoveUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveDown(productList, index);
                }}
                disabled={index === productList.length - 1}
                className="h-8 w-8"
                data-testid={`button-move-down-${product.id}`}
              >
                <MoveDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(product);
                }}
                className="h-8 w-8"
                data-testid={`button-edit-${product.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product);
                }}
                className="h-8 w-8"
                data-testid={`button-delete-${product.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="min-h-full">
          <ProductForm
            key={editingProduct?.id || 'new'}
            product={editingProduct}
            onClose={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
            onSuccess={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-light lowercase truncate">gerenciar produtos</h1>
          <p className="text-sm text-muted-foreground lowercase">criar, editar e organizar produtos</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="gap-2 w-full sm:w-auto"
          data-testid="button-add-product"
        >
          <Plus className="h-4 w-4" />
          <span className="lowercase">adicionar</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground lowercase">carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-base font-medium lowercase mb-2">nenhum produto cadastrado</h3>
            <p className="text-sm text-muted-foreground lowercase mb-4">
              comece adicionando seu primeiro produto
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="lowercase">adicionar produto</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Camisetas Section */}
          <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
            <Card>
              <CollapsibleTrigger className="w-full" data-testid="collapsible-trigger-tshirts">
                <CardContent className="p-4 flex items-center justify-between hover-elevate">
                  <div className="flex items-center gap-3">
                    <Shirt className="h-5 w-5 text-muted-foreground" />
                    <div className="text-left">
                      <h2 className="text-lg font-medium lowercase">produtos</h2>
                      <p className="text-sm text-muted-foreground lowercase">
                        {sortedTshirts.length} {sortedTshirts.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  </div>
                  {productsOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardContent>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3">
                  {sortedTshirts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 lowercase">
                      nenhum produto cadastrado
                    </p>
                  ) : (
                    sortedTshirts.map((product, index) => renderProductCard(product, index, sortedTshirts))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Accessories Section */}
          <Collapsible open={accessoriesOpen} onOpenChange={setAccessoriesOpen}>
            <Card>
              <CollapsibleTrigger className="w-full" data-testid="collapsible-trigger-accessories">
                <CardContent className="p-4 flex items-center justify-between hover-elevate">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div className="text-left">
                      <h2 className="text-lg font-medium lowercase">acessórios</h2>
                      <p className="text-sm text-muted-foreground lowercase">
                        {sortedAccessories.length} {sortedAccessories.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  </div>
                  {accessoriesOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardContent>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3">
                  {sortedAccessories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 lowercase">
                      nenhum acessório cadastrado
                    </p>
                  ) : (
                    sortedAccessories.map((product, index) => renderProductCard(product, index, sortedAccessories))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}

      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="lowercase">deletar produto?</AlertDialogTitle>
            <AlertDialogDescription className="lowercase">
              tem certeza que deseja deletar "{deletingProduct?.name}"? esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="lowercase" data-testid="button-cancel-delete">cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct.id)}
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
