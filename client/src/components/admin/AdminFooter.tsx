import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminSave } from "@/contexts/AdminSaveContext";
import AdminFAQ from "./AdminFAQ";
import AdminCompanyInfo from "./AdminCompanyInfo";

const footerPages = [
  { slug: "company", title: "Informações da Empresa" },
  { slug: "faq", title: "FAQ" },
  { slug: "about", title: "Sobre Nós" },
  { slug: "policies", title: "Políticas" },
  { slug: "returns", title: "Trocas e Devoluções" },
  { slug: "shipping", title: "Frete e Entrega" },
  { slug: "privacy", title: "Privacidade" },
];

export default function AdminFooter() {
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState("company");
  const [formData, setFormData] = useState({ title: "", content: "", description: "" });
  const { data: pageData, isLoading } = useQuery<{
    id: string;
    slug: string;
    title: string;
    content: string;
    description: string;
  }>({
    queryKey: ['/api/footer-page', selectedPage],
    enabled: selectedPage !== "company" && selectedPage !== "faq",
  });

  useEffect(() => {
    if (pageData) {
      setFormData({
        title: pageData.title,
        content: pageData.content,
        description: pageData.description || "",
      });
    }
  }, [pageData]);

  const handleSave = useCallback(async () => {
    if (selectedPage === "company" || selectedPage === "faq") {
      return;
    }
    try {
      await apiRequest("POST", `/api/footer-page/${selectedPage}`, {
        ...formData,
      });
      
      toast({
        title: "salvo com sucesso",
        description: `página "${formData.title}" atualizada`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/footer-page', selectedPage] });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "erro ao salvar",
        description: "tente novamente",
        variant: "destructive",
      });
    }
  }, [selectedPage, formData, toast]);

  const showSave = selectedPage !== "company" && selectedPage !== "faq";
  useAdminSave(showSave ? handleSave : null);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="text-sm font-medium lowercase">selecione uma página</label>
        <Select value={selectedPage} onValueChange={setSelectedPage}>
          <SelectTrigger className="w-full lowercase" data-testid="select-footer-page">
            <SelectValue className="lowercase" />
          </SelectTrigger>
          <SelectContent className="z-50">
            {footerPages.map((page) => (
              <SelectItem key={page.slug} value={page.slug} className="lowercase">
                {page.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPage === "faq" ? (
        <AdminFAQ />
      ) : selectedPage === "company" ? (
        <AdminCompanyInfo />
      ) : (
        <Card className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-64 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium lowercase">título</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="título da página"
                  data-testid="input-footer-title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium lowercase">meta descrição (opcional)</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="descrição para SEO"
                  data-testid="input-footer-description"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium lowercase">conteúdo (HTML permitido)</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Digite o conteúdo da página... HTML permitido"
                  className="min-h-96 font-mono text-sm"
                  data-testid="textarea-footer-content"
                />
                <p className="text-xs text-muted-foreground lowercase">
                  Você pode usar HTML básico: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc.
                </p>
              </div>

            </>
          )}
        </Card>
      )}
    </div>
  );
}
