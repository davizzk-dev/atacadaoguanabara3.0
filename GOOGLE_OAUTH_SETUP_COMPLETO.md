# Configuração Completa do Google OAuth - "Continuar com Google"

## 1. Configurar no Google Cloud Console

### Passo 1: Criar/Configurar Projeto
1. Acesse: https://console.cloud.google.com/
2. Selecione ou crie um projeto
3. Vá em "APIs e Serviços" > "Credenciais"

### Passo 2: Configurar OAuth 2.0
1. Clique em "Criar Credenciais" > "ID do cliente OAuth 2.0"
2. Tipo de aplicativo: "Aplicativo da Web"
3. Nome: "Atacadão Login"

### Passo 3: URLs Autorizadas
**Origens JavaScript autorizadas:**
```
http://localhost:3000
https://seudominio.com
```

**URIs de redirecionamento autorizados:**
```
http://localhost:3000/api/auth/callback/google
https://seudominio.com/api/auth/callback/google
```

### Passo 4: Copiar Credenciais
- Copie o "Client ID" 
- Copie o "Client Secret"

## 2. Instalar NextAuth.js

Execute no terminal:
```bash
npm install next-auth @auth/prisma-adapter
```

## 3. Configurar Variáveis de Ambiente

Adicione no seu arquivo `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_secret_aqui_muito_seguro_123456789

GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
```

## 4. Arquivos que precisa criar/modificar:

### app/api/auth/[...nextauth]/route.ts - CRIAR ESTE ARQUIVO
### app/login/page.tsx - ADICIONAR BOTÃO GOOGLE
### middleware.ts - CONFIGURAR PROTEÇÃO

## 5. Testar a Integração

1. Inicie o servidor: `npm run dev`
2. Acesse: http://localhost:3000/login
3. Clique em "Continuar com Google"
4. Faça login com sua conta Google
5. Verifique se foi redirecionado corretamente

## 6. Para Produção

1. Adicione seu domínio real nas URLs do Google Cloud Console
2. Configure as variáveis de ambiente no seu hosting
3. Teste em produção

## Observações Importantes:

- ⚠️ NUNCA commite as credenciais no Git
- 🔒 Use um NEXTAUTH_SECRET forte em produção
- 🌐 Configure todos os domínios que usará
- 📱 Para mobile, configure URLs específicas se necessário
