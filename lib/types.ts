export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image?: string
  category: string
  description: string
  stock: number
  rating: number
  reviews: number
  isOnSale?: boolean
  discount?: number
  isFavorite?: boolean
  tags?: string[]
  brand?: string
  unit?: string
  inStock?: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  customerInfo: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    zipCode: string
    complement?: string
  }
  status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled"
  createdAt: Date
  estimatedDelivery?: Date
  paymentMethod?: string
  notes?: string
}

export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: "user" | "admin"
  createdAt?: string
  updatedAt?: string
  orders?: number
  totalSpent?: number
  lastOrder?: string | null
  isClient?: boolean
}

export interface Promotion {
  id: string
  title: string
  description: string
  discount: number
  validUntil: Date
  image: string
  isActive: boolean
}

export interface ProductPromotion {
  id: string
  productId: string
  productName: string
  originalPrice: number
  newPrice: number
  discount: number
  image: string
  isActive: boolean
  createdAt: Date
  validUntil?: Date
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: Date
}
