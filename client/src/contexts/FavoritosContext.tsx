import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import type { FavoritoToastItem } from "@/components/FavoritoToast";

interface FavoritoItem {
  id: string;
  timestamp: number;
}

interface FavoritosContextType {
  favoritos: string[];
  isFavorito: (productId: string) => boolean;
  toggleFavorito: (productId: string) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  showFavoritoToast: boolean;
  favoritoToastItem: FavoritoToastItem | null;
  triggerFavoritoToast: (item: FavoritoToastItem) => void;
  closeFavoritoToast: () => void;
}

const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);

const STORAGE_KEY = "oudla_favoritos";
const CACHE_DURATION = 60 * 24 * 60 * 60 * 1000; // 60 dias em milissegundos

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showFavoritoToast, setShowFavoritoToast] = useState(false);
  const [favoritoToastItem, setFavoritoToastItem] = useState<FavoritoToastItem | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadFavoritos = () => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          console.warn("localStorage não está disponível");
          return;
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const items: FavoritoItem[] = JSON.parse(stored);
          
          if (!Array.isArray(items)) {
            console.error("Dados de favoritos corrompidos, limpando...");
            localStorage.removeItem(STORAGE_KEY);
            return;
          }

          const now = Date.now();
          
          const validItems = items.filter(item => 
            item && 
            typeof item.id === 'string' && 
            typeof item.timestamp === 'number' &&
            now - item.timestamp < CACHE_DURATION
          );
          
          if (validItems.length !== items.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
          }
          
          setFavoritos(validItems.map(item => item.id));
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error("Erro ao parsear favoritos, dados corrompidos:", error);
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (e) {
            console.error("Não foi possível limpar dados corrompidos:", e);
          }
        } else if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error("localStorage cheio, não foi possível salvar favoritos");
        } else {
          console.error("Erro ao carregar favoritos:", error);
        }
      }
    };

    loadFavoritos();
  }, []);

  const toggleFavorito = useCallback((productId: string) => {
    setFavoritos(prev => {
      const newFavoritos = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      const items: FavoritoItem[] = newFavoritos.map(id => ({
        id,
        timestamp: Date.now()
      }));
      
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error("localStorage cheio, não foi possível salvar favorito");
        } else {
          console.error("Erro ao salvar favorito:", error);
        }
      }
      
      return newFavoritos;
    });
  }, []);

  const isFavorito = useCallback((productId: string) => {
    return favoritos.includes(productId);
  }, [favoritos]);

  const triggerFavoritoToast = useCallback((item: FavoritoToastItem) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setFavoritoToastItem(item);
    setShowFavoritoToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowFavoritoToast(false);
    }, 3000);
  }, []);

  const closeFavoritoToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setShowFavoritoToast(false);
  }, []);

  const contextValue = useMemo(() => ({
    favoritos, 
    isFavorito, 
    toggleFavorito,
    isDrawerOpen,
    setIsDrawerOpen,
    showFavoritoToast,
    favoritoToastItem,
    triggerFavoritoToast,
    closeFavoritoToast
  }), [favoritos, isFavorito, toggleFavorito, isDrawerOpen, showFavoritoToast, favoritoToastItem, triggerFavoritoToast, closeFavoritoToast]);

  return (
    <FavoritosContext.Provider value={contextValue}>
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos() {
  const context = useContext(FavoritosContext);
  if (!context) {
    throw new Error("useFavoritos must be used within FavoritosProvider");
  }
  return context;
}
