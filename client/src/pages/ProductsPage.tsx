import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { useFavoritos } from "@/contexts/FavoritosContext";
import { useQuery } from "@tanstack/react-query";

const sizeOptions = ["P", "M", "G", "GG", "XG"];

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-none bg-transparent">
      <div className="aspect-[3/4] bg-muted/40 animate-pulse rounded-md" />
      <div className="pt-4 space-y-2">
        <div className="h-4 bg-muted/40 animate-pulse rounded w-3/4" />
        <div className="h-5 bg-muted/40 animate-pulse rounded w-1/3" />
      </div>
    </Card>
  );
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || "";
  });
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());

  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<string>("relevancia");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { isFavorito, toggleFavorito, triggerFavoritoToast } = useFavoritos();

  const { data: apiData, isLoading } = useQuery<{products: any[]}>({
    queryKey: ['/api/products'],
  });
  
  const allProducts = apiData?.products || [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleSize = useCallback((size: string) => {
    setSelectedSizes(prev => {
      const newSizes = new Set(prev);
      if (newSizes.has(size)) {
        newSizes.delete(size);
      } else {
        newSizes.add(size);
      }
      return newSizes;
    });
  }, []);

  const handleMinPriceChange = useCallback((value: string) => {
    const numValue = parseFloat(value);
    if (value === "" || isNaN(numValue)) {
      setPriceRange(prev => [0, prev[1]]);
    } else {
      const validMin = Math.max(0, numValue);
      setPriceRange(prev => [validMin, Math.max(validMin, prev[1])]);
    }
  }, []);

  const handleMaxPriceChange = useCallback((value: string) => {
    const numValue = parseFloat(value);
    if (value === "" || isNaN(numValue)) {
      setPriceRange(prev => [prev[0], 200]);
    } else {
      const validMax = Math.max(0, numValue);
      setPriceRange(prev => [Math.min(prev[0], validMax), validMax]);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedSizes(new Set());
    setSelectedCategory("todos");
    setSortBy("relevancia");
    setPriceRange([0, 200]);
    setSearchTerm("");
  }, []);


  const filteredProducts = useMemo(() => {
    let results = allProducts.filter((product: any) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSize = selectedSizes.size === 0 || product.sizes?.some((size: string) => selectedSizes.has(size));
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesCategory = selectedCategory === "todos" || product.productType === selectedCategory;
      
      return matchesSearch && matchesSize && matchesPrice && matchesCategory;
    });

    if (sortBy === "preco_asc") {
      results.sort((a: any, b: any) => a.price - b.price);
    } else if (sortBy === "preco_desc") {
      results.sort((a: any, b: any) => b.price - a.price);
    } else if (sortBy === "novo") {
      results.sort((a: any, b: any) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    }

    return results;
  }, [allProducts, searchTerm, selectedSizes, priceRange, selectedCategory, sortBy]);

  const activeFiltersCount = useMemo(() => 
    selectedSizes.size + (priceRange[0] > 0 || priceRange[1] < 200 ? 1 : 0) + (selectedCategory !== "todos" ? 1 : 0),
    [selectedSizes.size, priceRange, selectedCategory]
  );

  const sortOptions = [
    { value: "relevancia", label: "relevância" },
    { value: "preco_asc", label: "menor preço" },
    { value: "preco_desc", label: "maior preço" },
    { value: "novo", label: "mais novo" },
  ];

  const categoryOptions = [
    { value: "todos", label: "todos" },
    { value: "clothing", label: "roupas" },
    { value: "accessory", label: "acessórios" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Apple-style sticky toolbar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Main bar */}
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Left: sort + active filters */}
            <div className="flex items-center gap-3 min-w-0 overflow-x-auto no-scrollbar">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  className="w-auto h-8 px-4 rounded-full border-0 bg-muted/60 text-[13px] font-medium text-muted-foreground gap-1.5 shadow-none focus:ring-0 shrink-0"
                  data-testid="select-sort"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {sortOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-[13px] lowercase">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {Array.from(selectedSizes).map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-foreground text-background text-[11px] font-medium transition-colors"
                      data-testid={`badge-active-size-${size}`}
                    >
                      {size}
                      <X className="h-3 w-3 opacity-60" />
                    </button>
                  ))}
                  {selectedCategory !== "todos" && (
                    <button
                      onClick={() => setSelectedCategory("todos")}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-foreground text-background text-[11px] font-medium transition-colors"
                    >
                      {categoryOptions.find(c => c.value === selectedCategory)?.label}
                      <X className="h-3 w-3 opacity-60" />
                    </button>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-[11px] text-muted-foreground/60 ml-1 shrink-0"
                    data-testid="button-clear-filters"
                  >
                    limpar
                  </button>
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { setShowSearch(!showSearch); if (showFilters) setShowFilters(false); }}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                  showSearch ? 'bg-foreground text-background' : 'text-muted-foreground'
                }`}
                data-testid="button-toggle-search"
              >
                <Search className="h-[15px] w-[15px]" />
              </button>
              <button
                onClick={() => { setShowFilters(!showFilters); if (showSearch) setShowSearch(false); }}
                className={`relative h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                  showFilters ? 'bg-foreground text-background' : 'text-muted-foreground'
                }`}
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="h-[15px] w-[15px]" />
                {activeFiltersCount > 0 && !showFilters && (
                  <span className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search - Apple-style slide down */}
          {showSearch && (
            <div className="pb-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  placeholder="buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-muted/40 border-0 rounded-xl text-[15px] focus-visible:ring-1 focus-visible:ring-foreground/10"
                  autoFocus
                  data-testid="input-search"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 flex items-center justify-center"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filters panel - Apple-style */}
          {showFilters && (
            <div className="pb-5 pt-1 space-y-5" data-testid="card-filters">
              {/* Category */}
              <div>
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest mb-2.5 font-medium">tipo</p>
                <div className="flex gap-1.5">
                  {categoryOptions.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`h-8 px-4 rounded-full text-[13px] font-medium transition-all ${
                        selectedCategory === cat.value
                          ? 'bg-foreground text-background'
                          : 'bg-muted/60 text-muted-foreground'
                      }`}
                      data-testid={`button-category-${cat.value}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest mb-2.5 font-medium">tamanho</p>
                <div className="flex gap-1.5">
                  {sizeOptions.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`h-8 w-10 rounded-full text-[13px] font-medium transition-all ${
                        selectedSizes.has(size)
                          ? 'bg-foreground text-background'
                          : 'bg-muted/60 text-muted-foreground'
                      }`}
                      data-testid={`button-size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest mb-2.5 font-medium">preço</p>
                <div className="flex items-center gap-2 max-w-xs">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/40">R$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={priceRange[0] || ""}
                      onChange={(e) => handleMinPriceChange(e.target.value)}
                      min={0}
                      className="pl-9 h-9 bg-muted/40 border-0 rounded-xl text-[13px] focus-visible:ring-1 focus-visible:ring-foreground/10"
                      data-testid="input-price-min"
                    />
                  </div>
                  <span className="text-muted-foreground/30 text-xs">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/40">R$</span>
                    <Input
                      type="number"
                      placeholder="200"
                      value={priceRange[1] >= 200 ? "" : priceRange[1]}
                      onChange={(e) => handleMaxPriceChange(e.target.value)}
                      min={0}
                      className="pl-9 h-9 bg-muted/40 border-0 rounded-xl text-[13px] focus-visible:ring-1 focus-visible:ring-foreground/10"
                      data-testid="input-price-max"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="h-px bg-border/40" />
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            <>
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                isFavorite={isFavorito(product.id)}
                onFavoriteToggle={(id, productInfo) => {
                  if (!isFavorito(id)) {
                    triggerFavoritoToast({ id, ...productInfo });
                  }
                  toggleFavorito(id);
                }}
                showInstallments={false}
              />
            ))
          )}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-24">
            <p className="text-2xl font-light text-muted-foreground mb-2">nenhum resultado</p>
            <p className="text-sm text-muted-foreground/60 mb-6">tente ajustar seus filtros</p>
            <Button variant="outline" onClick={clearFilters} data-testid="button-clear-no-results">
              limpar filtros
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
