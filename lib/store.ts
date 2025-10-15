"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { signOut } from 'next-auth/react'
import type { CartItem, Product, User, Order } from "./types"

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
  register: (userData: Omit<User, 'id'>) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  loadUserProfile: () => void
  refreshUserData: () => Promise<void>
}

interface FavoritesStore {
  favorites: string[]
  addFavorite: (productId: string) => void
  removeFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
}

interface OrderStore {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: Order["status"]) => void
  returnOrderToCart: (order: Order) => void
}

interface UIStore {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items
        
        // Para produtos de peso, sempre adicionar como item único
        if ((product as any).isWeightProduct || (product as any).weightInGrams) {
          // Criar um ID único para produtos de peso incluindo a gramatura
          const uniqueId = `${product.id}-${(product as any).weightInGrams || 'weight'}-${Date.now()}`
          const weightProduct = {
            ...product,
            id: uniqueId,
            originalId: product.id
          }
          set({ items: [...items, { product: weightProduct, quantity: 1 }] })
          return
        }
        
        // Para produtos normais, agrupar por ID como antes
        const existingItem = items.find((item) => item.product.id === product.id)

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          })
        } else {
          set({ items: [...items, { product, quantity: 1 }] })
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.product.id !== productId) })
      },
      updateQuantity: (productId, quantity) => {
        const items = get().items;
        const existingItem = items.find((item) => item.product.id === productId);

        if (quantity <= 0) {
          // Remove o item se a quantidade for 0 ou menor
          set({ items: items.filter((item) => item.product.id !== productId) });
          return;
        }

        if (existingItem) {
          // Recalcula o preço unitário conforme a nova quantidade
          const calculateDynamicPrice = (product: any, qty: number) => {
            // Prioriza priceAtacado, depois precoVenda2 dos objetos prices/varejoFacilData
            const price2 = product.priceAtacado > 0
              ? product.priceAtacado
              : product.prices?.precoVenda2 > 0
                ? product.prices.precoVenda2
                : product.varejoFacilData?.precos?.precoVenda2 || 0;
            const minQuantityPrice2 = product.prices?.quantidadeMinimaPreco2 > 1
              ? product.prices.quantidadeMinimaPreco2
              : product.varejoFacilData?.precos?.quantidadeMinimaPreco2 || 0;
            const price3 = product.prices?.price3 || product.varejoFacilData?.precos?.precoVenda3 || 0;
            const minQuantityPrice3 = product.prices?.minQuantityPrice3 || product.varejoFacilData?.precos?.quantidadeMinimaPreco3 || 0;
            if (price3 && minQuantityPrice3 && qty >= minQuantityPrice3) {
              return price3;
            } else if (price2 && minQuantityPrice2 && qty >= minQuantityPrice2) {
              return price2;
            } else {
              return product.price;
            }
          };
          const newPrice = calculateDynamicPrice(existingItem.product, quantity);
          set({
            items: items.map((item) =>
              item.product.id === productId
                ? { ...item, quantity, product: { ...item.product, price: newPrice } }
                : item
            ),
          });
        } else {
          // Se não existe o item, não deveria chegar aqui, mas por segurança
          console.warn('Tentando atualizar quantidade de item que não existe:', productId);
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          // Importar função de cálculo dinâmico
          const calculateDynamicPrice = (product: any, quantity: number) => {
            const price2 = product.priceAtacado > 0
              ? product.priceAtacado
              : product.prices?.precoVenda2 > 0
                ? product.prices.precoVenda2
                : product.varejoFacilData?.precos?.precoVenda2 || 0;
            const minQuantityPrice2 = product.prices?.quantidadeMinimaPreco2 > 1
              ? product.prices.quantidadeMinimaPreco2
              : product.varejoFacilData?.precos?.quantidadeMinimaPreco2 || 0;
            const price3 = product.prices?.price3 || product.varejoFacilData?.precos?.precoVenda3 || 0;
            const minQuantityPrice3 = product.prices?.minQuantityPrice3 || product.varejoFacilData?.precos?.quantidadeMinimaPreco3 || 0;
            if (price3 && minQuantityPrice3 && quantity >= minQuantityPrice3) {
              return price3;
            } else if (price2 && minQuantityPrice2 && quantity >= minQuantityPrice2) {
              return price2;
            } else {
              return product.price;
            }
          };

          const dynamicPrice = calculateDynamicPrice(item.product, item.quantity);
          const quantity = Number(item.quantity) || 0;
          return total + (dynamicPrice * quantity);
        }, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => {
        const currentUser = get().user
        
        // Se está trocando de usuário (IDs diferentes), limpar dados pessoais
        if (currentUser && user && currentUser.id !== user.id) {
          console.log('🔄 Detectada troca de usuário, limpando dados pessoais...')
          try {
            const keysToRemove = [
              'cartFormData',
              'user-profile',
              'settings-modal-data',
              'checkout-form-data',
              'delivery-address'
            ]
            
            keysToRemove.forEach(key => {
              localStorage.removeItem(key)
            })
            
            console.log('🧹 Dados pessoais limpos na troca de usuário')
          } catch (error) {
            console.error('Erro ao limpar localStorage na troca de usuário:', error)
          }
        }
        
        set({ user })
      },
      logout: () => {
        // Primeiro limpar o estado
        set({ user: null })
        
        // Limpar todos os dados pessoais do localStorage
        try {
          // Lista de chaves que podem conter dados pessoais
          const keysToRemove = [
            'cartFormData',
            'user-profile',
            'settings-modal-data',
            'checkout-form-data',
            'delivery-address',
            'auth-storage' // Adicionar o auth-storage também
          ]
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
          })
          
          // Força a limpeza do persist do Zustand
          localStorage.removeItem('auth-storage')
          
          console.log('🧹 localStorage completamente limpo no logout')
        } catch (error) {
          console.error('Erro ao limpar localStorage:', error)
        }
        
        // Fazer signOut do NextAuth
        signOut({ callbackUrl: '/' })
      },
      register: async (userData) => {
        try {
          console.log('[STORE] Iniciando registro com dados:', JSON.stringify(userData, null, 2))
          
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          })
          
          console.log('[STORE] Response status:', response.status)
          console.log('[STORE] Response ok:', response.ok)
          
          if (response.ok) {
            const result = await response.json()
            console.log('[STORE] Response result:', result)
            
            // Verificar se a resposta tem sucesso e dados
            if (result.success && result.data) {
              set({ user: result.data })
              return true
            }
            // Compatibilidade com resposta antiga
            if (result.id) {
              set({ user: result })
              return true
            }
          } else {
            // Se não foi 200, vamos ver o erro
            const errorData = await response.json()
            console.error('[STORE] Erro na resposta da API:', errorData)
          }
          return false
        } catch (error) {
          console.error('[STORE] Erro no registro:', error)
          return false
        }
      },
      login: async (email, password) => {
        try {
          // Verificar se é admin com as credenciais especificadas
          if (email === 'admin' && password === 'atacadaoguanabaraadmin123secreto') {
            set({ user: { id: 'admin', name: 'Administrador', email: 'admin', phone: '', role: 'admin' } })
            return true
          }

          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          
          if (response.ok) {
            const result = await response.json()
            // Verificar se a resposta tem sucesso e dados
            if (result.success && result.data) {
              set({ user: result.data })
              return true
            }
            // Compatibilidade com resposta antiga
            if (result.id) {
              set({ user: result })
              return true
            }
          }
          return false
        } catch (error) {
          console.error('Erro no login:', error)
          return false
        }
      },
      loadUserProfile: () => {
        const currentUser = get().user
        if (currentUser) {
          try {
            const savedProfile = localStorage.getItem('user-profile')
            if (savedProfile) {
              const profileData = JSON.parse(savedProfile)
              // Mesclar dados salvos com dados atuais do usuário
              const updatedUser = { ...currentUser, ...profileData }
              
              // Só atualizar se realmente houver mudanças
              const hasChanges = JSON.stringify(currentUser) !== JSON.stringify(updatedUser)
              if (hasChanges) {
                set({ user: updatedUser })
              }
            }
          } catch (error) {
            console.error('Erro ao carregar perfil do localStorage:', error)
          }
        }
      },
      refreshUserData: async () => {
        const currentUser = get().user
        if (currentUser?.email) {
          try {
            console.log('🔄 Atualizando dados do usuário:', currentUser.email)
            
            const response = await fetch('/api/users/by-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: currentUser.email })
            })

            if (response.ok) {
              const userData = await response.json()
              if (userData && userData.id) {
                console.log('✅ Dados atualizados do servidor:', userData.name)
                set({ 
                  user: {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone || '',
                    role: userData.role || 'user',
                    address: userData.address,
                    provider: userData.provider,
                  }
                })
              }
            }
          } catch (error) {
            console.error('Erro ao atualizar dados do usuário:', error)
          }
        }
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (productId) => {
        set({ favorites: [...get().favorites, productId] })
      },
      removeFavorite: (productId) => {
        set({ favorites: get().favorites.filter((id) => id !== productId) })
      },
      isFavorite: (productId) => {
        return get().favorites.includes(productId)
      },
    }),
    {
      name: "favorites-storage",
    },
  ),
)

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => {
        set({ orders: [order, ...get().orders] })
      },
      updateOrderStatus: (orderId, status) => {
        set({
          orders: get().orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
        })
      },
      returnOrderToCart: (order) => {
        // Esta função será implementada para adicionar os produtos do pedido ao carrinho
        // Será chamada da página de pedidos
        console.log('Retornando pedido ao carrinho:', order)
      },
    }),
    {
      name: "orders-storage",
      partialize: (state) => state,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Converter strings de data de volta para objetos Date
          state.orders = state.orders.map(order => ({
            ...order,
            createdAt: new Date(order.createdAt),
            estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
          }))
        }
      },
    },
  ),
)

export const useUIStore = create<UIStore>()((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedCategory: "Todos",
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}))
