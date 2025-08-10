'use client'

import { useState, useRef } from 'react'
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Camera, 
  Package, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  ShoppingBag,
  Image as ImageIcon
} from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ReturnFormData {
  orderId: string
  userName: string
  userEmail: string
  userPhone: string
  productName: string
  productId: string
  quantity: number
  requestType: 'exchange' | 'refund'
  reason: string
  description: string
  photos: File[]
}

const reasons = [
  'Produto com defeito',
  'Produto não corresponde à descrição',
  'Produto danificado na entrega',
  'Tamanho/Modelo incorreto',
  'Produto vencido',
  'Produto em mau estado',
  'Erro no pedido',
  'Outro motivo'
]

export default function ReturnsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState<ReturnFormData>({
    orderId: '',
    userName: '',
    userEmail: '',
    userPhone: '',
    productName: '',
    productId: '',
    quantity: 1,
    requestType: 'exchange',
    reason: '',
    description: '',
    photos: []
  })

  const handleInputChange = (field: keyof ReturnFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (formData.photos.length + imageFiles.length > 5) {
      alert('Máximo de 5 fotos permitido')
      return
    }

    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...imageFiles]
    }))
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Criar FormData para enviar arquivos
      const formDataToSend = new FormData()
      formDataToSend.append('orderId', formData.orderId)
      formDataToSend.append('userName', formData.userName)
      formDataToSend.append('userEmail', formData.userEmail)
      formDataToSend.append('userPhone', formData.userPhone)
      formDataToSend.append('productName', formData.productName)
      formDataToSend.append('productId', formData.productId || '')
      formDataToSend.append('quantity', formData.quantity.toString())
      formDataToSend.append('requestType', formData.requestType)
      formDataToSend.append('reason', formData.reason)
      formDataToSend.append('description', formData.description || '')
      
      // Adicionar fotos
      formData.photos.forEach((photo, index) => {
        formDataToSend.append('photos', photo)
      })

      // Enviar para a API Next.js
      const response = await fetch('/api/return-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          userName: formData.userName,
          reason: formData.reason,
          description: formData.description || '',
          requestType: formData.requestType,
          productName: formData.productName,
          quantity: formData.quantity
        })
      })

      if (!response.ok) {
        throw new Error('Erro na resposta da API')
      }

      const result = await response.json()
      
      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        throw new Error(result.message || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error)
      alert('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitação Enviada!
            </h1>
            <p className="text-gray-600 mb-6">
              Sua solicitação de {formData.requestType === 'exchange' ? 'troca' : 'devolução'} foi enviada com sucesso. 
              Entraremos em contato em breve.
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">
                Número da solicitação: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Solicitar Troca ou Devolução
            </h1>
            <p className="text-gray-600">
              Preencha o formulário abaixo para solicitar uma troca ou devolução de produtos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações do Pedido */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Informações do Pedido
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Pedido *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.orderId}
                    onChange={(e) => handleInputChange('orderId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 1753957271946"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do produto"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Solicitação *
                  </label>
                  <select
                    required
                    value={formData.requestType}
                    onChange={(e) => handleInputChange('requestType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="exchange">Troca</option>
                    <option value="refund">Devolução</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Informações Pessoais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.userEmail}
                    onChange={(e) => handleInputChange('userEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.userPhone}
                    onChange={(e) => handleInputChange('userPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(85) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Motivo e Descrição */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Detalhes da Solicitação
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Solicitação *
                  </label>
                  <select
                    required
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um motivo</option>
                    {reasons.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição Detalhada
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva detalhadamente o problema ou motivo da solicitação..."
                  />
                </div>
              </div>
            </div>

            {/* Upload de Fotos */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-blue-600" />
                Fotos do Produto
              </h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Adicione fotos do produto para facilitar a análise. Máximo 5 fotos.
                </p>
                
                {/* Área de Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Clique para selecionar fotos ou arraste aqui
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG até 5MB cada
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
                    Selecionar Fotos
                  </Button>
                </div>

                {/* Preview das Fotos */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 
