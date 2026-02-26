import { cn } from "@/lib/utils";

interface ColorOption {
  name: string;
  value: string;
  hex: string;
}

interface ColorSelectorProps {
  colors: ColorOption[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

export default function ColorSelector({ 
  colors, 
  selectedColor, 
  onColorChange,
  className 
}: ColorSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-foreground">
        cor: {colors.find(c => c.value === selectedColor)?.name || selectedColor}
      </label>
      
      <div className="flex gap-3">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className={cn(
              "w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
              selectedColor === color.value 
                ? "border-foreground shadow-lg" 
                : "border-border hover:border-muted-foreground"
            )}
            style={{ backgroundColor: color.hex }}
            data-testid={`button-color-${color.value}`}
            title={color.name}
          >
            <span className="sr-only">{color.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}