'use client'

import { useState } from 'react'

interface TestResult {
  endpoint: string
  success: boolean
  data?: any
  error?: string
  timestamp: string
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      const response = await fetch(`/api/varejo-facil${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const result = await response.json()
      
      return {
        endpoint,
        success: response.ok,
        data: result,
        error: !response.ok ? result.error || 'Erro desconhecido' : undefined,
        timestamp: new Date().toLocaleString('pt-BR')
      }
    } catch (error: any) {
      return {
        endpoint,
        success: false,
        error: error.message || 'Erro de conexão',
        timestamp: new Date().toLocaleString('pt-BR')
      }
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setResults([])

    const tests = [
      { endpoint: '/sections', method: 'GET' },
      { endpoint: '/brands', method: 'GET' },
      { endpoint: '/products', method: 'GET' },
    ]

    const newResults: TestResult[] = []

    for (const test of tests) {
      const result = await testEndpoint(test.endpoint, test.method)
      newResults.push(result)
      setResults([...newResults])
    }

    setLoading(false)
  }

  const testSync = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/sync-varejo-facil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const result = await response.json()
      
      setResults(prev => [...prev, {
        endpoint: '/sync-varejo-facil',
        success: response.ok,
        data: result,
        error: !response.ok ? result.error || 'Erro desconhecido' : undefined,
        timestamp: new Date().toLocaleString('pt-BR')
      }])
    } catch (error: any) {
      setResults(prev => [...prev, {
        endpoint: '/sync-varejo-facil',
        success: false,
        error: error.message || 'Erro de conexão',
        timestamp: new Date().toLocaleString('pt-BR')
      }])
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🧪 Teste da API Varejo Fácil
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Configuração da API
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Base URL:</strong> https://atacadaoguanabara.varejofacil.com</p>
              <p><strong>API Key:</strong> 2625e98175832a17a954db9beb60306a</p>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
            >
              {loading ? '🔄 Testando...' : '🧪 Executar Todos os Testes'}
            </button>
            
            <button
              onClick={testSync}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
            >
              {loading ? '🔄 Sincronizando...' : '🔄 Testar Sincronização'}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Resultados dos Testes
            </h2>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">
                      {result.success ? '✅' : '❌'} {result.endpoint}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {result.timestamp}
                    </span>
                  </div>
                  
                  {result.success ? (
                    <div className="text-sm text-gray-600">
                      <p><strong>Status:</strong> Sucesso</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            Ver dados da resposta
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      <p><strong>Erro:</strong> {result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Endpoints Disponíveis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">📦 Produtos</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>GET /api/varejo-facil/products</li>
                <li>POST /api/varejo-facil/products</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">📂 Seções</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>GET /api/varejo-facil/sections</li>
                <li>POST /api/varejo-facil/sections</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">🏷️ Marcas</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>GET /api/varejo-facil/brands</li>
                <li>POST /api/varejo-facil/brands</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-orange-800 mb-2">🔄 Sincronização</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>POST /api/sync-varejo-facil</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 