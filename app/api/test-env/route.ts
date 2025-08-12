import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

// Ensure Node.js runtime/dynamic route so Next won't try to pre-render at build
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function bool(v?: string) { return v ? 'Set' : 'Missing' }

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const reload = url.searchParams.get('reload') === '1'
  const cwd = process.cwd()

  const candidateFiles = [
    '.env.local',
    '.env.development.local',
    '.env',
  ]

  const results: Array<{ file: string, exists: boolean, parsedKeys: string[] }> = []

  for (const f of candidateFiles) {
    const full = path.join(cwd, f)
    try {
      await fs.access(full)
      const raw = await fs.readFile(full, 'utf-8')
      // Parse with dotenv without mutating process.env
      let parsedKeys: string[] = []
      try {
        const dotenv = await import('dotenv')
        const parsed = dotenv.parse(raw)
        parsedKeys = Object.keys(parsed)
        if (reload && parsedKeys.length) {
          // Optionally load into process.env to test override
          dotenv.config({ path: full, override: true })
        }
      } catch {}
      results.push({ file: full, exists: true, parsedKeys })
    } catch {
      results.push({ file: full, exists: false, parsedKeys: [] })
    }
  }

  const payload = {
    cwd,
    nodeVersion: process.version,
    reloadApplied: reload,
    files: results,
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(undefined)',
      NEXTAUTH_SECRET: bool(process.env.NEXTAUTH_SECRET),
      GOOGLE_CLIENT_ID: bool(process.env.GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: bool(process.env.GOOGLE_CLIENT_SECRET),
    }
  }

  // Log a concise summary without secrets
  console.log('🔧 Env diagnostics:', {
    cwd,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: bool(process.env.NEXTAUTH_SECRET),
    GOOGLE_CLIENT_ID: bool(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: bool(process.env.GOOGLE_CLIENT_SECRET),
    files: results.map(r => ({ file: r.file, exists: r.exists, count: r.parsedKeys.length }))
  })

  return NextResponse.json(payload)
}
