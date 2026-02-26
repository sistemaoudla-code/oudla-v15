import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ruler } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import type { ProductMeasurementField, ProductSizeMeasurement } from "@shared/schema";

interface SizeChartModalProps {
  productId: string;
  productName: string;
  sizeChartImage?: string | null;
  sizeChartEnabled?: boolean;
  activeSizes?: Array<{ name: string; available: boolean }>;
  trigger?: React.ReactNode;
}

interface MeasurementsResponse {
  fields: ProductMeasurementField[];
  measurements: ProductSizeMeasurement[];
}

const MAX_SELECTED = 3;

export default function SizeChartModal({ 
  productId, 
  productName, 
  sizeChartImage,
  sizeChartEnabled,
  activeSizes = [],
  trigger
}: SizeChartModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const { data, isLoading } = useQuery<MeasurementsResponse>({
    queryKey: ['/api/products', productId, 'measurements'],
    enabled: !!sizeChartEnabled,
  });

  const fields = data?.fields || [];
  const measurements = data?.measurements || [];

  const activeSizeNames = activeSizes.map(s => s.name);
  const availableSizes = Array.from(new Set(measurements.map(m => m.sizeName))).filter(
    size => activeSizeNames.length === 0 || activeSizeNames.includes(size)
  );

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      }
      if (prev.length >= MAX_SELECTED) {
        return [...prev.slice(1), size];
      }
      return [...prev, size];
    });
  };

  const getMeasurementValue = (sizeName: string, fieldId: string) => {
    const measurement = measurements.find(m => m.sizeName === sizeName && m.fieldId === fieldId);
    return measurement?.value || "—";
  };

  const hasCustomFields = fields.length > 0 && measurements.length > 0;
  const hasImage = sizeChartImage;
  const showButton = sizeChartEnabled && (hasCustomFields || hasImage);

  if (!showButton) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="lowercase gap-2"
            data-testid="button-open-size-chart"
          >
            <Ruler className="h-4 w-4" />
            tabela de medidas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="[&>button]:hidden max-w-2xl w-[95vw] sm:w-full p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-5 sm:p-8 pb-0">
          <DialogTitle className="text-xl sm:text-2xl font-light tracking-tight lowercase">
            guia de tamanhos
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground lowercase mt-1">
            {productName}
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 sm:p-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
            {hasCustomFields && (
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground lowercase mb-3">
                    selecione até {MAX_SELECTED} tamanhos para comparar
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                    {availableSizes.map((size, index) => {
                      const isSelected = selectedSizes.includes(size);
                      const selectionIndex = selectedSizes.indexOf(size);
                      return (
                        <motion.button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`relative aspect-square rounded-2xl border-2 transition-all duration-300 flex items-center justify-center ${
                            isSelected 
                              ? 'border-foreground bg-foreground text-background shadow-lg' 
                              : 'border-border hover-elevate hover:border-foreground/50'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          data-testid={`button-size-chart-${size}`}
                        >
                          <span className="text-base font-medium lowercase">{size}</span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-background text-foreground rounded-full text-xs font-bold flex items-center justify-center border-2 border-foreground">
                              {selectionIndex + 1}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {selectedSizes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                      <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border/50">
                                <th className="text-left py-2 sm:py-3 pr-4 text-xs sm:text-sm font-medium text-muted-foreground lowercase">
                                  medida
                                </th>
                                {selectedSizes.map((size, idx) => (
                                  <th 
                                    key={size} 
                                    className="text-center py-2 sm:py-3 px-2 sm:px-4 min-w-[70px] sm:min-w-[90px]"
                                  >
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                                      className="inline-flex items-center gap-1 sm:gap-2 bg-foreground text-background px-2 sm:px-3 py-1 rounded-full"
                                    >
                                      <span className="text-xs sm:text-sm font-medium lowercase">{size}</span>
                                    </motion.div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {fields.map((field, fieldIndex) => (
                                <motion.tr
                                  key={field.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: fieldIndex * 0.03 }}
                                  className="border-b border-border/30 last:border-0"
                                >
                                  <td className="py-2 sm:py-3 pr-4 text-xs sm:text-sm text-muted-foreground lowercase">
                                    {field.fieldName}
                                  </td>
                                  {selectedSizes.map((size) => (
                                    <td 
                                      key={size} 
                                      className="text-center py-2 sm:py-3 px-2 sm:px-4 text-sm sm:text-base font-medium"
                                    >
                                      {getMeasurementValue(size, field.id)}
                                    </td>
                                  ))}
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  </motion.div>
                )}

                {selectedSizes.length === 0 && (
                  <motion.p 
                    className="text-center text-xs sm:text-sm text-muted-foreground lowercase py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    toque nos tamanhos acima para comparar
                  </motion.p>
                )}
              </div>
            )}

            {hasImage && (
              <motion.div 
                className="space-y-3 sm:space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: hasCustomFields ? 0.2 : 0 }}
              >
                {hasCustomFields && (
                  <div className="pt-3 sm:pt-4 border-t">
                    <p className="text-xs sm:text-sm font-medium lowercase text-muted-foreground">
                      referência visual
                    </p>
                  </div>
                )}
                <div className="rounded-xl sm:rounded-2xl overflow-hidden">
                  <img
                    src={sizeChartImage}
                    alt={`Tabela de medidas - ${productName}`}
                    className="w-full h-auto"
                    data-testid="img-size-chart"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </motion.div>
            )}

            <div className="pt-8 sm:pt-12 pb-4">
              <Button 
                onClick={() => setOpen(false)}
                className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base font-medium lowercase transition-all duration-300 active:scale-[0.98]"
              >
                fechar guia
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
