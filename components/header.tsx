'use client';
import * as React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Menu, X, ShoppingCart, Heart, User, Home, Package, MessageSquare, 
  Camera, FileText, HelpCircle, Settings, LogOut, Info, Search, 
  RefreshCw, TrendingUp, Hash, Sparkles, Clock, ChevronRight, Star 
} from "lucide-react";
import { useCartStore, useFavoritesStore, useAuthStore } from "@/lib/store";
import SettingsModal from "@/components/settings-modal";
import { useThemeSync } from "@/hooks/useThemeSync";

// Cache para resultados de busca
const searchCache = new Map();
const MAX_CACHE_SIZE = 50;

// Interface para produto
interface Product {
  id: string;
  name: string;
  price: number;
  precoVenda2?: number; // Preço atacado
  priceAtacado?: number; // Preço atacado alternativo
  image?: string;
  imagem?: string; // Imagem alternativa
  codigo?: string;
  sku?: string;
  descricao?: string;
  vendas?: number;
  posicaoRanking?: number;
}

interface HeaderProps {
  onToggleSidebar?: () => void;
  showDepartmentsButton?: boolean;
}

export default function Header({ onToggleSidebar, showDepartmentsButton = false }: HeaderProps = {}): JSX.Element {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'nome' | 'codigo'>('nome');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingCameraRequests, setPendingCameraRequests] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [maisVendidos, setMaisVendidos] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);
  
  const { getItemCount } = useCartStore();
  const { favorites } = useFavoritesStore();
  const { user, logout, loadUserProfile } = useAuthStore();
  
  // Aplicar sincronização de tema
  useThemeSync();
  
  // Carregar perfil do localStorage quando o usuário estiver logado
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);
  
  // Refs para controle do dropdown
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Quantidades
  const cartItemCount = typeof getItemCount === 'function' ? getItemCount() : 0;
  const favoritesCount = Array.isArray(favorites) ? favorites.length : 0;

  // Pesquisas populares
  const popularSearches = useMemo(() => [
    'arroz', 'feijão', 'óleo', 'açúcar', 'café',
    'leite', 'macarrão', 'molho de tomate', 'sal', 'farinha'
  ], []);

  // Carregar todos os produtos uma vez no início
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        console.log('Carregando produtos...');
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          const products = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          console.log(`Carregados ${products.length} produtos`);
          
          // Mapear precoVenda2 para priceAtacado para compatibilidade
          const mappedProducts = products.map((prod: any) => ({
            ...prod,
            priceAtacado: prod.precoVenda2 // Garantir compatibilidade
          }));
          
          setAllProducts(mappedProducts);
          setIsProductsLoaded(true);
          setIsSearching(false); // Para qualquer loading pendente
        } else {
          console.error('Erro ao carregar produtos:', response.status);
          setIsProductsLoaded(true); // Mesmo com erro, para de mostrar loading
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setIsProductsLoaded(true); // Mesmo com erro, para de mostrar loading
      }
    };

    fetchAllProducts();
  }, []);

  // Carregar pesquisas recentes e dados do CSV
  useEffect(() => {
    // Carregar pesquisas recentes
    const savedRecentSearches = localStorage.getItem('recentSearches');
    if (savedRecentSearches) {
      try {
        setRecentSearches(JSON.parse(savedRecentSearches).slice(0, 5));
      } catch (e) {
        console.error('Erro ao carregar pesquisas recentes:', e);
      }
    }

    // Carregar dados do CSV
    const fetchMaisVendidos = async () => {
      try {
        const response = await fetch('/api/mais-vendidos');
        if (response.ok) {
          const data = await response.json();
          setMaisVendidos(data.reverse());
        }
      } catch (error) {
        console.error('Erro ao carregar mais vendidos:', error);
      }
    };
    
    fetchMaisVendidos();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSearchResults) {
        const desktopDropdown = desktopDropdownRef.current;
        const mobileDropdown = mobileDropdownRef.current;
        const searchInput = searchInputRef.current;
        
        // Verifica se o clique foi fora do dropdown e do input de busca
        if (desktopDropdown && !desktopDropdown.contains(event.target as Node) &&
            mobileDropdown && !mobileDropdown.contains(event.target as Node) &&
            searchInput && !searchInput.contains(event.target as Node)) {
          setShowSearchResults(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  // Normalização para busca
  const normalize = useCallback((s: string): string => (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/gi, '')
    .replace(/[^a-z0-9]/gi, '') // Remover caracteres especiais
    .replace(/\s+/g, ' ')
    .trim(), []);

  // Algoritmo de busca otimizado
  const performSearch = useCallback((query: string, products: Product[], type: 'nome' | 'codigo') => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery || !products.length) return [];
    
    const startTime = performance.now();
    let resultados: Product[] = [];

    if (type === 'codigo') {
      // Busca por código - extremamente rápida
      resultados = products.filter((prod: Product) => {
        return prod.id?.includes(normalizedQuery) || 
               prod.codigo?.includes(normalizedQuery) ||
               prod.sku?.includes(normalizedQuery);
      }).slice(0, 10);
    } else {
      // Busca por nome - estratégia em camadas
      
      // 1. Busca exata (case insensitive)
      const exactMatch = products.filter(prod => 
        normalize(prod.name || '').includes(normalizedQuery)
      );
      
      // 2. Busca por palavras que começam com a query
      const startsWithMatch = products.filter(prod => {
        const nomeNormalizado = normalize(prod.name || '');
        const words = nomeNormalizado.split(' ');
        return words.some(word => word.startsWith(normalizedQuery));
      });
      
      // 3. Combinar resultados e remover duplicatas
      resultados = [...exactMatch, ...startsWithMatch];
      const uniqueResults = resultados.filter((prod, index, self) =>
        index === self.findIndex(p => p.id === prod.id)
      ).slice(0, 8);
      
      // Adicionar informações de vendas
      resultados = uniqueResults.map((prod: Product) => {
        const vendasItem = maisVendidos.find(item => 
          normalize(item.nome) === normalize(prod.name || '')
        );
        return {
          ...prod,
          vendas: vendasItem ? parseInt(vendasItem.quantidade) || 0 : 0,
          posicaoRanking: vendasItem ? maisVendidos.indexOf(vendasItem) + 1 : Infinity
        };
      }).sort((a: Product, b: Product) => {
        // Ordenar por posição no ranking primeiro
        if (a.posicaoRanking !== b.posicaoRanking) {
          return (a.posicaoRanking || Infinity) - (b.posicaoRanking || Infinity);
        }
        // Depois por nome
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    const endTime = performance.now();
    console.log(`Busca por "${query}" realizada em ${(endTime - startTime).toFixed(2)}ms, ${resultados.length} resultados`);
    
    return resultados;
  }, [normalize, maisVendidos]);

  // Salvar pesquisa recente
  const saveRecentSearch = useCallback((term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return;

    const updatedSearches = [
      trimmedTerm,
      ...recentSearches.filter(search => search !== trimmedTerm)
    ].slice(0, 5);

    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  }, [recentSearches]);

  // Função de busca principal
  const handleSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Previne o reload da página
    
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      setShowSearchResults(false);
      setIsSearching(false); // Para o loading
      
      // Esconder teclado no mobile
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      
      // Navega para a página de catálogo com a busca
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
    }
    
    return false; // Garante que não vai recarregar
  }, [searchQuery, searchType, saveRecentSearch, router]);

  // Buscar produtos em tempo real
  const handleSearchChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      setIsSearching(false); // Para o loading do timeout anterior
    }
    
    if (value.length > 1 && isProductsLoaded) {
      setShowSearchResults(true);
      setIsSearching(true);
      
      // Verificar se temos cache para esta consulta
      const cacheKey = `${searchType}:${value.toLowerCase().trim()}`;
      if (searchCache.has(cacheKey)) {
        setSearchResults(searchCache.get(cacheKey));
        setIsSearching(false);
        return;
      }
      
      // Usar debounce para evitar buscas muito frequentes
      searchTimeoutRef.current = setTimeout(() => {
        try {
          const resultados = performSearch(value, allProducts, searchType);
          
          // Armazenar em cache
          searchCache.set(cacheKey, resultados);
          
          // Limitar o tamanho do cache
          if (searchCache.size > MAX_CACHE_SIZE) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
          }
          
          setSearchResults(resultados);
        } catch (err) {
          console.error('Erro na busca:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 200);
    } else if (value.length <= 1) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchResults(value.length > 0);
    } else if (!isProductsLoaded) {
      setShowSearchResults(true); // Mostra dropdown com loading de produtos
    }
  }, [performSearch, searchType, isProductsLoaded, allProducts]);

  // Função para lidar com o clique em um produto
  const handleProductClick = useCallback((id: string) => {
    saveRecentSearch(searchQuery);
    setShowSearchResults(false);
    setIsMenuOpen(false);
    setIsSearching(false);
    setSearchQuery("");
    router.push(`/product/${id}`);
  }, [searchQuery, router, saveRecentSearch]);

  // Função para ver todos os resultados - CORRIGIDA (sem recarregar página)
  const handleSeeAllResults = useCallback(() => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      setShowSearchResults(false);
      setIsMenuOpen(false);
      setIsSearching(false);
      
      // Usar router.push sem recarregar a página
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
      
      // Limpar campo de busca após navegação
      setTimeout(() => {
        setSearchQuery("");
      }, 100);
    }
  }, [searchQuery, searchType, saveRecentSearch, router]);

  // Função para usar uma sugestão
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      handleSeeAllResults();
    }, 100);
  }, [handleSeeAllResults]);

  // Função de logout
  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  }, [logout, router]);

  // Função para limpar a busca
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Alternar tipo de busca
  const toggleSearchType = useCallback(() => {
    setSearchType(prev => prev === 'nome' ? 'codigo' : 'nome');
    setSearchQuery("");
    setSearchResults([]);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, []);

  // Verificar pedidos pendentes
  const checkPendingItems = useCallback(() => {
    setPendingOrders(0);
    setPendingCameraRequests(0);
  }, []);

  useEffect(() => {
    if (user?.email) {
      checkPendingItems();
    }
  }, [user, checkPendingItems]);

  // Fechar dropdown ao clicar fora - CORRIGIDO
// Fechar dropdown ao clicar fora - CORRIGIDO

  // Renderizar resultados da pesquisa
  const renderSearchResults = useCallback(() => {
    // Se os produtos ainda não carregaram, mostra loading
    if (!isProductsLoaded) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
          <span className="text-gray-500">Carregando produtos...</span>
        </div>
      );
    }

    // Se está buscando (mas produtos já carregaram)
    if (isSearching && searchQuery.length > 1) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
          <span className="text-gray-500">Buscando produtos...</span>
        </div>
      );
    }
    
    if (searchQuery.length > 0 && searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-2xl mb-2">🔍</span>
          <span className="text-gray-500">Nenhum produto encontrado</span>
          <button
            className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors"
            onClick={handleSeeAllResults}
          >
            Ver todos os produtos
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Resultados da busca */}
        {searchResults.length > 0 && (
          <div className="p-2">
            {searchResults.map((produto) => (
              <SearchResultItem 
                key={produto.id || produto.codigo} 
                produto={produto} 
                onClick={() => handleProductClick(produto.id || produto.codigo || '')} 
              />
            ))}
          </div>
        )}

        {/* Pesquisas recentes */}
        {!searchQuery && recentSearches.length > 0 && (
          <RecentSearches 
            recentSearches={recentSearches} 
            onSuggestionClick={handleSuggestionClick} 
          />
        )}

        {/* Pesquisas populares */}
        {!searchQuery && popularSearches.length > 0 && (
          <PopularSearches 
            popularSearches={popularSearches} 
            onSuggestionClick={handleSuggestionClick} 
          />
        )}

        {/* Botão ver todos os resultados */}
        {searchQuery && searchResults.length > 0 && (
          <button
            className="w-full py-3 text-center text-orange-600 font-medium bg-orange-50 hover:bg-orange-100 transition-colors flex items-center justify-center group"
            onClick={handleSeeAllResults}
          >
            Ver todos os resultados para "{searchQuery}"
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </>
    );
  }, [isSearching, searchQuery, searchResults, recentSearches, popularSearches, handleSuggestionClick, handleSeeAllResults, handleProductClick]);

  // Componente SearchResultItem corrigido para usar precoVenda2
  const SearchResultItem = React.memo(({ produto, onClick }: { produto: Product, onClick: () => void }) => {
    // Usar a mesma lógica do cart page para buscar preço 2 (atacado)
    const precoAtacado = produto.priceAtacado > 0
      ? produto.priceAtacado
      : (produto as any).prices?.precoVenda2 > 0
        ? (produto as any).prices.precoVenda2
        : (produto as any).varejoFacilData?.precos?.precoVenda2 || 0;
    
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center px-4 py-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 text-left transition-colors group"
      >
        <img 
          src={produto.image || produto.imagem || '/placeholder.png'} 
          alt={produto.name || produto.descricao} 
          className="w-12 h-12 object-cover rounded-md mr-3 border border-gray-200 group-hover:border-orange-300 transition-colors" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.png';
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{produto.name || produto.descricao}</p>
          <div className="flex gap-2 items-center mt-1">
            <span className="text-sm text-blue-600 font-semibold">
              R$ {produto.price?.toFixed(2).replace('.', ',')}
            </span>
            {precoAtacado && precoAtacado > 0 && (
              <span className="text-sm text-green-600 font-semibold">
                Atacado: R$ {precoAtacado.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
          {produto.vendas && produto.vendas > 0 && (
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-orange-600 mr-1" />
              <span className="text-xs text-orange-600 font-semibold">{produto.vendas} vendas</span>
              {produto.posicaoRanking && produto.posicaoRanking <= 50 && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full ml-2">
                  #{produto.posicaoRanking} mais vendido
                </span>
              )}
            </div>
          )}
          {produto.id && (
            <div className="text-xs text-gray-500 mt-1">Código: {produto.id}</div>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
      </button>
    );
  });

  SearchResultItem.displayName = 'SearchResultItem';

  return (
    <header className="w-full bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Botão Categorias */}
          {showDepartmentsButton && onToggleSidebar && (
            <div className="flex items-center gap-3 group">
              <button 
                onClick={() => {
                  console.log('🔲 Botão categorias clicado!');
                  onToggleSidebar?.();
                }}
                type="button"
                className="flex items-center justify-center w-12 h-12 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:scale-110 hover:shadow-lg transition-all duration-300 group/btn relative overflow-hidden border-2 border-transparent hover:border-blue-200"
              >
                {/* Ícone Grid ultra criativo */}
                <div className="relative">
                  <div className="grid grid-cols-2 gap-1.5 p-1">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md group-hover/btn:from-blue-400 group-hover/btn:to-blue-600 group-hover/btn:shadow-sm group-hover/btn:rotate-12 transition-all duration-300 transform"></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md group-hover/btn:from-orange-400 group-hover/btn:to-red-500 group-hover/btn:shadow-sm group-hover/btn:-rotate-12 transition-all duration-300 delay-75 transform"></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md group-hover/btn:from-green-400 group-hover/btn:to-emerald-500 group-hover/btn:shadow-sm group-hover/btn:rotate-12 transition-all duration-300 delay-150 transform"></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md group-hover/btn:from-purple-400 group-hover/btn:to-pink-500 group-hover/btn:shadow-sm group-hover/btn:-rotate-12 transition-all duration-300 delay-225 transform"></div>
                  </div>
                  
                  {/* Indicadores de ação múltiplos */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-ping transition-opacity duration-300"></div>
                  <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-pulse transition-opacity duration-300 delay-150"></div>
                  
                  {/* Brilho central */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                </div>
                
                {/* Animações de borda */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out rounded-b-2xl"></div>
                <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-400 transform translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 ease-out delay-100 rounded-r-2xl"></div>
              </button>
            </div>
          )}
          
          <Link href="/catalog" className="flex items-center justify-center">
            <div className="bg-gray-50 rounded-xl p-3 shadow-lg border border-gray-100">
              <img src="https://i.ibb.co/TBGDxS4M/guanabara-1.png" alt="Logo" className="h-12 w-56 object-contain" />
            </div>
          </Link>
        </div>
        
        {/* Campo de busca desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-6 relative max-w-2xl">
          <div className="w-full relative">
            <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden border-2 border-white/20">
              {/* Seletor de tipo de busca */}
              <button
                type="button"
                onClick={toggleSearchType}
                className={`flex items-center px-5 py-3 text-sm font-medium transition-colors rounded-l-full ${
                  searchType === 'nome' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={searchType === 'nome' ? 'Buscar por nome' : 'Buscar por código'}
              >
                {searchType === 'nome' ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <Hash className="h-5 w-5" />
                )}
              </button>
              
              <div className="flex-1 relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchType === 'nome' 
                    ? "🔍 Buscar produtos por nome..." 
                    : "🔍 Buscar por código (ID, SKU)..."}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full px-6 py-3 pl-14 pr-14 bg-white focus:outline-none text-gray-900 placeholder-gray-500 rounded-r-full"
                  autoComplete="off"
                />
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {isSearching && (
                  <RefreshCw className="absolute right-14 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500 animate-spin" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Dropdown de resultados */}
            {showSearchResults && (
              <div
                ref={desktopDropdownRef}
                className="absolute left-0 right-0 top-full bg-white rounded-lg shadow-2xl border border-gray-200 mt-2 max-h-96 overflow-y-auto z-[60] search-dropdown"
              >
                <button
                  type="button"
                  onClick={() => setShowSearchResults(false)}
                  className="absolute top-2 right-2 z-10 p-2 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
                {renderSearchResults()}
              </div>
            )}
          </div>
        </form>
        
        {/* Ícones do header */}
        <div className="hidden md:flex items-center space-x-3">
          {user?.role === "admin" && (
            <Link href="/admin" className="p-2 text-gray-700 hover:text-orange-600 transition-colors" title="Painel Admin">
              <Settings className="h-6 w-6" />
            </Link>
          )}
          
          <Link href="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </div>
          </Link>
          
          <Link href="/favorites" className="relative p-2 text-gray-700 hover:text-red-600 transition-colors">
            <Heart className="h-6 w-6" />
            {favoritesCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {favoritesCount}
              </span>
            )}
          </Link>

          {/* Botão de Configurações - apenas para usuários logados */}
          {user && (
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2 text-gray-700 hover:text-purple-600 transition-colors" 
              title="Configurações"
            >
              <Settings className="h-6 w-6" />
            </button>
          )}
          
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-700 hover:text-blue-600 transition-colors">
            <Menu className="h-6 w-6" />
          </button>
          
          {user ? (
            <div className="flex items-center space-x-3 ml-4">
              <div className="text-right">
                <span className="text-sm font-medium text-gray-800">Olá, {user.name}</span>
                <p className="text-xs text-gray-600">Bem-vindo!</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-700 hover:text-red-600 transition-colors">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 ml-4">
              <Link href="/login" className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <User className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
              <Link href="/register" className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                <User className="h-4 w-4" />
                <span>Criar Conta</span>
              </Link>
            </div>
          )}
        </div>
        
        {/* Botão menu mobile */}
        <button className="md:hidden p-3 text-gray-700 hover:text-blue-600 transition-colors bg-gray-50 rounded-lg shadow-sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? 
            <X className="h-6 w-6" /> : 
            <Menu className="h-6 w-6" />
          }
        </button>
      </div>
      
      {/* Campo de busca mobile */}
      <div className="md:hidden pb-4 px-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center mb-2 rounded-full overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={toggleSearchType}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                searchType === 'nome' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {searchType === 'nome' ? 'Nome' : 'Código'}
            </button>
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchType === 'nome' 
                  ? "Buscar produtos..." 
                  : "Buscar por código..."}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchResults(true)}
                className="w-full px-4 py-3 pl-10 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="off"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </form>
        
        {/* Dropdown de resultados mobile */}
        {showSearchResults && (
          <div
            ref={mobileDropdownRef}
            className="absolute left-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 mt-1 z-[70] max-h-64 overflow-y-auto search-dropdown"
          >
            {renderSearchResults()}
          </div>
        )}
      </div>
      
      {/* Menu lateral */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed inset-y-0 right-0 w-72 bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <img src="https://i.ibb.co/TBGDxS4M/guanabara-1.png" alt="Logo" className="h-8 w-32 object-contain" />
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <Link href="/catalog" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Home className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Início</span>
                      <p className="text-xs text-gray-500">Página principal</p>
                    </div>
                  </Link>
                  
                  <Link href="/catalog" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 transition-colors group" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Produtos</span>
                      <p className="text-xs text-gray-500">Ver catálogo</p>
                    </div>
                  </Link>
                  
                  <Link href="/cart" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 transition-colors group" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors relative">
                      <ShoppingCart className="w-4 h-4 text-orange-600" />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {cartItemCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Carrinho</span>
                      <p className="text-xs text-gray-500">{cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}</p>
                    </div>
                  </Link>
                  
                  <Link href="/favorites" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors group" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors relative">
                      <Heart className="w-4 h-4 text-red-600" />
                      {favoritesCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {favoritesCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Favoritos</span>
                      <p className="text-xs text-gray-500">{favoritesCount} produtos</p>
                    </div>
                  </Link>
                  
                  <Link href="/returns" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-yellow-50 transition-colors order-5" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><RefreshCw className="w-5 h-5 text-yellow-600" /></div>
                    <div className="flex-1"><span className="font-medium text-gray-900">Trocas e Devoluções</span><p className="text-xs text-gray-500">Solicite trocas ou devoluções</p></div>
                  </Link>
                  
                  <Link href="/camera-request" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors order-6" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><Camera className="w-5 h-5 text-indigo-600" /></div>
                    <div className="flex-1"><span className="font-medium text-gray-900">Verificação de Câmeras</span><p className="text-xs text-gray-500">Perdeu algo na loja?</p></div>
                  </Link>
                  
                  <Link href="/orders" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-purple-50 transition-colors order-7" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-purple-600" /></div>
                    <div className="flex-1"><span className="font-medium text-gray-900">Histórico de Pedidos</span><p className="text-xs text-gray-500">Veja seus pedidos</p></div>
                  </Link>
                  
                  <Link href="/feedback" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-yellow-50 transition-colors order-8" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><MessageSquare className="w-5 h-5 text-yellow-600" /></div>
                    <div className="flex-1"><span className="font-medium text-gray-900">Feedback</span><p className="text-xs text-gray-500">Envie sua opinião</p></div>
                  </Link>
                  
                  <Link href="/about" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors order-11" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Info className="w-5 h-5 text-orange-600" /></div>
                    <div><span className="font-medium text-gray-900">Sobre Nós</span><p className="text-xs text-gray-500">Nossa história</p></div>
                  </Link>
                  
                  <Link href="/faq" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors order-12" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center"><HelpCircle className="w-5 h-5 text-teal-600" /></div>
                    <div><span className="font-medium text-gray-900">Ajuda</span><p className="text-xs text-gray-500">FAQ</p></div>
                  </Link>

                  {/* Configurações - apenas para usuários logados */}
                  {user && (
                    <button 
                      onClick={() => {
                        setIsSettingsOpen(true)
                        setIsMenuOpen(false)
                      }} 
                      className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-purple-50 transition-colors order-13"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium text-gray-900">Configurações</span>
                        <p className="text-xs text-gray-500">Preferências da conta</p>
                      </div>
                    </button>
                  )}
                  
                  {user?.role === "admin" && (
                    <Link href="/admin" className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg" onClick={() => setIsMenuOpen(false)}>
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><Settings className="w-5 h-5 text-white" /></div>
                      <div><span className="font-bold text-white">Admin</span><p className="text-xs text-orange-100">Painel</p></div>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {user ? (
                  <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">Sair da Conta</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl" onClick={() => setIsMenuOpen(false)}>
                      <User className="w-5 h-5" />
                      <span className="font-semibold">Entrar</span>
                    </Link>
                    <Link href="/register" className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl" onClick={() => setIsMenuOpen(false)}>
                      <User className="w-5 h-5" />
                      <span className="font-semibold">Criar Conta</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .search-dropdown {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .search-dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .search-dropdown::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .search-dropdown::-webkit-scrollbar-thumb {
          background: #ff9a3c;
          border-radius: 3px;
        }
        .search-dropdown::-webkit-scrollbar-thumb:hover {
          background: #ff7b00;
        }
      `}</style>

      {/* Modal de Configurações */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </header>
  );
}

// Componentes auxiliares
const RecentSearches = React.memo(({ recentSearches, onSuggestionClick }: { recentSearches: string[], onSuggestionClick: (s: string) => void }) => (
  <div className="p-2 border-t border-gray-100">
    <div className="flex items-center px-3 py-2 text-sm font-semibold text-gray-700">
      <Clock className="h-4 w-4 mr-2 text-blue-500" />
      Pesquisas recentes
    </div>
    {recentSearches.map((search, index) => (
      <button
        key={index}
        onClick={() => onSuggestionClick(search)}
        className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-md transition-colors duration-150 text-gray-700 flex items-center group"
      >
        <Clock className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
        {search}
      </button>
    ))}
  </div>
));

RecentSearches.displayName = 'RecentSearches';

const PopularSearches = React.memo(({ popularSearches, onSuggestionClick }: { popularSearches: string[], onSuggestionClick: (s: string) => void }) => (
  <div className="p-2 border-t border-gray-100">
    <div className="flex items-center px-3 py-2 text-sm font-semibold text-gray-700">
      <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
      Pesquisas populares
    </div>
    <div className="flex flex-wrap gap-2 px-2 py-1">
      {popularSearches.map((search, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(search)}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors duration-150 flex items-center group"
        >
          <Star className="h-3 w-3 mr-1 text-yellow-500" />
          {search}
        </button>
      ))}
    </div>
  </div>
));

PopularSearches.displayName = 'PopularSearches';