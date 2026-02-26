import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

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

function BannerCarouselComponent() {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);
  const holdStartRef = useRef<number>(0);
  const wasLongHoldRef = useRef<boolean>(false);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const SLIDE_DURATION = 5000;
  const HOLD_THRESHOLD = 150;
  const MIN_SWIPE_DISTANCE = 50;

  const { data: bannersData } = useQuery<{ banners: Banner[] }>({
    queryKey: ['/api/banners'],
  });

  const activeBanners = bannersData?.banners?.filter(b => b.isActive) || [];

  const advanceSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = 0;
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanners.length <= 1 || !isAutoPlayEnabled) return;

    const tick = (timestamp: number) => {
      if (isHoldingRef.current) {
        lastTimeRef.current = 0;
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      progressRef.current += delta;
      const pct = Math.min(progressRef.current / SLIDE_DURATION, 1);
      setProgress(pct);

      if (pct >= 1) {
        advanceSlide();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [activeBanners.length, isAutoPlayEnabled, currentIndex, advanceSlide]);

  const resetProgress = () => {
    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = 0;
  };

  const goToPrevious = () => {
    resetProgress();
    setIsAutoPlayEnabled(true);
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToNext = () => {
    resetProgress();
    setIsAutoPlayEnabled(true);
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleBarClick = (index: number) => {
    resetProgress();
    setIsAutoPlayEnabled(true);
    setCurrentIndex(index);
  };

  const startHold = (x: number) => {
    holdStartRef.current = Date.now();
    isHoldingRef.current = true;
    wasLongHoldRef.current = false;
    touchStartXRef.current = x;
    touchEndXRef.current = 0;
  };

  const endHold = () => {
    const holdDuration = Date.now() - holdStartRef.current;
    const wasLong = holdDuration >= HOLD_THRESHOLD;
    wasLongHoldRef.current = wasLong;
    isHoldingRef.current = false;

    const distance = touchStartXRef.current - touchEndXRef.current;
    const hasMoved = touchEndXRef.current !== 0;

    if (hasMoved && Math.abs(distance) > MIN_SWIPE_DISTANCE) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startHold(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    endHold();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startHold(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    touchEndXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    endHold();
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
    isHoldingRef.current = false;
    wasLongHoldRef.current = false;
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  const handleTapZoneClick = (direction: "prev" | "next") => {
    if (wasLongHoldRef.current) {
      wasLongHoldRef.current = false;
      return;
    }
    if (direction === "prev") {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  if (activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex];
  
  const bannerLink = currentBanner.productId 
    ? `/produto/${currentBanner.productId}` 
    : currentBanner.ctaLink || "#";

  const isExternalLink = bannerLink.startsWith('http');

  const getPositionClasses = () => {
    if (!isMobile || !currentBanner.mobilePosition) {
      return {
        container: currentBanner.position === 'right' 
          ? 'ml-auto text-right' 
          : currentBanner.position === 'center' 
            ? 'mx-auto text-center' 
            : 'mr-auto text-left',
        padding: ''
      };
    }

    const [vertical, horizontal] = currentBanner.mobilePosition.split('-');
    
    const verticalClass = vertical === 'bottom' ? 'items-end' : 'items-center';
    
    let horizontalClass = '';
    if (horizontal === 'left') {
      horizontalClass = 'text-left mr-auto';
    } else if (horizontal === 'center') {
      horizontalClass = 'text-center mx-auto';
    } else if (horizontal === 'right') {
      horizontalClass = 'text-right ml-auto';
    }
    
    const paddingClass = vertical === 'bottom' ? 'pb-16' : '';
    
    return {
      container: `${horizontalClass}`,
      padding: paddingClass,
      flexVertical: verticalClass
    };
  };

  const positionClasses = getPositionClasses();

  return (
    <section 
      className="relative h-[70vh] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${isMobile && currentBanner.mobileImageUrl ? currentBanner.mobileImageUrl : currentBanner.imageUrl})` } as any}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
      
      {/* Content */}
      {currentBanner.showText && (
        <div className={`absolute inset-0 z-[15] flex ${isMobile && currentBanner.mobilePosition && positionClasses.flexVertical ? positionClasses.flexVertical : 'items-center'} justify-center pointer-events-none ${positionClasses.padding || ''}`}>
          <div className="container px-4">
            <div className={`max-w-lg w-full ${positionClasses.container}`}>
              <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 lowercase" data-testid="text-banner-title" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)' }}>
                {currentBanner.title}
              </h2>
              <p className="text-white/90 text-lg md:text-xl mb-8 lowercase" data-testid="text-banner-subtitle" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {currentBanner.subtitle}
              </p>
              {currentBanner.ctaText && (
                <Button 
                  asChild
                  variant="outline"
                  size="lg"
                  className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 lowercase pointer-events-auto"
                  data-testid={`button-banner-cta-${currentBanner.id}`}
                >
                  {isExternalLink ? (
                    <a href={bannerLink} target="_blank" rel="noopener noreferrer">
                      {currentBanner.ctaText}
                    </a>
                  ) : (
                    <Link href={bannerLink}>
                      {currentBanner.ctaText}
                    </Link>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Tap zones: left = previous, right = next */}
      {activeBanners.length > 1 && (
        <div className="absolute inset-0 z-10 flex">
          <button
            className="w-1/2 h-full cursor-pointer"
            onClick={() => handleTapZoneClick("prev")}
            data-testid="button-banner-tap-left"
          />
          <button
            className="w-1/2 h-full cursor-pointer"
            onClick={() => handleTapZoneClick("next")}
            data-testid="button-banner-tap-right"
          />
        </div>
      )}

      {/* Story-style progress bars */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-1">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => handleBarClick(index)}
              className="relative flex-1 h-[3px] rounded-full overflow-hidden bg-white/30 cursor-pointer"
              data-testid={`button-banner-bar-${index}`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-white rounded-full"
                style={{
                  width: index < currentIndex
                    ? '100%'
                    : index === currentIndex
                      ? `${progress * 100}%`
                      : '0%',
                  transition: index === currentIndex ? 'none' : 'width 0.3s ease',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export const BannerCarousel = memo(BannerCarouselComponent);
export default BannerCarousel;
