import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoveUp,
  MoveDown,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

const categoryLabels: Record<string, string> = {
  geral: "Geral",
  envio: "Envio",
  produto: "Produto",
  pagamento: "Pagamento",
  devolucao: "Devolução",
};

export default function AdminFAQ() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<Faq | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "geral",
    sortOrder: 0,
    isActive: true,
  });

  const { data: faqsData, isLoading } = useQuery<{ faqs: Faq[] }>({
    queryKey: ['/api/admin/faqs'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/faqs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({ 
        title: "FAQ criado",
        description: "A pergunta foi adicionada com sucesso!" 
      });
      setShowForm(false);
      setFormData({
        question: "",
        answer: "",
        category: "geral",
        sortOrder: 0,
        isActive: true,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o FAQ.",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/admin/faqs/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({ 
        title: "FAQ atualizado",
        description: "A pergunta foi atualizada com sucesso!" 
      });
      setShowForm(false);
      setEditingFaq(null);
      setFormData({
        question: "",
        answer: "",
        category: "geral",
        sortOrder: 0,
        isActive: true,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o FAQ.",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/faqs/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({ 
        title: "FAQ deletado",
        description: "A pergunta foi removida com sucesso!" 
      });
      setDeletingFaq(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível deletar o FAQ.",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
    });
  };

  const handleCancelEdit = () => {
    setEditingFaq(null);
    setFormData({
      question: "",
      answer: "",
      category: "geral",
      sortOrder: 0,
      isActive: true,
    });
  };

  const handleToggleActive = (faq: Faq) => {
    updateMutation.mutate({ 
      id: faq.id, 
      data: { isActive: !faq.isActive } 
    });
  };

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sortOrder: number }[]) => {
      const responses = await Promise.all(
        updates.map(async ({ id, sortOrder }) => {
          const response = await apiRequest("PATCH", `/api/admin/faqs/${id}`, { sortOrder });
          if (!response.ok) {
            throw new Error(`Failed to update FAQ ${id}`);
          }
          return response.json();
        })
      );
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({
        title: "Ordem atualizada",
        description: "A ordem dos FAQs foi alterada com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reordenar os FAQs.",
      });
    }
  });

  const handleMoveUp = (faq: Faq, categoryFaqs: Faq[], localIndex: number) => {
    if (localIndex === 0) return;
    const prevFaq = categoryFaqs[localIndex - 1];
    
    reorderMutation.mutate([
      { id: faq.id, sortOrder: prevFaq.sortOrder },
      { id: prevFaq.id, sortOrder: faq.sortOrder }
    ]);
  };

  const handleMoveDown = (faq: Faq, categoryFaqs: Faq[], localIndex: number) => {
    if (localIndex === categoryFaqs.length - 1) return;
    const nextFaq = categoryFaqs[localIndex + 1];
    
    reorderMutation.mutate([
      { id: faq.id, sortOrder: nextFaq.sortOrder },
      { id: nextFaq.id, sortOrder: faq.sortOrder }
    ]);
  };

  const faqs = faqsData?.faqs || [];
  const groupedFaqs = faqs.reduce((acc: Record<string, Faq[]>, faq: Faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, Faq[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light lowercase mb-2">dúvidas frequentes</h1>
          <p className="text-sm sm:text-base text-muted-foreground lowercase">gerencie as perguntas frequentes da loja</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          data-testid="button-add-faq"
          className="lowercase w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          adicionar pergunta
        </Button>
      </div>

      {showForm && !editingFaq && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="question" className="lowercase">pergunta</Label>
                  <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Digite a pergunta..."
                    required
                    data-testid="input-faq-question"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer" className="lowercase">resposta</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Digite a resposta..."
                    required
                    rows={5}
                    data-testid="input-faq-answer"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="lowercase">categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category" data-testid="select-faq-category">
                        <SelectValue placeholder="selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sortOrder" className="lowercase">ordem</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      min="0"
                      data-testid="input-faq-sort-order"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="submit" 
                  className="lowercase w-full sm:w-auto" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-faq"
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? "salvando..." 
                    : "criar pergunta"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  className="lowercase w-full sm:w-auto"
                >
                  cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingFaq} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="lowercase">editar pergunta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-question" className="lowercase">pergunta</Label>
                <Input
                  id="edit-question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Digite a pergunta..."
                  required
                  data-testid="input-faq-question-edit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-answer" className="lowercase">resposta</Label>
                <Textarea
                  id="edit-answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Digite a resposta..."
                  required
                  rows={5}
                  data-testid="input-faq-answer-edit"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category" className="lowercase">categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="edit-category" data-testid="select-faq-category-edit">
                      <SelectValue placeholder="selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-sortOrder" className="lowercase">ordem</Label>
                  <Input
                    id="edit-sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                    min="0"
                    data-testid="input-faq-sort-order-edit"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelEdit}
                className="lowercase"
              >
                cancelar
              </Button>
              <Button 
                type="submit" 
                className="lowercase" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-faq-edit"
              >
                {updateMutation.isPending ? "salvando..." : "atualizar pergunta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground lowercase">
          carregando...
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="lowercase mb-4">nenhuma pergunta cadastrada ainda</p>
          <Button onClick={() => setShowForm(true)} variant="outline" className="lowercase">
            <Plus className="h-4 w-4 mr-2" />
            adicionar primeira pergunta
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]: [string, Faq[]]) => (
            <div key={category}>
              <h2 className="text-lg sm:text-xl font-medium lowercase mb-4 text-foreground">
                {categoryLabels[category] || category}
              </h2>
              <div className="space-y-4">
                {categoryFaqs.map((faq: Faq, index: number) => (
                  <Card key={faq.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-medium lowercase text-sm sm:text-base break-words">{faq.question}</h3>
                              {!faq.isActive && (
                                <Badge variant="secondary" className="lowercase text-xs">inativo</Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground lowercase break-words">{faq.answer}</p>
                          </div>
                          <div className="flex gap-1 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(faq)}
                              data-testid={`button-toggle-faq-${faq.id}`}
                            >
                              {faq.isActive ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveUp(faq, categoryFaqs, index)}
                              disabled={index === 0 || reorderMutation.isPending}
                              data-testid={`button-move-up-faq-${faq.id}`}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveDown(faq, categoryFaqs, index)}
                              disabled={index === categoryFaqs.length - 1 || reorderMutation.isPending}
                              data-testid={`button-move-down-faq-${faq.id}`}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(faq)}
                              data-testid={`button-edit-faq-${faq.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingFaq(faq)}
                              data-testid={`button-delete-faq-${faq.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingFaq} onOpenChange={() => setDeletingFaq(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="lowercase">confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="lowercase">
              tem certeza que deseja excluir esta pergunta? esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="lowercase">cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingFaq && deleteMutation.mutate(deletingFaq.id)}
              className="lowercase"
            >
              excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
