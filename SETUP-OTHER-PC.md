# 🚀 Configuração para Outro PC

## 📋 Pré-requisitos

1. **Node.js** (versão 18 ou superior)
2. **pnpm** instalado globalmente
3. **Git** para clonar o repositório

## 🔧 Passos para Configuração

### 1. Clonar o Repositório
```bash
git clone <url-do-repositorio>
cd atacadao-guanabara
```

### 2. Executar Script de Setup (Windows)
```bash
setup-other-pc.bat
```

### 3. Ou Configuração Manual

#### Instalar Dependências
```bash
pnpm install
```

#### Criar Arquivo de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_BUILD_MODE=production
```

#### Limpar Cache
```bash
rm -rf .next
```

#### Fazer Build
```bash
pnpm build
```

## 🚨 Problemas Comuns e Soluções

### Erro: `useSession` destructuring
- ✅ **Solução**: Use o wrapper `useSessionWrapper` em vez de `useSession` diretamente

### Erro: `cn` function not found
- ✅ **Solução**: Verifique se o arquivo `lib/utils.ts` está presente

### Erro: Connection refused
- ✅ **Solução**: Configure as URLs corretas no `.env.local`

### Erro: Build estático falha
- ✅ **Solução**: Use `pnpm build:static` para build estático

## 📁 Arquivos Importantes

- `.env.local` - Variáveis de ambiente
- `next.config.mjs` - Configuração do Next.js
- `package.json` - Dependências e scripts
- `lib/utils.ts` - Função `cn` e utilitários

## 🎯 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Build estático
pnpm build:static

# Iniciar servidor
pnpm start

# Setup automático
pnpm setup
```

## 🔍 Verificação

Após o setup, verifique se:
1. ✅ Build foi executado sem erros
2. ✅ Pasta `out/` foi criada (build estático)
3. ✅ Servidor inicia corretamente
4. ✅ Páginas carregam sem erros de JavaScript

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todas as dependências estão instaladas
2. Confirme se o arquivo `.env.local` existe
3. Limpe o cache com `rm -rf .next`
4. Execute `pnpm install` novamente 