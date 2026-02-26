import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { ContentCard } from "@shared/schema";

interface ContentCardWithImages extends ContentCard {
  images?: string[];
}

export default function LifestyleBanner() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: cardsData } = useQuery<{ cards: ContentCardWithImages[] }>({
    queryKey: ['/api/content-cards'],
  });

  const lifestyleCard = cardsData?.cards?.find(c => c.cardType === 'lifestyle' && c.isActive);

  const images = lifestyleCard?.images && lifestyleCard.images.length > 0 
    ? lifestyleCard.images 
    : [lifestyleCard?.imageUrl].filter(Boolean);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [images?.length]);

  if (!lifestyleCard) {
    return null;
  }

  const heightClass = {
    small: 'h-[40vh]',
    medium: 'h-[50vh]',
    large: 'h-[80vh]',
  }[lifestyleCard.height || 'medium'];

  const gradientClass = {
    left: 'bg-gradient-to-r from-black/70 via-black/30 to-transparent',
    right: 'bg-gradient-to-l from-black/70 via-black/30 to-transparent',
    center: 'bg-gradient-to-r from-transparent via-black/50 to-transparent',
    bottom: 'bg-gradient-to-t from-black/70 via-black/30 to-transparent',
  }[lifestyleCard.position || 'left'];

  const positionClass = {
    left: 'items-center justify-start px-8 md:px-16',
    right: 'items-center justify-end px-8 md:px-16',
    center: 'items-center justify-center text-center',
    bottom: 'items-end justify-center pb-12 text-center',
  }[lifestyleCard.position || 'left'];

  const cardLink = lifestyleCard.productId 
    ? `/produto/${lifestyleCard.productId}` 
    : lifestyleCard.ctaLink || "#";

  return (
    <section className={`relative ${heightClass} overflow-hidden`}>
      <div className={`absolute inset-0 ${gradientClass} z-10`}></div>
      
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
            alt={lifestyleCard.title || "comunidade de fé"}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
      
      <div className={`absolute inset-0 z-20 flex ${positionClass}`}>
        <div className="max-w-lg">
          {lifestyleCard.title && (
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4 lowercase">
              {lifestyleCard.title}
            </h2>
          )}
          {lifestyleCard.subtitle && (
            <p className="text-lg md:text-xl text-white/90 font-light lowercase mb-6">
              {lifestyleCard.subtitle}
            </p>
          )}
          {lifestyleCard.ctaText && (
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="bg-background/10 backdrop-blur-md border-white/20 text-white hover:bg-background/20 lowercase"
              data-testid="button-lifestyle-banner"
            >
              <Link href={cardLink}>
                {lifestyleCard.ctaText}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
