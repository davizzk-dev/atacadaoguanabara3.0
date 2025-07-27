@echo off
echo ========================================
echo    Atacadao Guanabara - Frontend
echo ========================================
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js 18 ou superior.
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

REM Verificar se o pnpm está instalado
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando pnpm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar pnpm!
        pause
        exit /b 1
    )
)

echo pnpm encontrado!
echo.

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo Instalando dependencias...
    pnpm install
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

echo.
echo Iniciando o servidor de desenvolvimento...
echo.
echo ========================================
echo    Frontend iniciado em:
echo    http://localhost:3000
echo    Painel Admin: http://localhost:3000/admin
echo ========================================
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

pnpm dev

pause 