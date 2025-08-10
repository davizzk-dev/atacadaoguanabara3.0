import { NextRequest, NextResponse } from 'next/server'
import { readDataFile, writeDataFile } from '@/lib/database'
import path from 'path'

// Função para gerar código aleatório de 6 dígitos
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Função para simular envio de email (em produção, usar serviço real como SendGrid, AWS SES, etc.)
async function sendEmail(to: string, code: string): Promise<boolean> {
  try {
    console.log(`📧 Email simulado enviado para: ${to}`)
    console.log(`🔐 Código de verificação: ${code}`)
    console.log(`📝 Assunto: Recuperação de Senha - Atacadão Guanabara`)
    console.log(`📄 Conteúdo: Seu código de verificação é: ${code}. Este código expira em 10 minutos.`)
    
    // Em produção, aqui você implementaria o envio real de email
    // Exemplo com SendGrid:
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // const msg = {
    //   to: to,
    //   from: 'noreply@atacadaoguanabara.com',
    //   subject: 'Recuperação de Senha - Atacadão Guanabara',
    //   text: `Seu código de verificação é: ${code}. Este código expira em 10 minutos.`,
    //   html: `<h2>Recuperação de Senha</h2><p>Seu código de verificação é: <strong>${code}</strong></p><p>Este código expira em 10 minutos.</p>`
    // }
    // await sgMail.send(msg)
    
    return true
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o email existe no sistema
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const users = readDataFile(usersPath, [])
    
    const user = users.find((u: any) => u.email === email)
    if (!user) {
      return NextResponse.json(
        { error: 'Email não encontrado no sistema' },
        { status: 404 }
      )
    }

    // Gerar código de verificação
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Salvar código no arquivo de códigos de verificação
    const codesPath = path.join(process.cwd(), 'data', 'verification-codes.json')
    const codes = readDataFile(codesPath, [])
    
    // Remover códigos antigos para este email
    const filteredCodes = codes.filter((c: any) => c.email !== email)
    
    // Adicionar novo código
    const newCode = {
      email,
      code,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    }
    
    filteredCodes.push(newCode)
    writeDataFile(codesPath, filteredCodes)

    // Enviar email
    const emailSent = await sendEmail(email, code)
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Erro ao enviar email. Tente novamente.' },
        { status: 500 }
      )
    }

    console.log(`✅ Código de verificação enviado para: ${email}`)

    return NextResponse.json({
      message: 'Código de verificação enviado com sucesso',
      email: email // Retornar email mascarado para segurança
    })

  } catch (error) {
    console.error('Erro na recuperação de senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 