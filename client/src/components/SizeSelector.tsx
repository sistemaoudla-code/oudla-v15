import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SizeOption {
  value: string;
  label: string;
  available: boolean;
  measurements?: {
    chest: string;
    length: string;
  };
}

interface SizeSelectorProps {
  sizes: SizeOption[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
  onSizeGuide?: () => void;
  className?: string;
}

export default function SizeSelector({ 
  sizes, 
  selectedSize, 
  onSizeChange, 
  onSizeGuide,
  className 
}: SizeSelectorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          tamanho: {selectedSize || 'selecione'}
        </label>
        {onSizeGuide && (
          <button
            onClick={onSizeGuide}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-current"
            data-testid="button-size-guide"
          >
            guia de medidas
          </button>
        )}
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {sizes.map((size) => (
          <Button
            key={size.value}
            variant={selectedSize === size.value ? "default" : "outline"}
            size="sm"
            onClick={() => size.available && onSizeChange(size.value)}
            disabled={!size.available}
            className={cn(
              "relative min-w-[3rem]",
              !size.available && "opacity-50 cursor-not-allowed"
            )}
            data-testid={`button-size-${size.value}`}
          >
            {size.label}
            {!size.available && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-muted-foreground transform rotate-45" />
              </div>
            )}
          </Button>
        ))}
      </div>
      
      {selectedSize && (
        <div className="text-xs text-muted-foreground">
          {sizes.find(s => s.value === selectedSize)?.measurements && (
            <div className="space-y-1">
              <div>peito: {sizes.find(s => s.value === selectedSize)?.measurements?.chest}</div>
              <div>comprimento: {sizes.find(s => s.value === selectedSize)?.measurements?.length}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}