import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FavoritoToastItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface FavoritoToastProps {
  item: FavoritoToastItem | null;
  isVisible: boolean;
  onClose: () => void;
  onOpenMenu: () => void;
}

export default function FavoritoToast({ item, isVisible, onClose, onOpenMenu }: FavoritoToastProps) {
  if (!item) return null;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleToastClick = () => {
    onOpenMenu();
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.6, right: 0.6 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 30) {
              onClose();
            }
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-20 left-4 z-50 w-72 max-w-[calc(100vw-2rem)] touch-none"
          data-testid="toast-favorito"
        >
          <div
            className="bg-background border rounded-lg shadow-lg p-4 flex gap-3 items-center relative cursor-pointer hover-elevate"
            onClick={handleToastClick}
          >
            <div className="flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-14 h-14 object-cover rounded-lg"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium lowercase truncate">{item.name}</p>
              <span className="text-sm text-muted-foreground">{formatPrice(item.price)}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-6 w-6 absolute -top-1 -right-1"
              data-testid="button-close-toast-favorito"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
