'use client'

export default function EnvCheck() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Env Check</h1>
      <ul className="space-y-2 text-sm">
        <li>NEXT_PUBLIC_BASE_URL: {process.env.NEXT_PUBLIC_BASE_URL || '(not set)'}</li>
        <li>GOOGLE_CLIENT_ID: {process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing'}</li>
      </ul>
      <p className="mt-4 text-xs text-gray-600">Nota: Valores privados não são expostos no client.</p>
    </div>
  )
}
