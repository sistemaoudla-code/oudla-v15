import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MochilaProvider } from "@/contexts/MochilaContext";
import { FavoritosProvider } from "@/contexts/FavoritosContext";
import { PixelProvider } from "@/components/PixelProvider";
import MochilaDrawer from "@/components/MochilaDrawer";
import FavoritosDrawer from "@/components/FavoritosDrawer";
import Header from "@/components/Header";
import { useEffect, lazy, Suspense } from "react";
import Home from "@/pages/Home";
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const ProductPage = lazy(() => import("@/pages/ProductPage"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const CheckoutPending = lazy(() => import("@/pages/CheckoutPending"));
const CheckoutFailure = lazy(() => import("@/pages/CheckoutFailure"));
// Páginas de retorno do Mercado Pago
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const PaymentPending = lazy(() => import("@/pages/PaymentPending"));
const PaymentFailure = lazy(() => import("@/pages/PaymentFailure"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const TrocasDevolucoes = lazy(() => import("@/pages/TrocasDevolucoes"));
const Privacidade = lazy(() => import("@/pages/Privacidade"));
const Termos = lazy(() => import("@/pages/Termos"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const About = lazy(() => import("@/pages/About"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const Admin = lazy(() => import("@/pages/Admin"));
const LeleliPage = lazy(() => import("@/pages/LeleliPage"));
const NotFound = lazy(() => import("@/pages/not-found"));
import CookieBanner from "@/components/CookieBanner";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={Admin} />
          <Route path="/" component={Home} />
          <Route path="/produtos" component={ProductsPage} />
          <Route path="/produto/:id" component={ProductPage} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkout/success" component={CheckoutSuccess} />
          <Route path="/checkout/pending" component={CheckoutPending} />
          <Route path="/checkout/failure" component={CheckoutFailure} />
          {/* Rotas de retorno do Mercado Pago */}
          <Route path="/pagamento/sucesso" component={PaymentSuccess} />
          <Route path="/pagamento/pendente" component={PaymentPending} />
          <Route path="/pagamento/falha" component={PaymentFailure} />
          <Route path="/rastreio" component={OrderTracking} />
          <Route path="/trocas-devolucoes" component={TrocasDevolucoes} />
          <Route path="/privacidade" component={Privacidade} />
          <Route path="/termos" component={Termos} />
          <Route path="/faq" component={FAQ} />
          <Route path="/sobre" component={About} />
          <Route path="/leleli" component={LeleliPage} />
          <Route path="/:id" component={ProductPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function useContentProtection() {
  useEffect(() => {
    const isAdmin = window.location.pathname.startsWith("/admin");
    if (isAdmin) return;

    const blockEvent = (e: Event) => { e.preventDefault(); return false; };
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "K")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "s" || e.key === "p" || e.key === "a")) ||
        (e.metaKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "K")) ||
        (e.metaKey && (e.key === "u" || e.key === "s" || e.key === "p" || e.key === "a"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    const blockPrint = (e: Event) => { e.preventDefault(); };

    (function blockConsole() {
      const noop = () => {};
      const props = ["log", "debug", "info", "warn", "error", "table", "trace", "dir", "group", "groupEnd", "time", "timeEnd"];
      props.forEach(p => { try { (console as any)[p] = noop; } catch {} });
    })();

    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("dragstart", blockEvent);
    document.addEventListener("selectstart", blockEvent);
    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    window.addEventListener("beforeprint", blockPrint);

    const style = document.createElement("style");
    style.textContent = `
      * { -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; }
      img, video, svg, canvas { pointer-events: none !important; -webkit-user-drag: none !important; }
      img { content-visibility: auto; }
      input, textarea, [contenteditable="true"] { -webkit-user-select: text !important; -moz-user-select: text !important; user-select: text !important; }
      @media print { body { display: none !important; } }
    `;
    document.head.appendChild(style);

    const images = document.querySelectorAll("img");
    const observer = new MutationObserver(() => {
      document.querySelectorAll("img:not([draggable='false'])").forEach(img => {
        img.setAttribute("draggable", "false");
        img.setAttribute("oncontextmenu", "return false");
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    images.forEach(img => {
      img.setAttribute("draggable", "false");
      img.setAttribute("oncontextmenu", "return false");
    });

    return () => {
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("dragstart", blockEvent);
      document.removeEventListener("selectstart", blockEvent);
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      window.removeEventListener("beforeprint", blockPrint);
      observer.disconnect();
      style.remove();
    };
  }, []);
}

function App() {
  const [location] = useLocation();
  useContentProtection();

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const theme = stored || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme as string;
    document.body.style.backgroundColor = theme === 'dark' ? '#141517' : '#fafafa';
    if (!stored) {
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const isAdminRoute = location.startsWith("/admin");
  const isCheckoutRoute = location.startsWith("/checkout");

  const isLeleliRoute = location === "/leleli";

  return (
    <QueryClientProvider client={queryClient}>
      {/* PixelProvider fica fora do Router para rastrear navegação entre páginas */}
      <PixelProvider>
        <TooltipProvider>
          <FavoritosProvider>
            <MochilaProvider>
              <Toaster />
              {!isAdminRoute && !isCheckoutRoute && !isLeleliRoute && <Header />}
              <Router />
              {!isAdminRoute && !isCheckoutRoute && !isLeleliRoute && (
                <>
                  <MochilaDrawer />
                  <FavoritosDrawer />
                  <CookieBanner />
                </>
              )}
            </MochilaProvider>
          </FavoritosProvider>
        </TooltipProvider>
      </PixelProvider>
    </QueryClientProvider>
  );
}

export default App;
