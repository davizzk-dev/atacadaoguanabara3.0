// Quick runtime check for NextAuth/Google envs
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true })
}

function flag(v) { return v ? 'Set' : 'Missing' }

console.log('cwd:', process.cwd())
console.log('envPath exists:', fs.existsSync(envPath), envPath)
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '(undefined)')
console.log('NEXTAUTH_SECRET:', flag(process.env.NEXTAUTH_SECRET))
console.log('GOOGLE_CLIENT_ID:', flag(process.env.GOOGLE_CLIENT_ID))
console.log('GOOGLE_CLIENT_SECRET:', flag(process.env.GOOGLE_CLIENT_SECRET))
