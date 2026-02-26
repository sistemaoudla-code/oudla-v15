import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminSave } from "@/contexts/AdminSaveContext";

export default function AdminVerses() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    text: "",
    reference: "",
  });

  const { data: verseData, isLoading } = useQuery<{ verse: { id: string, text: string, reference: string } | null }>({
    queryKey: ['/api/verse'],
  });

  useEffect(() => {
    if (verseData?.verse) {
      setFormData({
        text: verseData.verse.text,
        reference: verseData.verse.reference,
      });
    }
  }, [verseData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/verse", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/verse'] });
      queryClient.invalidateQueries({ queryKey: ['/api/verses'] });
    },
  });

  const handleSaveAll = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(formData);
      toast({ 
        title: "Versículo atualizado",
        description: "O versículo do dia foi atualizado com sucesso!" 
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o versículo.",
      });
    }
  }, [formData, saveMutation, toast]);

  useAdminSave(handleSaveAll);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light lowercase mb-2">versículo do dia</h1>
          <p className="text-muted-foreground lowercase">carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light lowercase mb-2">versículo do dia</h1>
        <p className="text-muted-foreground lowercase">edite o versículo que aparece na página inicial</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="lowercase">editar versículo</CardTitle>
          <CardDescription className="lowercase">este versículo será exibido na página inicial do site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text" className="lowercase">texto do versículo</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Digite o texto do versículo..."
                rows={5}
                data-testid="input-verse-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference" className="lowercase">referência</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="ex: joão 3:16"
                data-testid="input-verse-reference"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
