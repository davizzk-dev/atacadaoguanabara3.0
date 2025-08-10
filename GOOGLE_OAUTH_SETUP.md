# 🔐 Configuração do Google OAuth

Para que o botão "Continuar com Google" funcione corretamente, você precisa configurar as credenciais do Google OAuth.

## 📋 Passos para Configuração

### 1. Acessar Google Cloud Console
1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. Crie um novo projeto ou selecione um existente

### 2. Habilitar Google+ API
1. No menu lateral, vá para "APIs & Services" > "Library"
2. Procure por "Google+ API" ou "Google Identity"
3. Clique em "Enable"

### 3. Criar Credenciais OAuth
1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Selecione "Web application"
4. Configure as URLs autorizadas:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### 4. Obter Credenciais
Após criar, você receberá:
- **Client ID**: Uma string longa
- **Client Secret**: Uma string secreta

### 5. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_BUILD_MODE=development
```

### 6. Reiniciar o Servidor
Após configurar as variáveis de ambiente:
```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
pnpm dev
```

## 🔍 Verificação

Para verificar se está funcionando:
1. Abra o console do navegador (F12)
2. Vá para a página de registro
3. Clique em "Continuar com Google"
4. Verifique se não há erros no console

## 🚨 Problemas Comuns

### Erro: "Missing GOOGLE_CLIENT_ID"
- ✅ Verifique se o arquivo `.env.local` existe
- ✅ Confirme se as variáveis estão corretas
- ✅ Reinicie o servidor após criar o arquivo

### Erro: "redirect_uri_mismatch"
- ✅ Verifique se a URL de redirecionamento está correta no Google Console
- ✅ Deve ser exatamente: `http://localhost:3000/api/auth/callback/google`

### Erro: "invalid_client"
- ✅ Verifique se o Client ID e Secret estão corretos
- ✅ Confirme se a API está habilitada no Google Console

## 📱 URLs para Produção

Quando for para produção, atualize as URLs no Google Console:
- **Authorized JavaScript origins**: `https://seudominio.com`
- **Authorized redirect URIs**: `https://seudominio.com/api/auth/callback/google`

E no `.env.local`:
```env
NEXTAUTH_URL=https://seudominio.com
```

## 🔒 Segurança

- Nunca commite o arquivo `.env.local` no Git
- Use variáveis de ambiente diferentes para produção
- Gere um NEXTAUTH_SECRET forte para produção
- Considere usar um gerenciador de segredos em produção 