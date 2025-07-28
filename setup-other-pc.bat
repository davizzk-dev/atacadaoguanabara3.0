@echo off
echo ========================================
echo   CONFIGURACAO PARA OUTRO PC
echo ========================================
echo.

echo 1. Instalando dependencias...
call pnpm install

echo.
echo 2. Criando arquivo .env.local...
if not exist .env.local (
    echo NEXTAUTH_URL=http://localhost:3000 > .env.local
    echo NEXTAUTH_SECRET=your-secret-key-here >> .env.local
    echo NEXT_PUBLIC_API_URL=http://localhost:3000/api >> .env.local
    echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 >> .env.local
    echo NEXT_PUBLIC_BUILD_MODE=production >> .env.local
    echo Arquivo .env.local criado!
) else (
    echo Arquivo .env.local ja existe!
)

echo.
echo 3. Limpando cache do Next.js...
if exist .next rmdir /s /q .next

echo.
echo 4. Corrigindo paginas para build estatico...
node fix-build-errors.js

echo.
echo 5. Fazendo build...
call pnpm build

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Para iniciar o servidor:
echo pnpm start
echo.
pause 