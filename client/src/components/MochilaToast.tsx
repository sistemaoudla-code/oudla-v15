import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MochilaItem } from "@/contexts/MochilaContext";

interface MochilaToastProps {
  item: MochilaItem | null;
  isVisible: boolean;
  onClose: () => void;
  onOpenDrawer: () => void;
}

export default function MochilaToast({ item, isVisible, onClose, onOpenDrawer }: MochilaToastProps) {
  if (!item) return null;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleToastClick = () => {
    onOpenDrawer();
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.6, right: 0.6 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 30) {
              onClose();
            }
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] touch-none"
          data-testid="toast-mochila"
        >
          <div 
            className="bg-background border rounded-lg shadow-lg p-6 flex gap-4 items-start relative cursor-pointer hover-elevate"
            onClick={handleToastClick}
          >
            <div className="flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium lowercase mb-2">adicionado na mochila</p>
              <div className="flex-1 min-w-0">
                <p className="text-sm lowercase truncate font-medium mb-1">{item.name}</p>
                <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                  <span className="text-sm text-muted-foreground">{formatPrice(item.price)}</span>
                  {item.color && (
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: item.color.hex }}
                    />
                  )}
                  {item.size && (
                    <span className="text-sm uppercase font-medium">{item.size}</span>
                  )}
                  {item.printPosition && (
                    <span className="text-xs text-muted-foreground lowercase">
                      {item.printPosition}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-6 w-6 absolute -top-1 -right-1"
              data-testid="button-close-toast"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
