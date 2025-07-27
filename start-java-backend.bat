@echo off
echo ========================================
echo    Atacadao Guanabara - Backend Java
echo ========================================
echo.

REM Verificar se o Java está instalado
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Java nao encontrado!
    echo Por favor, instale o Java 17 ou superior.
    pause
    exit /b 1
)

echo Java encontrado!
echo.

REM Verificar se o Maven está instalado
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Maven nao encontrado!
    echo Por favor, instale o Apache Maven.
    pause
    exit /b 1
)

echo Maven encontrado!
echo.

REM Navegar para o diretório do backend Java
cd java-backend

echo Compilando o projeto...
mvn clean compile

if %errorlevel% neq 0 (
    echo ERRO: Falha na compilacao!
    pause
    exit /b 1
)

echo.
echo Compilacao concluida com sucesso!
echo.

echo Iniciando o servidor...
echo.
echo ========================================
echo    Servidor iniciado em:
echo    http://localhost:8080
echo    Console H2: http://localhost:8080/h2-console
echo ========================================
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

mvn spring-boot:run

pause 