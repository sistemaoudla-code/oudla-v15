import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CompanyInfo {
  id: string;
  companyName: string;
  cnpj: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  copyrightYear: number;
}

export default function AdminCompanyInfo() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: "",
    cnpj: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    copyrightYear: new Date().getFullYear(),
  });

  const { data: companyData, isLoading } = useQuery<{ company: CompanyInfo | null }>({
    queryKey: ['/api/admin/company-info'],
  });

  useEffect(() => {
    if (companyData?.company) {
      setFormData({
        companyName: companyData.company.companyName,
        cnpj: companyData.company.cnpj,
        street: companyData.company.street,
        number: companyData.company.number,
        complement: companyData.company.complement || "",
        neighborhood: companyData.company.neighborhood,
        city: companyData.company.city,
        state: companyData.company.state,
        zipCode: companyData.company.zipCode,
        phone: companyData.company.phone || "",
        email: companyData.company.email || "",
        copyrightYear: companyData.company.copyrightYear,
      });
    }
  }, [companyData]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/company-info", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company-info'] });
      toast({
        title: "salvo com sucesso",
        description: "informações da empresa atualizadas",
      });
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast({
        title: "erro ao salvar",
        description: error?.message || "tente novamente",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light lowercase mb-2">informações da empresa</h1>
        <p className="text-sm sm:text-base text-muted-foreground lowercase">gerencie dados da empresa para o rodapé</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="lowercase">nome da empresa (opcional)</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="ex: Oudla Ltda"
                  data-testid="input-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj" className="lowercase">cnpj (opcional)</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="ex: 12.345.678/0001-90"
                  data-testid="input-cnpj"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street" className="lowercase">rua (opcional)</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="ex: Rua das Flores"
                data-testid="input-street"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number" className="lowercase">número (opcional)</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="ex: 123"
                  data-testid="input-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement" className="lowercase">complemento (opcional)</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="ex: Apto 10"
                  data-testid="input-complement"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="lowercase">bairro (opcional)</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="ex: Centro"
                data-testid="input-neighborhood"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="lowercase">cidade (opcional)</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="ex: São Paulo"
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="lowercase">estado (opcional)</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="ex: SP"
                  maxLength={2}
                  data-testid="input-state"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode" className="lowercase">cep (opcional)</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="ex: 01310-100"
                data-testid="input-zipcode"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="lowercase">telefone (opcional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="ex: (11) 3000-0000"
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="lowercase">email de suporte / sac (exibido no rodapé)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ex: sac@oudla.com"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copyrightYear" className="lowercase">ano de copyright</Label>
              <Input
                id="copyrightYear"
                type="number"
                value={formData.copyrightYear}
                onChange={(e) => setFormData({ ...formData, copyrightYear: parseInt(e.target.value) })}
                data-testid="input-copyright-year"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateMutation.isPending || isLoading}
            className="w-full sm:w-auto lowercase"
            data-testid="button-save-company"
          >
            {updateMutation.isPending ? "salvando..." : "salvar informações"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
