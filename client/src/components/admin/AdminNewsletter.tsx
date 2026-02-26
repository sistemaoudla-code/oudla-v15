import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNewsletterSettingsSchema, type NewsletterSubscriber, type NewsletterSettings } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminSave } from "@/contexts/AdminSaveContext";
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Download, Trash2 } from "lucide-react";

export default function AdminNewsletter() {
  const { toast } = useToast();
  const [deletingSubscriber, setDeletingSubscriber] = useState<string | null>(null);

  const { data: subscribers, isLoading: loadingSubscribers } = useQuery<{ subscribers: NewsletterSubscriber[] }>({
    queryKey: ["/api/admin/newsletter/subscribers"],
  });

  const { data: settings, isLoading: loadingSettings } = useQuery<NewsletterSettings>({
    queryKey: ["/api/newsletter/settings"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/newsletter/subscribers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/subscribers"] });
      toast({ title: "inscrito removido" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertNewsletterSettingsSchema),
    defaultValues: {
      title: "",
      description: "",
      buttonText: "",
      disclaimerText: "",
    },
  });

  const settingsLoaded = useState(false);
  if (settings && !settingsLoaded[0]) {
    form.reset(settings);
    settingsLoaded[1](true);
  }

  const updateSettingsMutation = useMutation({
    mutationFn: async (values: Partial<NewsletterSettings>) => {
      const res = await apiRequest("PATCH", "/api/admin/newsletter/settings", values);
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        form.reset(data);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/settings"] });
    },
  });

  const handleSaveAll = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      toast({ title: "erro", description: "corrija os campos inválidos.", variant: "destructive" });
      return;
    }
    try {
      const values = form.getValues();
      await updateSettingsMutation.mutateAsync(values);
      toast({ title: "sucesso!", description: "configurações da newsletter atualizadas." });
    } catch {
      toast({ title: "erro", description: "falha ao salvar configurações.", variant: "destructive" });
    }
  }, [form, updateSettingsMutation, toast]);

  useAdminSave(handleSaveAll);

  const exportEmailsOnly = () => {
    if (!subscribers?.subscribers.length) return;
    
    const emails = subscribers.subscribers.map(s => s.email).join("\n");
    const blob = new Blob([emails], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `emails_newsletter_${format(new Date(), "yyyy-MM-dd")}.txt`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
    if (!subscribers?.subscribers.length) return;
    
    const headers = ["Email", "IP", "Data", "Hora"];
    const rows = subscribers.subscribers.map(s => {
      const date = new Date(s.createdAt!);
      return [
        s.email,
        s.ipAddress,
        format(date, "dd/MM/yyyy"),
        format(date, "HH:mm")
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `newsletter_subscribers_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingSubscribers || loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium lowercase">configurações do convite</h2>
        </div>
        
        <Form {...form}>
          <form 
            onSubmit={(e) => e.preventDefault()}
            className="grid gap-6 max-w-2xl"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="lowercase">título do cta</FormLabel>
                  <FormControl>
                    <Input {...field} className="lowercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="lowercase">descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="lowercase min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buttonText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="lowercase">texto do botão</FormLabel>
                  <FormControl>
                    <Input {...field} className="lowercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="disclaimerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="lowercase">texto de aviso (spam)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} className="lowercase" placeholder="ex: sem spam. cancele quando quiser." />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground/50 lowercase">deixe vazio para não exibir</p>
                  <FormMessage />
                </FormItem>
              )}
            />

          </form>
        </Form>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-medium lowercase">inscritos ({subscribers?.subscribers.length || 0})</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportEmailsOnly}
              className="lowercase gap-2 w-full sm:w-auto"
              disabled={!subscribers?.subscribers.length}
            >
              <Download className="h-4 w-4" />
              apenas e-mails (.txt)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportCSV}
              className="lowercase gap-2 w-full sm:w-auto"
              disabled={!subscribers?.subscribers.length}
            >
              <Download className="h-4 w-4" />
              relatório completo (.csv)
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="lowercase whitespace-nowrap px-4">e-mail</TableHead>
                    <TableHead className="hidden md:table-cell lowercase whitespace-nowrap px-4">ip</TableHead>
                    <TableHead className="lowercase whitespace-nowrap px-4">data</TableHead>
                    <TableHead className="lowercase whitespace-nowrap w-[80px] px-4 text-right">ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers?.subscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium px-4">
                        <div className="max-w-[140px] sm:max-w-[200px] truncate" title={subscriber.email}>
                          {subscriber.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs whitespace-nowrap px-4">
                        {subscriber.ipAddress}
                      </TableCell>
                      <TableCell className="lowercase whitespace-nowrap px-4 text-xs">
                        {format(new Date(subscriber.createdAt!), "dd/MM/yy")}
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeletingSubscriber(subscriber.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subscribers?.subscribers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="md:table-cell md:col-span-5 text-center py-8 text-muted-foreground lowercase">
                        nenhum inscrito ainda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      <AlertDialog open={!!deletingSubscriber} onOpenChange={() => setDeletingSubscriber(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="lowercase">deletar inscrito?</AlertDialogTitle>
            <AlertDialogDescription className="lowercase">
              essa ação não pode ser desfeita. o inscrito será removido permanentemente da lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="lowercase">cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground lowercase"
              onClick={() => {
                if (deletingSubscriber) {
                  deleteMutation.mutate(deletingSubscriber);
                  setDeletingSubscriber(null);
                }
              }}
            >
              deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
