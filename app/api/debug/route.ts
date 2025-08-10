import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Debug GET funcionando',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform
  })
}

export async function POST(request: NextRequest) {
  try {
    // Tentar ler o body de forma mais simples
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'Debug POST funcionando',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

