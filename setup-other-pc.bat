@echo off
echo ========================================
echo   CONFIGURACAO PARA OUTRO PC
echo ========================================
echo.

echo 1. Instalando dependencias...
call pnpm install

echo.
echo 2. Executando correcoes automaticas...
node fix-build-errors.js

echo.
echo 3. Testando build...
node test-build.js

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Para iniciar o servidor:
echo pnpm start
echo.
pause 