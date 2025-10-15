'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Package, Grid3X3, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Group {
  id: string
  nome: string
  totalProdutos: number
}

interface CatalogSidebarProps {
  categories: string[]
  selectedCategory: string
  selectedGroup: string | null
  onCategoryChange: (category: string) => void
  onGroupChange: (groupId: string | null) => void
  isOpen: boolean
  onToggle: () => void
}

export default function CatalogSidebar({
  categories,
  selectedCategory,
  selectedGroup,
  onCategoryChange,
  onGroupChange,
  isOpen,
  onToggle
}: CatalogSidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [groups, setGroups] = useState<{ [key: string]: Group[] }>({})
  const [loadingGroups, setLoadingGroups] = useState<{ [key: string]: boolean }>({})
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchGroups = async (category: string) => {
    if (groups[category] || loadingGroups[category] || category === 'Todos' || category === 'Promoções') {
      return
    }

    setLoadingGroups(prev => ({ ...prev, [category]: true }))
    try {
      const response = await fetch(`/api/catalog/groups?category=${encodeURIComponent(category)}`)
      if (response.ok) {
        const groupsData = await response.json()
        setGroups(prev => ({ ...prev, [category]: groupsData }))
      }
    } catch (error) {
      console.error('Erro ao buscar grupos:', error)
    } finally {
      setLoadingGroups(prev => ({ ...prev, [category]: false }))
    }
  }

  const handleCategoryClick = (category: string) => {
    onCategoryChange(category)
    onGroupChange(null)
    
    // Expandir/colapsar categoria e buscar grupos
    if (category === 'Todos' || category === 'Promoções') {
      setExpandedCategory(null)
    } else {
      if (expandedCategory === category) {
        setExpandedCategory(null)
      } else {
        setExpandedCategory(category)
        fetchGroups(category)
      }
    }
  }

  const handleGroupClick = (groupId: string) => {
    if (selectedGroup === groupId) {
      onGroupChange(null)
    } else {
      onGroupChange(groupId)
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Principal */}
      <div className={`
        fixed top-0 left-0 h-screen w-80 bg-white shadow-2xl z-[100]
        transform transition-all duration-300 ease-out border-r border-gray-100 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header Simples */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-800 font-semibold text-lg">Categorias</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-gray-600 hover:bg-gray-100 p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3 pb-8">
            
            {/* Categoria Todos */}
            <button
              onClick={() => handleCategoryClick('Todos')}
              className={`
                w-full flex items-center p-3 text-left transition-colors
                ${selectedCategory === 'Todos' 
                  ? 'bg-blue-50 text-blue-700 border-l-3 border-blue-500' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Grid3X3 className="w-4 h-4 mr-3" />
              <span>Todos os Produtos</span>
            </button>

            {/* Outras Categorias */}
            {categories.filter(cat => cat !== 'Todos').map((category) => (
              <div key={category}>
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    w-full flex items-center justify-between p-3 text-left transition-all duration-200
                    ${selectedCategory === category 
                      ? 'bg-blue-50 text-blue-700 border-l-3 border-blue-500' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-3" />
                    <span>{category}</span>
                  </div>
                  {category !== 'Promoções' && (
                    <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                      expandedCategory === category ? 'rotate-90' : ''
                    }`} />
                  )}
                </button>

                {/* Grupos expandidos com animação */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedCategory === category && category !== 'Promoções' 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-6 mt-2 space-y-1 bg-gray-50 rounded-lg p-2">
                    {loadingGroups[category] ? (
                      <div className="text-xs text-gray-500 p-2 flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent mr-2"></div>
                        Carregando...
                      </div>
                    ) : groups[category]?.length > 0 ? (
                      groups[category].map((group) => (
                        <button
                          key={group.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGroupClick(group.id)
                          }}
                          className={`
                            w-full flex items-center justify-between p-2 rounded text-sm text-left transition-all duration-200
                            ${selectedGroup === group.id 
                              ? 'bg-blue-100 text-blue-700 transform scale-[1.02]' 
                              : 'text-gray-600 hover:bg-white hover:text-gray-700 hover:scale-[1.01]'
                            }
                          `}
                        >
                          <span className="truncate">{group.nome}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {group.totalProdutos}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 p-2">Nenhum grupo disponível</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}