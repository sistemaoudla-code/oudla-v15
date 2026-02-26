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


function App() {
  const [location] = useLocation();

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
