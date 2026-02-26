import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SiteContent } from "@shared/schema";

export default function AdminContent() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    section: "",
  });

  const { data: contentData } = useQuery<{ content: SiteContent[] }>({
    queryKey: ['/api/admin/content'],
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/content", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
      setFormData({ key: "", value: "", section: "" });
      toast({ title: "Conteúdo atualizado com sucesso!" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(formData);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="lowercase">atualizar conteúdo</CardTitle>
          <CardDescription className="lowercase">adicionar ou editar textos do site</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key" className="lowercase">chave</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="ex: newsletter_title"
                required
                data-testid="input-content-key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value" className="lowercase">valor</Label>
              <Textarea
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Digite o texto..."
                required
                rows={4}
                data-testid="input-content-value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section" className="lowercase">seção (opcional)</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="ex: newsletter, footer"
                data-testid="input-content-section"
              />
            </div>

            <Button type="submit" className="lowercase w-full sm:w-auto" disabled={upsertMutation.isPending} data-testid="button-save-content">
              salvar conteúdo
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-base font-medium lowercase px-1">conteúdos cadastrados</h3>
        {contentData?.content && contentData.content.length > 0 ? (
          <div className="space-y-3">
            {contentData.content.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h4 className="font-medium lowercase truncate">{item.key}</h4>
                      {item.section && (
                        <span className="text-xs text-muted-foreground lowercase">{item.section}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground lowercase">nenhum conteúdo cadastrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
