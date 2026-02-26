export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <h1 
          className="font-luxury text-5xl md:text-6xl font-light text-foreground tracking-wide uppercase"
          data-testid="text-logo-hero"
        >
          oudla
        </h1>
      </div>
      
      <div className="flex-1 flex items-center justify-center w-full px-4">
        {/* Espaço vazio */}
      </div>
    </section>
  );
}
