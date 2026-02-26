import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Ruler } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductMeasurementField, ProductSizeMeasurement } from "@shared/schema";

interface SizeChartEditorProps {
  productId: string;
  selectedSizes: string[];
}

interface MeasurementData {
  [sizeName: string]: {
    [fieldId: string]: string;
  };
}

export default function SizeChartEditor({ productId, selectedSizes }: SizeChartEditorProps) {
  const { toast } = useToast();
  const [newFieldName, setNewFieldName] = useState("");
  const [measurementData, setMeasurementData] = useState<MeasurementData>({});

  const { data: fieldsData, isLoading: loadingFields } = useQuery<{ fields: ProductMeasurementField[] }>({
    queryKey: ['/api/admin/products', productId, 'measurement-fields'],
  });

  const { data: measurementsData, isLoading: loadingMeasurements } = useQuery<{ measurements: ProductSizeMeasurement[] }>({
    queryKey: ['/api/admin/products', productId, 'size-measurements'],
  });

  const fields = fieldsData?.fields || [];
  const measurements = measurementsData?.measurements || [];

  useEffect(() => {
    if (!fields.length || !selectedSizes.length) return;
    
    const data: MeasurementData = {};
    selectedSizes.forEach(size => {
      data[size] = {};
      fields.forEach(field => {
        const measurement = measurements.find(m => m.sizeName === size && m.fieldId === field.id);
        data[size][field.id] = measurement?.value || "";
      });
    });
    setMeasurementData(data);
  }, [selectedSizes, fields.length, measurements.length]);

  const createFieldMutation = useMutation({
    mutationFn: async (fieldName: string) => {
      const response = await apiRequest("POST", `/api/admin/products/${productId}/measurement-fields`, {
        fieldName,
        sortOrder: fields.length,
      });
      if (!response.ok) throw new Error("erro ao criar campo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId, 'measurement-fields'] });
      setNewFieldName("");
      toast({ title: "campo criado", description: "o campo de medida foi adicionado." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "erro", description: "não foi possível criar o campo." });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/measurement-fields/${fieldId}`);
      if (!response.ok) throw new Error("erro ao deletar campo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId, 'measurement-fields'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId, 'size-measurements'] });
      toast({ title: "campo removido", description: "o campo foi deletado com sucesso." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "erro", description: "não foi possível deletar o campo." });
    },
  });

  const saveMeasurementMutation = useMutation({
    mutationFn: async ({ sizeName, fieldId, value }: { sizeName: string; fieldId: string; value: string }) => {
      const response = await apiRequest("POST", `/api/admin/products/${productId}/size-measurements`, {
        sizeName,
        fieldId,
        value,
      });
      if (!response.ok) throw new Error("erro ao salvar medida");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId, 'size-measurements'] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "erro", description: "não foi possível salvar a medida." });
    },
  });

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    createFieldMutation.mutate(newFieldName.trim());
  };

  const handleMeasurementChange = (sizeName: string, fieldId: string, value: string) => {
    setMeasurementData(prev => ({
      ...prev,
      [sizeName]: {
        ...prev[sizeName],
        [fieldId]: value,
      },
    }));
  };

  const handleMeasurementBlur = (sizeName: string, fieldId: string) => {
    const value = measurementData[sizeName]?.[fieldId];
    if (value !== undefined) {
      saveMeasurementMutation.mutate({ sizeName, fieldId, value });
    }
  };

  if (loadingFields || loadingMeasurements) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-muted-foreground/60 lowercase">carregando medidas...</p>
      </div>
    );
  }

  if (selectedSizes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Ruler className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <p className="text-xs text-muted-foreground/60 lowercase text-center">
          ative e adicione tamanhos para configurar a tabela de medidas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Input
          placeholder="ex: largura, altura, manga..."
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddField())}
          className="flex-1 border-0 bg-muted/50 rounded-xl h-11 px-4 text-sm focus-visible:ring-1 lowercase"
          data-testid="input-new-measurement-field"
        />
        <Button
          type="button"
          onClick={handleAddField}
          disabled={!newFieldName.trim() || createFieldMutation.isPending}
          className="flex-shrink-0 rounded-xl h-11 px-5 lowercase gap-2"
          data-testid="button-add-measurement-field"
        >
          <Plus className="h-4 w-4" />
          adicionar
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted/50 group"
              data-testid={`badge-field-${field.id}`}
            >
              <span className="text-sm lowercase">{field.fieldName}</span>
              <button
                type="button"
                onClick={() => deleteFieldMutation.mutate(field.id)}
                className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5 rounded-full invisible group-hover:visible"
                data-testid={`button-delete-field-${field.id}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {fields.length > 0 && selectedSizes.length > 0 && (
        <div className="space-y-4">
          <div className="hidden sm:block rounded-2xl bg-muted/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium lowercase text-muted-foreground/70 bg-muted/50">
                      tamanho
                    </th>
                    {fields.map((field) => (
                      <th
                        key={field.id}
                        className="text-left px-4 py-3 text-xs font-medium lowercase text-muted-foreground/70 bg-muted/50"
                      >
                        {field.fieldName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedSizes.map((size, sizeIdx) => (
                    <tr
                      key={size}
                      className={sizeIdx < selectedSizes.length - 1 ? "border-b border-border/20" : ""}
                    >
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium uppercase tracking-wider" data-testid={`badge-size-${size}`}>
                          {size}
                        </span>
                      </td>
                      {fields.map((field) => (
                        <td key={field.id} className="px-3 py-2">
                          <Input
                            value={measurementData[size]?.[field.id] || ""}
                            onChange={(e) => handleMeasurementChange(size, field.id, e.target.value)}
                            onBlur={() => handleMeasurementBlur(size, field.id)}
                            placeholder="--"
                            className="h-9 border-0 bg-background/60 rounded-lg px-3 text-sm text-center focus-visible:ring-1 w-20"
                            data-testid={`input-measurement-${size}-${field.id}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden space-y-2">
            {selectedSizes.map((size) => (
              <div key={size} className="rounded-xl bg-muted/30 overflow-hidden">
                <div className="px-4 py-3 bg-muted/50">
                  <span className="text-sm font-medium uppercase tracking-wider" data-testid={`badge-size-${size}`}>
                    {size}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <span className="text-xs lowercase text-muted-foreground min-w-[80px] flex-shrink-0">
                        {field.fieldName}
                      </span>
                      <Input
                        value={measurementData[size]?.[field.id] || ""}
                        onChange={(e) => handleMeasurementChange(size, field.id, e.target.value)}
                        onBlur={() => handleMeasurementBlur(size, field.id)}
                        placeholder="--"
                        className="h-9 border-0 bg-background/60 rounded-lg px-3 text-sm flex-1 focus-visible:ring-1"
                        data-testid={`input-measurement-${size}-${field.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground/50 lowercase text-center">
            valores salvos automaticamente ao sair do campo. use cm.
          </p>
        </div>
      )}

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <p className="text-xs text-muted-foreground/50 lowercase">
            ex: largura, altura, manga, comprimento
          </p>
        </div>
      )}
    </div>
  );
}
