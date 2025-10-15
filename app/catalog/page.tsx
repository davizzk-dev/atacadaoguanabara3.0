'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { X, Sparkles, Target, Zap, Package, Search, ChevronLeft, ChevronRight, ShoppingCart, Trash2 } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Product } from '@/lib/types'
import { SearchParamsClient } from '@/components/search-params-client'
import CatalogSidebar from '@/components/catalog-sidebar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import PromotionalBanner from '@/components/promotional-banner'
import { CategoryCarousel } from '@/components/category-carousel'
import { useAuthStore, useCartStore } from '@/lib/store'
import Link from 'next/link'

// Função para calcular dados de promoção do produto (sincronizada com product-card)
function calculatePromotionData(product: Product) {
  // Preços originais
  const originalPrice1 = product.price;
  const originalPrice2 = (product as any).priceAtacado || (product as any).prices?.precoVenda2 || (product as any).varejoFacilData?.precos?.precoVenda2 || 0;
  
  // Preços finais (iniciam como originais, depois podem ser sobrescritos pelas ofertas)
  let finalPrice1 = originalPrice1;
  let finalPrice2 = originalPrice2;
  
  let hasOffers = false;
  let bestPrice = originalPrice1;
  let originalPrice = originalPrice1;
  let discountPercent = 0;
  let priceSource = "normal";

  // Verificar se existe oferta1 e sobrescrever price1
  if (product.varejoFacilData?.precos?.precoOferta1 > 0) {
    finalPrice1 = product.varejoFacilData.precos.precoOferta1;
    hasOffers = true;
    
    // Calcular desconto para oferta1
    if (originalPrice1 > finalPrice1) {
      discountPercent = Math.round(((originalPrice1 - finalPrice1) / originalPrice1) * 100);
      bestPrice = finalPrice1;
      originalPrice = originalPrice1;
      priceSource = "oferta1";
    }
  }

  // Verificar se existe oferta2 e sobrescrever price2
  if (product.varejoFacilData?.precos?.precoOferta2 > 0 && originalPrice2 > 0) {
    finalPrice2 = product.varejoFacilData.precos.precoOferta2;
    hasOffers = true;
    
    // Se não temos oferta1, ou se oferta2 tem desconto melhor, usar oferta2 como principal
    const desconto2 = originalPrice2 > finalPrice2 ? Math.round(((originalPrice2 - finalPrice2) / originalPrice2) * 100) : 0;
    
    if (priceSource === "normal" || desconto2 > discountPercent) {
      discountPercent = desconto2;
      bestPrice = finalPrice2;
      originalPrice = originalPrice2;
      priceSource = priceSource === "oferta1" ? "oferta1_e_oferta2" : "oferta2";
    } else if (priceSource === "oferta1") {
      priceSource = "oferta1_e_oferta2";
    }
  }

  // Fallback para compatibilidade com estrutura prices antiga
  if (!hasOffers && product.prices) {
    if (product.prices.offerPrice1 > 0 && product.prices.price1 > 0 && 
        product.prices.offerPrice1 < product.prices.price1) {
      hasOffers = true;
      bestPrice = product.prices.offerPrice1;
      originalPrice = product.prices.price1;
      discountPercent = Math.round(((originalPrice - bestPrice) / originalPrice) * 100);
      priceSource = "prices_oferta1";
    }
    else if (product.prices.offerPrice2 > 0 && product.prices.price2 > 0 && 
             product.prices.offerPrice2 < product.prices.price2) {
      hasOffers = true;
      bestPrice = product.prices.offerPrice2;
      originalPrice = product.prices.price2;
      discountPercent = Math.round(((originalPrice - bestPrice) / originalPrice) * 100);
      priceSource = "prices_oferta2";
    }
  }

  return {
    hasOffers,
    bestPrice,
    originalPrice,
    discountPercent,
    priceSource,
    isPromotion: hasOffers && discountPercent > 0,
    price1: finalPrice1, // Preço 1 (original ou oferta1)
    price2: finalPrice2, // Preço 2 (original ou oferta2)
    originalPrice1, // Preço 1 original para comparação
    originalPrice2  // Preço 2 original para comparação
  };
}

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedGroupName, setSelectedGroupName] = useState<string>("")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showFloatingCart, setShowFloatingCart] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { items, getItemCount, removeItem, clearCart } = useCartStore()
  const resultsRef = useRef<HTMLDivElement>(null)

  // Handler para receber parâmetros de busca da URL
  const handleSearchParams = (search: string | null, type: string | null) => {
    if (search) {
      setSearchTerm(search)
      setSelectedCategory("Todos") // Reset categoria quando há busca
      setCurrentPage(1) // Reset para primeira página
      
      // Auto-scroll para resultados após um pequeno delay
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }
      }, 300)
    }
  }

  // Função para remover item do carrinho
  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId)
  }

  // Handlers para o sidebar
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedGroup(null) // Limpar seleção de grupo ao mudar categoria
    setSearchTerm('') // Limpar busca
    setCurrentPage(1)
    
    // Scroll automático para os produtos
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100)
    
    // Atualizar URL
    const url = new URL(window.location.href)
    if (category !== 'Todos') {
      url.searchParams.set('category', category)
    } else {
      url.searchParams.delete('category')
    }
    window.history.pushState({}, '', url.toString())

  }

  // Função para buscar nome do grupo
  const fetchGroupName = async (groupId: string, category: string) => {
    try {
      const response = await fetch(`/api/catalog/groups?category=${encodeURIComponent(category)}`)
      if (response.ok) {
        const groups = await response.json()
        const group = groups.find((g: any) => g.id === groupId)
        setSelectedGroupName(group ? group.nome : groupId)
        return group ? group.nome : groupId
      }
    } catch (error) {
      setSelectedGroupName(groupId)
      return groupId
    }
  }

  const handleGroupChange = async (groupId: string | null) => {
    setSelectedGroup(groupId)
    setSearchTerm('') // Limpar busca ao selecionar grupo
    setCurrentPage(1)
    
    // Buscar nome do grupo
    if (groupId) {
      await fetchGroupName(groupId, selectedCategory)
    } else {
      setSelectedGroupName("")
    }
    
    // Atualizar URL com grupo
    const url = new URL(window.location.href)
    if (groupId) {
      url.searchParams.set('groupId', groupId)
    } else {
      url.searchParams.delete('groupId')
    }
    window.history.pushState({}, '', url.toString())
    
    // Fechar sidebar após selecionar grupo
    if (groupId) {
      setIsSidebarOpen(false)
    }
  }

  // Função para limpar busca e atualizar URL
  const clearSearch = () => {
    setSearchTerm("")
    // Remover parâmetros de busca da URL e recarregar
    const url = new URL(window.location.href)
    url.searchParams.delete('search')
    url.searchParams.delete('q')
    window.location.href = url.toString()
  }

  // Calcular total do carrinho
  const cartTotal = items.reduce((total, item) => total + (item.product.price * item.quantity), 0)

  // Carregar categorias primeiro (independente dos produtos)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          // Verificar se 'Todos' já existe no array antes de adicionar
          const hasAll = categoriesData.includes('Todos')
          setCategories(hasAll ? categoriesData : ['Todos', ...categoriesData])
        } else {
          setCategories(['Todos', 'Promoções'])
        }
      } catch (error) {
        setCategories(['Todos', 'Promoções'])
      }
    }
    
    loadCategories()
  }, [])

  // Carregar produtos da API de forma otimizada
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        setProductsLoading(true)
        
        // Usar a nova API catalog/products se há filtros específicos
        let apiUrl = '/api/products'
        const params = new URLSearchParams()
        
        if (selectedCategory !== 'Todos') {
          params.append('category', selectedCategory)
          apiUrl = '/api/catalog/products'
        }
        
        if (selectedGroup) {
          params.append('groupId', selectedGroup)
          apiUrl = '/api/catalog/products'
        }
        
        if (searchTerm) {
          params.append('search', searchTerm)
          if (apiUrl === '/api/products') {
            apiUrl = '/api/catalog/products'
          }
        }
        
        const fullUrl = params.toString() ? `${apiUrl}?${params}` : apiUrl
        
        const productsResponse = await fetch(fullUrl)
        if (productsResponse.ok && isMounted) {
          const productsData = await productsResponse.json()
          setProducts(productsData)
        }
      } catch (error) {
        // Erro silencioso
      } finally {
        if (isMounted) {
          setProductsLoading(false)
          setLoading(false)
        }
      }
    }
    
    loadProducts()
    return () => { isMounted = false }
  }, [selectedCategory, selectedGroup, searchTerm])

  // Normalização para busca (otimizada com memoização)
  const normalize = useMemo(() => {
    return (s: string) => (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/gi, '')
      .replace(/[^a-z0-9]/gi, '') // Remover caracteres especiais para busca mais flexível
      .replace(/\s+/g, ' ')
      .trim()
  }, [])



  // Carregar lista dos mais vendidos via API
  const [maisVendidos, setMaisVendidos] = useState<{ nome: string }[]>([]);
  useEffect(() => {
    const fetchMaisVendidos = async () => {
      try {
        const res = await fetch('/api/mais-vendidos');
        if (res.ok) {
          const data = await res.json();
          setMaisVendidos(data.slice().reverse());
        } else {
          setMaisVendidos([]);
        }
      } catch (error) {
        setMaisVendidos([]);
      }
    };
    fetchMaisVendidos();
  }, []);

  // Algoritmo de busca otimizado (EXATAMENTE igual ao header)
  const performSmartSearch = useMemo(() => {
    return (query: string, products: Product[]) => {
      const normalizedQuery = normalize(query);
      if (!normalizedQuery || !products.length) return [];
      
      const startTime = performance.now();
      let resultados: Product[] = [];

      if (query.startsWith('#')) {
        // Busca por código - extremamente rápida
        const code = query.replace('#', '').trim();
        resultados = products.filter((prod: Product) => {
          return prod.id?.includes(code);
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
        
        // Ordenar por relevância (produtos mais vendidos primeiro)
        resultados = uniqueResults.sort((a: Product, b: Product) => {
          // Verificar se estão no CSV de mais vendidos
          const aNoCSV = maisVendidos.some(item => normalize(item.nome) === normalize(a.name || ''));
          const bNoCSV = maisVendidos.some(item => normalize(item.nome) === normalize(b.name || ''));
          
          if (aNoCSV && !bNoCSV) return -1;
          if (!aNoCSV && bNoCSV) return 1;
          
          // Se ambos ou nenhum estão no CSV, ordenar por nome
          return (a.name || '').localeCompare(b.name || '');
        });
      }

      const endTime = performance.now();
      console.log(`🔍 Busca no catálogo: "${query}" -> ${resultados.length} resultados em ${(endTime - startTime).toFixed(2)}ms`);
      
      return resultados;
    };
  }, [normalize, maisVendidos]);

  // Função para encontrar produtos do CSV nos produtos disponíveis (otimizada)
  const getProdutosDoCSV = useMemo(() => {
    return (produtosOriginais: Product[], categoria?: string, maxCount?: number) => {
      if (!produtosOriginais.length) return [];
      
      const produtosMap = new Map<string, Product>();
      produtosOriginais.forEach(prod => {
        if (prod.inStock && (!categoria || prod.category === categoria)) {
          produtosMap.set(normalize(prod.name), prod);
        }
      });
      
      const produtosEncontrados: Product[] = [];
      const produtosNaoEncontrados: string[] = [];
      const maisVendidosLote = maxCount ? maisVendidos.slice(0, maxCount) : maisVendidos;
      
      maisVendidosLote.forEach((itemCSV) => {
        const nomeNormalizadoCSV = normalize(itemCSV.nome);
        const produtoEncontrado = produtosMap.get(nomeNormalizadoCSV);
        
        if (produtoEncontrado) {
          produtosEncontrados.push(produtoEncontrado);
        } else {
          produtosNaoEncontrados.push(itemCSV.nome);
        }
      });
      
      // Para produtos não encontrados, tenta encontrar correspondências parciais
      produtosNaoEncontrados.forEach((nomeProduto) => {
        const nomeNormalizadoCSV = normalize(nomeProduto);
        for (const [nome, prod] of produtosMap.entries()) {
          if ((nome.includes(nomeNormalizadoCSV) || nomeNormalizadoCSV.includes(nome)) && 
              prod.inStock && 
              !produtosEncontrados.some(p => p.id === prod.id)) {
            produtosEncontrados.push(prod);
            break;
          }
        }
      });
      
      // Adiciona os produtos da categoria que não estão no CSV no final
      const idsCSV = produtosEncontrados.map(p => p.id);
      const outros = Array.from(produtosMap.values()).filter(p => !idsCSV.includes(p.id));
      return [...produtosEncontrados, ...outros];
    };
  }, [maisVendidos, normalize]);

  // Produtos filtrados por categoria e ordenados por mais vendidos (otimizado)
  const produtosFiltrados = useMemo(() => {
    console.log('🔄 RECALCULANDO produtosFiltrados', { 
      selectedCategory, 
      productsLength: products.length,
      selectedGroup
    });
    
    if (!products.length) return [];
    
    // Se estamos usando as novas APIs (com grupo selecionado ou filtros específicos), 
    // os produtos já vem filtrados da API
    if (selectedGroup || (selectedCategory !== "Todos" && selectedCategory !== "Promoções")) {
      console.log('✅ Usando produtos da API (filtros específicos)');
      return products;
    }
    
    if (selectedCategory === "Todos") {
      console.log('✅ Categoria TODOS - usando CSV');
      return getProdutosDoCSV(products);
    } else if (selectedCategory === "Promoções") {
      console.log('🔥 PROCESSANDO CATEGORIA PROMOÇÕES!');
      // DEBUG: Log inicial
      console.log(`🔍 FILTRO PROMOÇÕES ATIVADO - Total de produtos: ${products.length}`);
      console.log(`🔍 Selected Category: ${selectedCategory}`);
      
      // Filtrar produtos com ofertas ativas usando a função de cálculo
      const produtosComPromocao = products.filter(p => {
        const promotionData = calculatePromotionData(p);
        
        // DEBUG: Log detalhado para os primeiros produtos
        if (products.indexOf(p) < 5) {
          console.log(`DEBUG ${p.id} - ${p.name}:`, {
            hasOffers: promotionData.hasOffers,
            isPromotion: promotionData.isPromotion,
            bestPrice: promotionData.bestPrice,
            originalPrice: promotionData.originalPrice,
            priceSource: promotionData.priceSource,
            price1: promotionData.price1,
            price2: promotionData.price2,
            originalPrice1: promotionData.originalPrice1,
            originalPrice2: promotionData.originalPrice2,
            varejoFacilData: p.varejoFacilData?.precos
          });
        }
        
        // Retornar true se há ofertas (price1 < originalPrice1 OU price2 < originalPrice2)
        const hasPromotion = promotionData.price1 < promotionData.originalPrice1 || 
                           (promotionData.originalPrice2 > 0 && promotionData.price2 < promotionData.originalPrice2);
        
        if (products.indexOf(p) < 5) {
          console.log(`   → ${p.name} tem promoção: ${hasPromotion}`);
        }
        
        return hasPromotion || promotionData.isPromotion;
      });
      
      console.log(`🎯 RESULTADO: ${produtosComPromocao.length} produtos em promoção encontrados`);
      
      // DEBUG: Mostrar alguns produtos encontrados
      if (produtosComPromocao.length > 0) {
        console.log('📋 Primeiros produtos em promoção:', produtosComPromocao.slice(0, 3).map(p => p.name));
      } else {
        console.log('❌ ERRO: Nenhum produto em promoção encontrado!');
        // Verificar se pelo menos um produto tem dados de promoção
        const temDadosVarejoFacil = products.filter(p => p.varejoFacilData?.precos).length;
        console.log(`📊 Produtos com dados varejoFacilData.precos: ${temDadosVarejoFacil}`);
        
        const temOfertas = products.filter(p => 
          p.varejoFacilData?.precos?.precoOferta1 > 0 || 
          p.varejoFacilData?.precos?.precoOferta2 > 0
        ).length;
        console.log(`💰 Produtos com ofertas nos dados: ${temOfertas}`);
      }
      
      return getProdutosDoCSV(produtosComPromocao);
    } else {
      return products;
    }
  }, [products, maisVendidos, selectedCategory, selectedGroup, getProdutosDoCSV, normalize]);

  // Produtos para exibição (com paginação apenas quando não há busca)
  const produtosParaExibir = useMemo(() => {
    // Se há busca, mostrar todos os produtos filtrados (sem paginação)
    if (searchTerm) {
      return produtosFiltrados
    }
    
    // Se não há busca, usar paginação normal
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return produtosFiltrados.slice(startIndex, endIndex)
  }, [produtosFiltrados, currentPage, itemsPerPage, searchTerm])

  // Calcular total de páginas (apenas quando não há busca)
  const totalPages = Math.ceil(produtosFiltrados.length / itemsPerPage)

  // Busca inteligente nos produtos (com tolerância a erros de ortografia)
  const filteredProducts = useMemo(() => {
    console.log('🔍 Calculando filteredProducts:', { 
      searchTerm, 
      selectedGroup, 
      selectedCategory, 
      productsLength: products.length, 
      produtosFiltradosLength: produtosFiltrados.length 
    });
    
    // Se há busca e estamos usando a API (com grupo ou categoria específica), 
    // os produtos já vêm filtrados da API
    if (searchTerm && (selectedGroup || selectedCategory !== 'Todos')) {
      console.log('✅ Usando produtos da API (já filtrados):', products.length);
      return products; // Produtos já filtrados pela API
    }
    
    // Se há busca mas sem filtros específicos, usar busca inteligente local
    if (searchTerm) {
      const searchResults = performSmartSearch(searchTerm, produtosFiltrados);
      console.log('✅ Usando busca inteligente local:', searchResults.length, 'de', produtosFiltrados.length);
      return searchResults;
    }
    
    // Se não há busca, usar produtos com paginação
    console.log('✅ Usando produtos com paginação:', produtosParaExibir.length);
    return produtosParaExibir;
  }, [searchTerm, selectedGroup, selectedCategory, products, performSmartSearch, produtosFiltrados, produtosParaExibir]);

  // useEffect para buscar parâmetros da URL - Corrrigido para evitar o erro React #423
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const qParam = urlParams.get('q');
    const categoryParam = urlParams.get('category');
    const groupParam = urlParams.get('groupId') || urlParams.get('group');
    const typeParam = urlParams.get('type');
    
    console.log('📊 PARÂMETROS DA URL:', { searchParam, qParam, categoryParam, groupParam, typeParam });
    console.log('🌍 URL completa:', window.location.href);
    
    if (categoryParam) {
      console.log(`🎯 Definindo categoria para: ${categoryParam}`);
      setSelectedCategory(categoryParam);
      
      // Se categoria é Promoções, forçar atualização
      if (categoryParam === 'Promoções') {
        console.log('🔥 CATEGORIA PROMOÇÕES DETECTADA NA URL!');
        setTimeout(() => {
          console.log('🔄 Forçando re-render para categoria Promoções');
        }, 100);
      }
    }
    if (groupParam) {
      setSelectedGroup(groupParam);
      // Buscar nome do grupo se categoria já estiver definida
      if (categoryParam || selectedCategory !== "Todos") {
        fetchGroupName(groupParam, categoryParam || selectedCategory);
      }
    }
    if (qParam) {
      setSearchTerm(qParam);
    } else if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, []);

  // Buscar nome do grupo quando selectedGroup ou selectedCategory mudarem (para casos de URL)
  useEffect(() => {
    if (selectedGroup && selectedCategory && selectedCategory !== "Todos" && !selectedGroupName) {
      fetchGroupName(selectedGroup, selectedCategory);
    }
  }, [selectedGroup, selectedCategory, selectedGroupName]);

  // Função para ir para uma página específica
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll suave para o topo dos produtos
      const productsSection = document.getElementById('products-section')
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  // Função para alterar itens por página
  const changeItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset para primeira página
  }

  // Função para limpar filtros
  const clearFilters = () => {
    // Redirecionar para página limpa
    window.location.href = '/catalog'
  }

  // Reset da página quando mudam os filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedGroup])

  // Modal de cadastro
  const [showSignupModal, setShowSignupModal] = useState(false);
  const closeSignupModal = () => setShowSignupModal(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 page-transition" style={{ overflow: 'visible' }}>
      <Header 
        onToggleSidebar={() => {
          setIsSidebarOpen(!isSidebarOpen);
        }}
        showDepartmentsButton={true}
      />
      <PromotionalBanner />
      
      {/* Conteúdo principal (sem sidebar na estrutura) */}
      <div className="container mx-auto px-4 py-8">
        {/* Carrossel de Categorias - Sempre visível */}
        <div className="w-full mb-8 -mx-4">
          <div className="px-4">
            <CategoryCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategoryChange}
            />
          </div>
        </div>



        {/* Botões de navegação - Sempre visíveis */}
        <div className="w-full mb-6 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => handleCategoryChange("Todos")}
            className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
              selectedCategory === "Todos"
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4 inline-block mr-1" /> Todos
          </button>
          <button
            onClick={() => handleCategoryChange("Promoções")}
            className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
              selectedCategory === "Promoções"
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Zap className="w-4 h-4 inline-block mr-1 text-orange-500" /> Promoções
          </button>
        </div>

        {/* Header para resultados filtrados */}
        {(searchTerm || selectedCategory !== "Todos" || selectedGroup) && (
          <div className="text-center mb-8 fade-in-up" id="products-section">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 mb-4 animate-pulse">
              <Sparkles className="h-4 w-4 mr-2" />
              {searchTerm || selectedCategory !== "Todos" ? 'Resultados Filtrados' : 'Catálogo Completo'}
            </Badge>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {searchTerm ? `Busca: "${searchTerm}"` : 
                selectedGroup ? `${selectedCategory} - ${selectedGroupName}` :
                selectedCategory === "Promoções" ? "🔥 Promoções Especiais" :
                selectedCategory !== "Todos" ? selectedCategory : 'Nossos Produtos'}
            </h1>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto">
              {searchTerm && selectedCategory !== "Todos" && selectedGroup
                ? `Pesquisa filtrada por seção "${selectedCategory}" e grupo "${selectedGroupName}" • ${filteredProducts.length} produtos encontrados`
                : searchTerm && selectedCategory !== "Todos" 
                ? `Pesquisa filtrada por seção "${selectedCategory}" • ${filteredProducts.length} produtos encontrados`
                : searchTerm && selectedGroup
                ? `Pesquisa filtrada por grupo "${selectedGroupName}" • ${filteredProducts.length} produtos encontrados`
                : searchTerm 
                ? `Encontramos ${filteredProducts.length} produtos para "${searchTerm}"`
                : selectedGroup
                ? `${products.length} produtos em ${selectedGroupName}`
                : selectedCategory === "Promoções"
                ? `${produtosFiltrados.length} produtos em promoção com descontos especiais`
                : selectedCategory !== "Todos"
                ? `${produtosFiltrados.length} produtos em ${selectedCategory}`
                : 'Encontre os melhores produtos para sua casa com preços que cabem no seu bolso'
              }
            </p>
            {/* Botão para limpar busca */}
            {searchTerm && (
              <div className="mt-4">
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-all duration-200 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Limpar busca e ver todos os produtos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading state apenas para produtos */}
        {productsLoading ? (
          <div className="flex flex-col items-center justify-center py-32 w-full">
            <span className="animate-spin rounded-full h-24 w-24 border-t-8 border-b-8 border-orange-500 mb-10"></span>
            <h2 className="text-4xl font-extrabold text-orange-600 mb-4">Carregando produtos...</h2>
          </div>
        ) : (
          <div id="products-section" ref={resultsRef}>
            {/* Products Grid */}
            <div className={`
              grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
              ${isLoadingMore ? 'opacity-90' : ''}
            `}>
              {filteredProducts.map((product: Product, index: number) => (
                <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.03}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            {/* Controles de Paginação - Só mostrar quando não há busca */}
            {totalPages > 1 && !searchTerm && (
              <div className="mt-12 space-y-8">
                {/* Informações da página */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-100">
                    <span className="text-gray-600">Página</span>
                    <span className="font-bold text-orange-600 text-lg">{currentPage}</span>
                    <span className="text-gray-400">de</span>
                    <span className="font-bold text-orange-600 text-lg">{totalPages}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, produtosFiltrados.length)} de {produtosFiltrados.length} produtos
                    </span>
                  </div>
                </div>

                {/* Navegação de páginas - Versão simplificada e bonita */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center bg-white rounded-full shadow-lg border border-gray-100 overflow-hidden">
                    {/* Botão anterior */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      ← Anterior
                    </button>

                    {/* Separador */}
                    {currentPage > 1 && (
                      <div className="w-px h-6 bg-gray-200"></div>
                    )}

                    {/* Números das páginas - Versão compacta */}
                    <div className="flex items-center">
                      {(() => {
                        const pages = []
                        const maxVisible = 3
                        let startPage = Math.max(1, currentPage - 1)
                        let endPage = Math.min(totalPages, currentPage + 1)

                        // Sempre mostrar pelo menos 3 páginas se possível
                        if (endPage - startPage < 2) {
                          if (startPage === 1) {
                            endPage = Math.min(totalPages, startPage + 2)
                          } else if (endPage === totalPages) {
                            startPage = Math.max(1, endPage - 2)
                          }
                        }

                        // Primeira página se não estiver visível
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => goToPage(1)}
                              className="px-3 py-3 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200"
                            >
                              1
                            </button>
                          )
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 py-3 text-gray-400 text-sm">…</span>
                            )
                          }
                        }

                        // Páginas visíveis
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => goToPage(i)}
                              className={`px-3 py-3 text-sm font-medium transition-all duration-200 ${
                                i === currentPage
                                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                              }`}
                            >
                              {i}
                            </button>
                          )
                        }

                        // Última página se não estiver visível
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 py-3 text-gray-400 text-sm">…</span>
                            )
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => goToPage(totalPages)}
                              className="px-3 py-3 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200"
                            >
                              {totalPages}
                            </button>
                          )
                        }

                        return pages
                      })()}
                    </div>

                    {/* Separador */}
                    {currentPage < totalPages && (
                      <div className="w-px h-6 bg-gray-200"></div>
                    )}

                    {/* Botão próximo */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        currentPage === totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      Próximo →
                    </button>
                  </div>
                </div>

                {/* Seletor de itens por página - Mais discreto */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-3 text-sm text-gray-600">
                    <span>Mostrar:</span>
                    <div className="flex gap-1">
                      {[12, 24, 48, 96].map((size) => (
                        <button
                          key={size}
                          onClick={() => changeItemsPerPage(size)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            itemsPerPage === size
                              ? 'bg-orange-100 text-orange-600 border border-orange-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <span>por página</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {filteredProducts.length === 0 && !productsLoading && (searchTerm || selectedCategory !== "Todos" || selectedGroup) && (
          <div className="text-center py-16 fade-in-up">
            <div className="text-8xl mb-6 animate-bounce">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhum produto encontrado</h3>
            <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
              Não encontramos produtos com os filtros selecionados. Tente ajustar sua busca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={clearFilters}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Limpar Todos os Filtros
              </Button>
              <Button
                onClick={clearSearch}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Target className="w-4 h-4 mr-2" />
                Limpar Busca
              </Button>
              <Button
                onClick={() => setSelectedCategory("Todos")}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Target className="w-4 h-4 mr-2" />
                Todos os Produtos
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar como overlay - só aparece quando categoria é selecionada E está aberto */}
      <CatalogSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        selectedGroup={selectedGroup}
        onCategoryChange={handleCategoryChange}
        onGroupChange={handleGroupChange}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Modal de Cadastro */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center relative animate-fade-in">
            <button onClick={closeSignupModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl">×</button>
            <div className="mb-4">
              <img src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" alt="Logo" className="h-16 w-16 rounded-full mx-auto shadow-lg" />
            </div>
            <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">Crie sua conta e aproveite ofertas exclusivas!</h2>
            <p className="text-gray-600 text-center mb-6">Receba descontos, acompanhe seus pedidos e tenha uma experiência completa no Atacadão Guanabara.</p>
            <Link href="/register" className="w-full">
              <button className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-3 rounded-lg shadow hover:from-orange-500 hover:to-orange-600 transition mb-2">Criar Conta Grátis</button>
            </Link>
            <button onClick={closeSignupModal} className="w-full text-gray-500 hover:text-blue-600 text-sm mt-1">Agora não</button>
          </div>
        </div>
      )}

      <Footer />
      
      {/* Carrinho flutuante moderno */}
      {showFloatingCart && (
        <div className="fixed inset-0 z-50 lg:inset-auto lg:top-20 lg:right-4 lg:bottom-auto">
          {/* Overlay para mobile */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setShowFloatingCart(false)}
          />
          
          {/* Container do carrinho */}
          <div className="absolute bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-white rounded-t-3xl lg:rounded-2xl shadow-2xl border border-gray-200 w-full lg:w-96 max-h-[80vh] lg:max-h-[32rem] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Seu Carrinho</h3>
                  <p className="text-sm text-gray-600">
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowFloatingCart(false)}
                className="hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Lista de itens */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-lg mb-2">Carrinho vazio</p>
                  <p className="text-sm">Adicione produtos para começar suas compras</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="relative">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-16 h-16 object-contain rounded-lg bg-white border border-gray-200" 
                        />
                        <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-blue-500 text-xs">
                          {item.quantity}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600 mb-1">{item.product.category}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-blue-600">
                            R$ {(item.product.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            R$ {item.product.price.toFixed(2)} cada
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full flex-shrink-0"
                        onClick={() => handleRemoveFromCart(item.product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer com total e ações */}
            {items.length > 0 && (
              <div className="p-4 lg:p-6 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-green-600">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3" asChild>
                    <Link href="/cart">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Finalizar Compra
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                      onClick={() => setShowFloatingCart(false)}
                    >
                      Continuar Comprando
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={clearCart}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Botão do carrinho flutuante */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button 
          className="rounded-full h-16 w-16 shadow-2xl relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-4 border-white transform hover:scale-110 transition-all duration-300"
          onClick={() => setShowFloatingCart(!showFloatingCart)}
        >
          <ShoppingCart className="w-7 h-7 text-white" />
          {items.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center p-0 bg-red-600 border-2 border-white text-white font-bold animate-bounce">
              {items.reduce((total, item) => total + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </div>
      
      {/* Componente para capturar parâmetros de busca da URL */}
      <Suspense fallback={null}>
        <SearchParamsClient onSearchParams={handleSearchParams} />
      </Suspense>
      
      <style jsx>{`
        @keyframes pop-in { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .pop-in { animation: pop-in 0.35s cubic-bezier(.2,.7,.3,1) both; }
      `}</style>
    </div>
  );
}