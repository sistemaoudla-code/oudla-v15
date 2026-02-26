import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { ContentCard } from "@shared/schema";

interface ContentCardWithImages extends ContentCard {
  images?: string[];
}

export default function FeatureBanner() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: cardsData } = useQuery<{ cards: ContentCardWithImages[] }>({
    queryKey: ['/api/content-cards'],
  });

  const featureCard = cardsData?.cards?.find(c => c.cardType === 'feature' && c.isActive);

  const images = featureCard?.images && featureCard.images.length > 0 
    ? featureCard.images 
    : [];

  useEffect(() => {
    if (!images || images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [images?.length]);

  if (!featureCard || images.length === 0) {
    return null;
  }

  const heightClass = {
    small: 'h-[40vh]',
    medium: 'h-[50vh]',
    large: 'h-[80vh]',
  }[featureCard.height || 'large'];

  const positionClass = {
    left: 'items-end justify-start pl-8',
    right: 'items-end justify-end pr-8',
    center: 'items-end justify-center',
    bottom: 'items-end justify-center',
  }[featureCard.position || 'bottom'];

  const cardLink = featureCard.productId 
    ? `/produto/${featureCard.productId}` 
    : featureCard.ctaLink || "#";

  return (
    <section className={`relative ${heightClass} overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
      
      {images && images.map((imageUrl, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: index === currentImageIndex ? 1 : 0,
            pointerEvents: index === currentImageIndex ? 'auto' : 'none'
          }}
        >
          <img
            src={imageUrl}
            alt={featureCard.title || "produtos especiais"}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
      
      <div className={`absolute inset-0 z-20 flex ${positionClass} pb-12`}>
        <div className="text-center max-w-lg">
          {featureCard.title && (
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4 lowercase">
              {featureCard.title}
            </h2>
          )}
          {featureCard.subtitle && (
            <p className="text-lg md:text-xl text-white/90 font-light lowercase mb-6">
              {featureCard.subtitle}
            </p>
          )}
          {featureCard.ctaText && (
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="bg-background/10 backdrop-blur-md border-white/20 text-white hover:bg-background/20 lowercase"
              data-testid="button-feature-banner"
            >
              <Link href={cardLink}>
                {featureCard.ctaText}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
