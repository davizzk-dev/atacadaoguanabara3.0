@echo off
echo ========================================
echo   INSTALACAO DE FERRAMENTAS NECESSARIAS
echo ========================================
echo.

echo 1. Verificando se o Chocolatey esta instalado...
where choco >nul 2>nul
if %errorlevel% neq 0 (
    echo Chocolatey nao encontrado. Instalando...
    echo.
    echo Execute o seguinte comando como ADMINISTRADOR:
    echo Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    echo.
    echo Apos instalar o Chocolatey, execute este script novamente.
    pause
    exit /b 1
) else (
    echo Chocolatey encontrado!
)

echo.
echo 2. Instalando Node.js...
choco install nodejs -y

echo.
echo 3. Instalando Git...
choco install git -y

echo.
echo 4. Instalando pnpm...
npm install -g pnpm

echo.
echo 5. Verificando instalacoes...
echo.
echo Node.js:
node --version
echo.
echo Git:
git --version
echo.
echo pnpm:
pnpm --version

echo.
echo ========================================
echo   INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Agora voce pode executar:
echo setup-other-pc.bat
echo.
pause 