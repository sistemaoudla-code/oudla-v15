import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SiteSetting } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    type: "text",
  });

  const { data: settingsData } = useQuery<{ settings: SiteSetting[] }>({
    queryKey: ['/api/admin/settings'],
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setFormData({ key: "", value: "", type: "text" });
      toast({ title: "Configuração atualizada com sucesso!" });
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
          <CardTitle className="lowercase">nova configuração</CardTitle>
          <CardDescription className="lowercase">adicionar ou editar configuração do site</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key" className="lowercase">chave</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="ex: primary_color"
                required
                data-testid="input-setting-key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value" className="lowercase">valor</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Digite o valor..."
                required
                data-testid="input-setting-value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="lowercase">tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger data-testid="select-setting-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="color">Cor</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="lowercase w-full sm:w-auto" disabled={upsertMutation.isPending} data-testid="button-save-setting">
              salvar configuração
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-base font-medium lowercase px-1">configurações atuais</h3>
        {settingsData?.settings && settingsData.settings.length > 0 ? (
          <div className="space-y-3">
            {settingsData.settings.map((setting) => (
              <Card key={setting.id}>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium lowercase truncate">{setting.key}</h4>
                      <span className="text-xs text-muted-foreground lowercase flex-shrink-0">{setting.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{setting.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground lowercase">nenhuma configuração cadastrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
