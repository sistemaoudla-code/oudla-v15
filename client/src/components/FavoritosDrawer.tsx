import { X, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavoritos } from "@/contexts/FavoritosContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

interface ProductWithImages extends Product {
  images?: string[];
}

export default function FavoritosDrawer() {
  const { favoritos, isDrawerOpen, setIsDrawerOpen, toggleFavorito } = useFavoritos();
  const [, setLocation] = useLocation();

  const { data: productsData } = useQuery<{ products: ProductWithImages[] }>({
    queryKey: ['/api/products'],
    enabled: isDrawerOpen && favoritos.length > 0,
  });

  const favoritoProducts = productsData?.products?.filter((p) => favoritos.includes(p.id)) || [];

  const formatPrice = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
            data-testid="backdrop-favoritos"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 flex flex-col"
            data-testid="drawer-favoritos"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-medium lowercase">lista de desejos</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDrawerOpen(false)}
                data-testid="button-close-drawer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {favoritoProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">lista de desejos vazia</p>
                  <p className="text-sm text-muted-foreground">adicione produtos à lista de desejos para vê-los aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoritoProducts.map((product) => {
                    const firstImage = product.images?.[0] || '/placeholder.jpg';
                    
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="relative flex gap-4 p-4 rounded-lg border hover-elevate cursor-pointer"
                        data-testid={`favorito-item-${product.id}`}
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setLocation(`/produto/${product.id}`);
                        }}
                      >
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-md"
                          data-testid={`image-${product.id}`}
                          loading="lazy"
                          decoding="async"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium lowercase truncate mb-1" data-testid={`name-${product.id}`}>
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2" data-testid={`price-${product.id}`}>
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorito(product.id);
                            }}
                            className="h-7 w-7"
                            data-testid={`button-remove-${product.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
