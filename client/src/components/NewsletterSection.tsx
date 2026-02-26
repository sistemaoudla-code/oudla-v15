import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNewsletterSubscriberSchema, type NewsletterSettings } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function NewsletterSection() {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const subscribed = localStorage.getItem("newsletter_subscribed") === "true";
    if (subscribed) {
      setIsSubscribed(true);
    }
  }, []);

  const { data: settings } = useQuery<NewsletterSettings>({
    queryKey: ["/api/newsletter/settings"],
  });

  const form = useForm({
    resolver: zodResolver(insertNewsletterSubscriberSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: { email: string }) => {
      const res = await apiRequest("POST", "/api/newsletter/subscribe", values);
      return res.json();
    },
    onSuccess: () => {
      setIsSubscribed(true);
      localStorage.setItem("newsletter_subscribed", "true");
      toast({
        title: "sucesso!",
        description: "você foi cadastrado na nossa newsletter.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "erro",
        description: error.message || "ocorreu um erro ao tentar se cadastrar.",
      });
    },
  });

  if (!settings) return null;

  return (
    <section className="relative py-28 md:py-40 px-6 overflow-hidden bg-muted/50 dark:bg-muted/20">
      <div className="relative max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-4xl md:text-5xl font-extralight tracking-tight lowercase leading-[1.1] text-foreground">
            {settings.title}
          </h2>

          <p className="text-muted-foreground text-[15px] lowercase mt-5 leading-relaxed">
            {settings.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-10"
        >
          {!isSubscribed ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                className="space-y-3"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <Input
                          placeholder="seu e-mail"
                          className="h-14 px-6 rounded-full bg-background border border-border/50 text-foreground placeholder:text-muted-foreground/40 text-base focus-visible:ring-1 focus-visible:ring-foreground/10 text-center"
                          {...field}
                          data-testid="input-newsletter-email"
                        />
                      </FormControl>
                      <FormMessage className="text-[11px] mt-2.5 text-red-500 dark:text-red-400 pl-6" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full h-14 rounded-full bg-foreground text-background text-[15px] font-medium lowercase gap-2 mt-1"
                  data-testid="button-newsletter-submit"
                >
                  {mutation.isPending ? "enviando..." : settings.buttonText}
                  {!mutation.isPending && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            </Form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="inline-flex items-center gap-2.5 h-14 px-8 rounded-full bg-background border border-border/50 text-foreground text-[15px] lowercase"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
              obrigado por se inscrever!
            </motion.div>
          )}
        </motion.div>

        {settings.disclaimerText && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 text-[11px] text-muted-foreground/50 lowercase tracking-wide"
          >
            {settings.disclaimerText}
          </motion.p>
        )}
      </div>
    </section>
  );
}
