import ProductCard from "./ProductCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useFavoritos } from "@/contexts/FavoritosContext";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import ctaBackgroundImage from "@assets/generated_images/luxury_fabric_texture_background_e669b3a7.png";

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-6 bg-muted animate-pulse rounded w-24" />
      </CardContent>
    </Card>
  );
}

export default function ProductGrid() {
  const { isFavorito, toggleFavorito, triggerFavoritoToast } = useFavoritos();
  
  const { data: apiData, isLoading } = useQuery<{products: any[]}>({
    queryKey: ['/api/products'],
  });

  const { data: ctaBannerData } = useQuery<{config: any}>({
    queryKey: ['/api/cta-banner'],
  });
  
  const products = (apiData?.products?.filter((product: any) => 
    (!product.productType || product.productType === 'tshirt') && 
    product.status === 'published'
  ) || []).slice(0, 6);

  // Get CTA banner config or null
  const ctaConfig = ctaBannerData?.config;

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </>
          ) : (
            products.map((product: any) => (
              <ProductCard
                key={product.id}
                {...product}
                isFavorite={isFavorito(product.id)}
                showInstallments={false}
                onFavoriteToggle={(id, productInfo) => {
                  if (!isFavorito(id)) {
                    triggerFavoritoToast({ id, ...productInfo });
                  }
                  toggleFavorito(id);
                }}
                disableLazyLoading={true}
              />
            ))
          )}
        </div>
        
        {!isLoading && ctaConfig && (
          <div className="mt-20">
            <Link href="/produtos">
              <div 
                className="relative overflow-hidden rounded-md group cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
                data-testid="button-view-all"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${ctaConfig.backgroundImageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70" />
                
                <div className="relative py-24 px-8 md:py-32 md:px-16 text-center space-y-6">
                  {ctaConfig.tagLabel && (
                    <div className="text-xs uppercase tracking-widest text-white/80 mb-4">
                      <span>{ctaConfig.tagLabel}</span>
                    </div>
                  )}
                  
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-white lowercase tracking-tight">
                    {ctaConfig.title}
                  </h2>
                  
                  {ctaConfig.description && (
                    <p className="text-white/70 lowercase text-sm md:text-base max-w-2xl mx-auto">
                      {ctaConfig.description}
                    </p>
                  )}
                  
                  <div className="pt-4">
                    <Button 
                      size="lg"
                      style={{ 
                        backgroundColor: ctaConfig.buttonBgColor,
                        borderColor: ctaConfig.buttonBgColor,
                        color: ctaConfig.buttonBgColor === '#ffffff' || ctaConfig.buttonBgColor === '#fff' ? '#000000' : '#ffffff'
                      }}
                      className="hover:opacity-90 lowercase font-medium px-8 border-2 group-hover:bg-transparent group-hover:text-white transition-all"
                      asChild
                    >
                      <span className="inline-flex items-center">
                        {ctaConfig.buttonText}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
