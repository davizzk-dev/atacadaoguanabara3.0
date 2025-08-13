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
        const items = get().items
        const existingItem = items.find((item) => item.product.id === productId)

        if (quantity <= 0) {
          // Remove o item se a quantidade for 0 ou menor
          set({ items: items.filter((item) => item.product.id !== productId) })
          return
        }

        if (existingItem) {
          // Atualiza a quantidade do item existente
          set({
            items: items.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
          })
        } else {
          // Se não existe o item, não deveria chegar aqui, mas por segurança
          console.warn('Tentando atualizar quantidade de item que não existe:', productId)
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          // Importar função de cálculo dinâmico
          const calculateDynamicPrice = (product: any, quantity: number) => {
            if (!product.prices?.price2 || !product.prices.minQuantityPrice2 || product.prices.minQuantityPrice2 <= 0) {
              return product.price
            }
            const { price2, price3, minQuantityPrice2, minQuantityPrice3 } = product.prices
            if (price3 && minQuantityPrice3 && quantity >= minQuantityPrice3) {
              return price3
            } else if (price2 && minQuantityPrice2 && quantity >= minQuantityPrice2) {
              return price2
            } else {
              return product.price
            }
          }

          const dynamicPrice = calculateDynamicPrice(item.product, item.quantity)
          const quantity = Number(item.quantity) || 0
          return total + (dynamicPrice * quantity)
        }, 0)
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
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null })
        signOut({ callbackUrl: '/' })
      },
      register: async (userData) => {
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
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
          console.error('Erro no registro:', error)
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
