import { Backpack } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import { useMochila } from "@/contexts/MochilaContext";
import { useFavoritos } from "@/contexts/FavoritosContext";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import logoSvg from "@/assets/logo.svg";
import AppleMenu from "./AppleMenu";
import FavoritoToast from "./FavoritoToast";

const InvertedStairsIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="9" y1="12" x2="21" y2="12" />
    <line x1="15" y1="18" x2="21" y2="18" />
  </svg>
);

export default function Header() {
  const { totalItems, setIsDrawerOpen } = useMochila();
  const { favoritos, showFavoritoToast, favoritoToastItem, closeFavoritoToast } = useFavoritos();
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isHomePage = location === "/";

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  return (
    <>
      <header className={`${isHomePage ? 'fixed' : 'sticky'} top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}>
        <div className="flex h-16 items-center justify-between px-4 md:px-8 relative">
          <div className="flex items-center gap-1.5 mr-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(true)}
              data-testid="button-menu"
              className="h-14 w-14 flex items-center justify-center"
            >
              <InvertedStairsIcon className="h-[54px] w-[54px] scale-x-[-1]" />
              <span className="sr-only">menu</span>
            </Button>
          </div>

          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 md:relative absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0">
              <img src={logoSvg} alt="Oudla Logo" className="h-[28.8px] w-[28.8px] object-contain dark:invert shrink-0" loading="lazy" decoding="async" />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDrawerOpen(true)}
              data-testid="button-mochila"
              className="h-14 w-14 relative flex items-center justify-center"
            >
              <Backpack className="h-8 w-8" />
              {totalItems > 0 && (
                <span className="absolute top-2 right-2 h-4 w-4 bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">mochila</span>
            </Button>
          </div>
        </div>
      </header>

      <AppleMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <FavoritoToast
        item={favoritoToastItem}
        isVisible={showFavoritoToast}
        onClose={closeFavoritoToast}
        onOpenMenu={() => setIsMenuOpen(true)}
      />
    </>
  );
}