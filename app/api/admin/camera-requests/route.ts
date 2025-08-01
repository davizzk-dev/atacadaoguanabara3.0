import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Ler dados do arquivo JSON
    const dataDir = path.join(process.cwd(), 'data')
    const cameraRequestsData = JSON.parse(await fs.readFile(path.join(dataDir, 'camera-requests.json'), 'utf-8'))
    
    return NextResponse.json(cameraRequestsData)
  } catch (error) {
    console.error('Erro ao buscar solicitações de câmera:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json([])
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/camera-requests/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao atualizar solicitação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da solicitação é obrigatório' }, { status: 400 })
    }
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/camera-requests/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ message: 'Solicitação deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar solicitação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 