'use client'

import { useState, useRef } from 'react'
import { Upload, Link, Copy, X, Image as ImageIcon } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function ImageUpload({ value, onChange, placeholder = "URL da imagem", className = "" }: ImageUploadProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'paste'>('url')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState(value)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type)
            const file = new File([blob], 'pasted-image.png', { type })
            handleFileSelect(file)
            return
          }
        }
      }
      alert('Nenhuma imagem encontrada na área de transferência')
    } catch (error) {
      console.error('Erro ao colar imagem:', error)
      alert('Erro ao colar imagem. Verifique se há uma imagem na área de transferência.')
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
    }
  }

  const clearImage = () => {
    onChange('')
    setUrlInput('')
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview da imagem */}
      {value && (
        <div className="relative">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-32 object-cover rounded-lg border"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          type="button"
          variant={activeTab === 'url' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('url')}
          className="flex-1"
        >
          <Link className="h-4 w-4 mr-2" />
          URL
        </Button>
        <Button
          type="button"
          variant={activeTab === 'file' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('file')}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Arquivo
        </Button>
        <Button
          type="button"
          variant={activeTab === 'paste' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('paste')}
          className="flex-1"
        >
          <Copy className="h-4 w-4 mr-2" />
          Colar
        </Button>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <Label htmlFor="image-url">URL da imagem</Label>
          <div className="flex space-x-2">
            <Input
              id="image-url"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={placeholder}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button type="button" onClick={handleUrlSubmit}>
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'file' && (
        <div className="space-y-2">
          <Label>Selecionar arquivo</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Arraste uma imagem aqui ou clique para selecionar
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {activeTab === 'paste' && (
        <div className="space-y-2">
          <Label>Colar imagem</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Copy className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Cole uma imagem da área de transferência
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handlePaste}
            >
              Colar Imagem
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 