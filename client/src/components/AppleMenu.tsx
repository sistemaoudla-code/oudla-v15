import { Heart, Trash2, MapPin, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavoritos } from "@/contexts/FavoritosContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ProductWithImages extends Product {
  images?: string[];
}

interface AppleMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppleMenu({ isOpen, onClose }: AppleMenuProps) {
  const { favoritos, toggleFavorito } = useFavoritos();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: productsData } = useQuery<{ products: ProductWithImages[] }>({
    queryKey: ['/api/products'],
    enabled: isOpen && favoritos.length > 0,
  });

  const favoritoProducts = productsData?.products?.filter((p) => favoritos.includes(p.id)) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onClose();
      // Use window.location.href or similar to ensure the search param is updated if already on the products page
      const searchUrl = `/produtos?q=${encodeURIComponent(searchQuery.trim())}`;
      setLocation(searchUrl);
    }
  };

  const formatPrice = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            data-testid="backdrop-apple-menu"
          />

          {/* Menu Panel - Popup Style */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.8, right: 0.1 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) {
                onClose();
              }
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-4 top-4 bottom-4 w-[calc(100%-2rem)] max-w-md bg-background/95 backdrop-blur-xl z-[61] shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col border border-white/10 touch-none"
            data-testid="apple-menu-panel"
          >
            {/* Header / Close handle */}
            <div className="flex items-center justify-center pt-4 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              <div className="space-y-10 pb-20">
                {/* Favoritos Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-semibold tracking-tight lowercase">lista de desejos</h2>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-full bg-muted/20 hover:bg-muted/40 transition-colors"
                      onClick={onClose}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {favoritoProducts.length === 0 ? (
                      <div className="py-10 flex flex-col items-center justify-center rounded-[2rem] bg-muted/20 border border-dashed border-muted">
                        <Heart className="h-6 w-6 text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground lowercase">lista de desejos vazia</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {favoritoProducts.map((product) => {
                          const firstImage = product.images?.[0] || '/placeholder.jpg';
                          return (
                            <div
                              key={product.id}
                              className="group relative flex items-center gap-4 p-4 rounded-[2rem] bg-card hover:bg-muted/30 transition-all cursor-pointer border border-white/5 shadow-sm active:scale-[0.99]"
                              onClick={() => {
                                onClose();
                                setLocation(`/produto/${product.id}`);
                              }}
                            >
                              <div className="relative shrink-0">
                                <img
                                  src={firstImage}
                                  alt={product.name}
                                  className="w-20 h-20 object-cover rounded-2xl shadow-sm border border-white/5"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center h-20">
                                <div className="space-y-1">
                                  <h3 className="font-semibold text-sm tracking-tight lowercase truncate opacity-90">{product.name}</h3>
                                  <p className="text-xs text-muted-foreground/80 font-medium">{formatPrice(product.price)}</p>
                                </div>
                                <div className="flex justify-end mt-auto">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorito(product.id);
                                    }}
                                    className="h-8 w-8 rounded-full bg-muted/20 hover:bg-destructive hover:text-white transition-all shadow-sm group/trash"
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover/trash:text-white" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Section */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold tracking-tight lowercase px-2">pesquisar</h2>
                  <form onSubmit={handleSearch} className="px-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="o que você procura?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-12 pr-4 rounded-2xl bg-muted/20 border-transparent focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground/50 lowercase"
                      />
                    </div>
                  </form>
                </div>

                {/* Services Section */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold tracking-tight lowercase px-2">serviços</h2>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="ghost"
                      className="h-auto py-5 px-6 rounded-[2rem] bg-muted/20 hover:bg-muted/40 justify-start gap-4 text-base font-medium lowercase transition-all active:scale-[0.98]"
                      onClick={() => {
                        onClose();
                        setLocation('/rastreio');
                      }}
                    >
                      <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      rastrear pedido
                    </Button>

                    <div 
                      className="flex items-center justify-between py-4 px-6 rounded-[2rem] bg-muted/20 border border-transparent cursor-pointer hover:bg-muted/30 transition-colors active:scale-[0.98]"
                      onClick={() => {
                        const event = new CustomEvent('toggle-theme');
                        window.dispatchEvent(event);
                      }}
                    >
                      <span className="text-base font-medium lowercase">aparência</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="p-6 pb-8 shrink-0 bg-gradient-to-t from-background to-transparent" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
