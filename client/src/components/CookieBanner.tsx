import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CookieSettingsData {
  enabled: boolean;
  title: string;
  description: string;
  buttonAcceptText: string;
  buttonRejectText: string;
  buttonCustomizeText: string;
  showCustomizeButton: boolean;
  privacyPolicyUrl: string;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { data: settings } = useQuery<CookieSettingsData>({
    queryKey: ["/api/cookie-settings"],
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const consent = localStorage.getItem("oudla_cookie_consent");
    if (!consent && settings?.enabled) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  const handleAccept = () => {
    localStorage.setItem("oudla_cookie_consent", "accepted");
    setDismissed(true);
    setTimeout(() => setVisible(false), 400);
  };

  const handleReject = () => {
    localStorage.setItem("oudla_cookie_consent", "rejected");
    setDismissed(true);
    setTimeout(() => setVisible(false), 400);
  };

  const handleCustomize = () => {
    localStorage.setItem("oudla_cookie_consent", "custom");
    setDismissed(true);
    setTimeout(() => setVisible(false), 400);
  };

  if (!settings?.enabled || !visible) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4 md:p-6"
          data-testid="cookie-banner"
        >
          <div className="max-w-lg mx-auto sm:mx-4 md:mx-auto">
            <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-muted shrink-0 mt-0.5">
                  <Cookie className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm lowercase">{settings.title}</p>
                    <button
                      onClick={handleReject}
                      className="p-1 rounded-lg hover-elevate shrink-0"
                      data-testid="button-cookie-close"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground lowercase leading-relaxed">
                    {settings.description}
                  </p>
                  <a
                    href={settings.privacyPolicyUrl || "/privacidade"}
                    className="text-xs text-primary lowercase underline inline-block"
                    data-testid="link-cookie-privacy"
                  >
                    política de privacidade
                  </a>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full lowercase text-xs"
                      onClick={handleAccept}
                      data-testid="button-cookie-accept"
                    >
                      {settings.buttonAcceptText}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full lowercase text-xs"
                      onClick={handleReject}
                      data-testid="button-cookie-reject"
                    >
                      {settings.buttonRejectText}
                    </Button>
                    {settings.showCustomizeButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 rounded-full lowercase text-xs"
                        onClick={handleCustomize}
                        data-testid="button-cookie-customize"
                      >
                        {settings.buttonCustomizeText}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
