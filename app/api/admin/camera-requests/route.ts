import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Dados simulados de solicitações de câmera
    const cameraRequests = [
      {
        id: '1',
        name: 'Carlos Oliveira',
        phone: '85999887766',
        cause: 'Perda de produto',
        createdAt: '2024-01-15T08:30:00Z',
        status: 'pending',
        period: '2024-01-15 14:30',
        moment: 'Durante a compra',
        rg: '1234567890',
        additionalInfo: 'Produto caiu no chão e quebrou'
      },
      {
        id: '2',
        name: 'Ana Paula',
        phone: '85988776655',
        cause: 'Dúvida sobre preço',
        createdAt: '2024-01-14T15:20:00Z',
        status: 'processing',
        period: '2024-01-14 16:45',
        moment: 'Na fila do caixa',
        rg: '0987654321',
        additionalInfo: 'Preço diferente do que estava na prateleira'
      },
      {
        id: '3',
        name: 'Roberto Santos',
        phone: '85977665544',
        cause: 'Problema com pagamento',
        createdAt: '2024-01-13T12:10:00Z',
        status: 'completed',
        period: '2024-01-13 13:20',
        moment: 'No momento do pagamento',
        rg: '1122334455',
        additionalInfo: 'Cartão foi recusado mas dinheiro foi debitado'
      }
    ]

    return NextResponse.json(cameraRequests)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações de câmera' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json()
    
    // Simular atualização de status
    return NextResponse.json({ 
      success: true, 
      message: `Status da solicitação ${id} atualizado para ${status}` 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar solicitação de câmera' },
      { status: 500 }
    )
  }
} 