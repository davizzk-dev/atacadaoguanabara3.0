import { useState, useEffect } from 'react'
import { Trash, Edit, Plus } from 'lucide-react'

export default function AdminBairrosFrete() {
  interface BairroFrete {
    nome: string;
    valor: number;
  }
  const [bairros, setBairros] = useState<BairroFrete[]>([])
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [editNome, setEditNome] = useState('')
  const [editValor, setEditValor] = useState('')
  const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

  // Carrega bairros
  const loadBairros = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-bairros-frete')
      if (!res.ok) throw new Error('Erro ao carregar bairros')
      setBairros(await res.json())
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar bairros')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadBairros() }, [])

  // Adiciona bairro
  const handleAdd = async () => {
    setError('')
    setSuccess('')
    if (!nome.trim() || !valor.trim()) {
      setError('Preencha o nome e valor do bairro!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin-bairros-frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), valor: Number(valor) })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao adicionar bairro')
      }
      setSuccess('Bairro adicionado!')
      setNome('')
      setValor('')
      loadBairros()
    } catch (e: any) {
      setError(e.message || 'Erro ao adicionar bairro')
    } finally {
      setLoading(false)
    }
  }

  // Remove bairro
  const handleRemove = async (nome: string) => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin-bairros-frete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao remover bairro')
      }
      setSuccess('Bairro removido!')
      loadBairros()
    } catch (e: any) {
      setError(e.message || 'Erro ao remover bairro')
    } finally {
      setLoading(false)
    }
  }

  // Edita valor
  const handleEdit = async () => {
    setError('')
    setSuccess('')
    if (!editNome.trim() || !editValor.trim()) {
      setError('Preencha o nome e valor!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin-bairros-frete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editNome.trim(), valor: Number(editValor) })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao editar bairro')
      }
      setSuccess('Bairro editado!')
      setIsEditing(false)
      setEditNome('')
      setEditValor('')
      loadBairros()
    } catch (e: any) {
      setError(e.message || 'Erro ao editar bairro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Bairros e Frete</h2>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-2">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-2">{success}</div>}
      {loading && <div className="text-gray-500 mb-2">Carregando...</div>}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nome do bairro"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="border p-2 rounded w-1/2"
        />
        <input
          type="number"
          placeholder="Valor do frete"
          value={valor}
          onChange={e => setValor(e.target.value)}
          className="border p-2 rounded w-1/2"
        />
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1" disabled={loading}><Plus size={16}/>Adicionar</button>
      </div>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">Bairro</th>
            <th className="border p-2">Frete</th>
            <th className="border p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {bairros.map((b) => (
            <tr key={b.nome}>
              <td className="border p-2">{b.nome}</td>
              <td className="border p-2">{isEditing && editNome === b.nome ? (
                <input type="number" value={editValor} onChange={e => setEditValor(e.target.value)} className="border p-1 rounded w-20" />
              ) : b.valor}
              </td>
              <td className="border p-2 flex gap-2">
                {isEditing && editNome === b.nome ? (
                  <button onClick={handleEdit} className="bg-blue-600 text-white px-2 py-1 rounded" disabled={loading}>Salvar</button>
                ) : (
                  <button onClick={() => {setIsEditing(true); setEditNome(b.nome); setEditValor(String(b.valor))}} className="bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1"><Edit size={16}/>Editar</button>
                )}
                <button onClick={() => handleRemove(b.nome)} className="bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1" disabled={loading}><Trash size={16}/>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
