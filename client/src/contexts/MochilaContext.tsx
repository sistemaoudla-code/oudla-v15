import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import Cookies from "js-cookie";

export interface MochilaItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  color?: {
    name: string;
    hex: string;
  };
  size?: string;
  fabric?: {
    name: string;
    price: number;
  };
  image: string;
  quantity: number;
  printPosition?: "frente" | "costas";
}

interface MochilaContextType {
  items: MochilaItem[];
  addItem: (item: Omit<MochilaItem, "id" | "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearAll: () => void;
  getTotalPrice: () => number;
  totalItems: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  appliedCoupon: string | null;
  setAppliedCoupon: (coupon: string | null, discount?: number) => void;
  appliedDiscount: number | null;
  isFreeShippingActive: boolean;
  setIsFreeShippingActive: (active: boolean) => void;
  shippingPrice: number;
  setShippingPrice: (price: number) => void;
  zipCode: string | null;
  setZipCode: (zip: string | null) => void;
}

const MochilaContext = createContext<MochilaContextType | undefined>(undefined);

const STORAGE_KEY = "oudla_mochila";
const COUPON_KEY = "oudla_coupon";
const DISCOUNT_KEY = "oudla_discount";
const FREE_SHIPPING_KEY = "oudla_free_shipping";
const ZIP_CODE_COOKIE_KEY = "oudla_zip_code";
const ZIP_CODE_KEY = "oudla_zip_code";
const SHIPPING_PRICE_KEY = "oudla_shipping_price";

export function MochilaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MochilaItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCouponState] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [isFreeShippingActive, setIsFreeShippingActiveState] = useState(false);
  const [shippingPrice, setShippingPriceState] = useState(0);
  const [zipCode, setZipCodeState] = useState<string | null>(Cookies.get(ZIP_CODE_COOKIE_KEY) || null);

  useEffect(() => {
    const loadMochila = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedItems: MochilaItem[] = JSON.parse(stored);
          setItems(parsedItems);
        }

        const storedCoupon = localStorage.getItem(COUPON_KEY);
        if (storedCoupon) setAppliedCouponState(storedCoupon);

        const storedDiscount = localStorage.getItem(DISCOUNT_KEY);
        if (storedDiscount) setAppliedDiscount(Number(storedDiscount));

        const storedFreeShipping = localStorage.getItem(FREE_SHIPPING_KEY);
        if (storedFreeShipping) setIsFreeShippingActiveState(storedFreeShipping === "true");

        // Prefer cookie for zipCode, fallback to localStorage if needed
        const cookieZip = Cookies.get(ZIP_CODE_COOKIE_KEY);
        const storedZip = localStorage.getItem(ZIP_CODE_KEY);
        const finalZip = cookieZip || storedZip;
        if (finalZip) setZipCodeState(finalZip);

        const storedPrice = localStorage.getItem(SHIPPING_PRICE_KEY);
        if (storedPrice) setShippingPriceState(Number(storedPrice));
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error("Erro ao parsear mochila, dados corrompidos:", error);
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (e) {
            console.error("Não foi possível limpar dados corrompidos:", e);
          }
        } else if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error("localStorage cheio, não foi possível carregar mochila");
        } else {
          console.error("Erro ao carregar mochila:", error);
        }
      }
    };

    loadMochila();
  }, []);

  const setZipCode = useCallback((zip: string | null) => {
    setZipCodeState(zip);
    if (zip) {
      localStorage.setItem(ZIP_CODE_KEY, zip);
      Cookies.set(ZIP_CODE_COOKIE_KEY, zip, { expires: 365 }); // Store for 1 year
    } else {
      localStorage.removeItem(ZIP_CODE_KEY);
      Cookies.remove(ZIP_CODE_COOKIE_KEY);
    }
  }, []);

  const setShippingPrice = useCallback((price: number) => {
    setShippingPriceState(price);
    localStorage.setItem(SHIPPING_PRICE_KEY, String(price));
  }, []);

  const setAppliedCoupon = useCallback((coupon: string | null, discount?: number) => {
    setAppliedCouponState(coupon);
    if (coupon) {
      localStorage.setItem(COUPON_KEY, coupon);
      if (discount !== undefined) {
        const discountValue = Number(discount);
        setAppliedDiscount(discountValue);
        localStorage.setItem(DISCOUNT_KEY, String(discountValue));
      } else {
        setAppliedDiscount(null);
        localStorage.removeItem(DISCOUNT_KEY);
      }
      setIsFreeShippingActiveState(false);
      localStorage.removeItem(FREE_SHIPPING_KEY);
    } else {
      localStorage.removeItem(COUPON_KEY);
      setAppliedDiscount(null);
      localStorage.removeItem(DISCOUNT_KEY);
    }
  }, []);

  const setIsFreeShippingActive = useCallback((active: boolean) => {
    setIsFreeShippingActiveState(active);
    if (active) {
      localStorage.setItem(FREE_SHIPPING_KEY, "true");
      setAppliedCouponState(null);
      localStorage.removeItem(COUPON_KEY);
    } else {
      localStorage.removeItem(FREE_SHIPPING_KEY);
    }
  }, []);

  const addItem = useCallback((newItem: Omit<MochilaItem, "id" | "quantity">) => {
    setItems(prev => {
      const existingItemIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.color?.hex === newItem.color?.hex &&
          item.size === newItem.size &&
          item.printPosition === newItem.printPosition
      );

      let updatedItems: MochilaItem[];
      if (existingItemIndex >= 0) {
        updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += 1;
      } else {
        const id = `${newItem.productId}-${newItem.color?.hex || 'no-color'}-${newItem.size || 'no-size'}-${newItem.printPosition || 'default'}-${Date.now()}`;
        updatedItems = [...prev, { ...newItem, id, quantity: 1 }];
      }
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error("localStorage cheio, não foi possível salvar item na mochila");
        } else {
          console.error("Erro ao salvar item na mochila:", error);
        }
      }

      return updatedItems;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const updatedItems = prev.filter((item) => item.id !== id);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error("localStorage cheio, não foi possível atualizar mochila");
        } else {
          console.error("Erro ao atualizar mochila:", error);
        }
      }

      return updatedItems;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => {
        const updatedItems = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
        } catch (error) {
          console.error("Erro ao atualizar mochila:", error);
        }
        return updatedItems;
      });
      return;
    }
    
    setItems(prev => {
      const updatedItems = prev.map((item) => (item.id === id ? { ...item, quantity } : item));
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error("localStorage cheio, não foi possível atualizar quantidade");
        } else {
          console.error("Erro ao atualizar quantidade:", error);
        }
      }

      return updatedItems;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setAppliedCouponState(null);
    setAppliedDiscount(null);
    setIsFreeShippingActiveState(false);
    setShippingPriceState(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COUPON_KEY);
      localStorage.removeItem(DISCOUNT_KEY);
      localStorage.removeItem(FREE_SHIPPING_KEY);
      localStorage.removeItem(SHIPPING_PRICE_KEY);
    } catch (e) {
      console.error("Erro ao limpar mochila:", e);
    }
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const contextValue = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearAll,
    getTotalPrice,
    totalItems,
    isDrawerOpen,
    setIsDrawerOpen,
    appliedCoupon,
    setAppliedCoupon,
    appliedDiscount,
    isFreeShippingActive,
    setIsFreeShippingActive,
    shippingPrice,
    setShippingPrice,
    zipCode,
    setZipCode,
  }), [items, addItem, removeItem, updateQuantity, clearAll, getTotalPrice, totalItems, isDrawerOpen, appliedCoupon, setAppliedCoupon, appliedDiscount, isFreeShippingActive, setIsFreeShippingActive, shippingPrice, setShippingPrice, zipCode, setZipCode]);

  return (
    <MochilaContext.Provider value={contextValue}>
      {children}
    </MochilaContext.Provider>
  );
}

export function useMochila() {
  const context = useContext(MochilaContext);
  if (context === undefined) {
    throw new Error("useMochila must be used within a MochilaProvider");
  }
  return context;
}
