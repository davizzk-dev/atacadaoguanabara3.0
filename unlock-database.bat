@echo off
echo 🔒 Desbloqueando banco de dados H2...
echo.

echo 🛑 Parando processos Java...
taskkill /f /im java.exe >nul 2>&1
echo ✅ Processos Java parados

echo.
echo ⏳ Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo 🗂️ Verificando arquivos de banco...
cd java-backend\data

if exist "guanabara_db.mv.db" (
    echo 📁 Arquivo de banco encontrado
    echo 🔓 Tentando deletar...
    del "guanabara_db.mv.db" >nul 2>&1
    if exist "guanabara_db.mv.db" (
        echo ❌ Não foi possível deletar
        echo 🔄 Tentando renomear...
        ren "guanabara_db.mv.db" "guanabara_db_backup.mv.db" >nul 2>&1
        if exist "guanabara_db.mv.db" (
            echo ❌ Falha ao renomear
        ) else (
            echo ✅ Arquivo renomeado com sucesso
        )
    ) else (
        echo ✅ Arquivo deletado com sucesso
    )
) else (
    echo ✅ Arquivo de banco não encontrado
)

if exist "guanabara_db.trace.db" (
    echo 📁 Arquivo de trace encontrado
    del "guanabara_db.trace.db" >nul 2>&1
    echo ✅ Arquivo de trace deletado
)

cd ..\..

echo.
echo ✅ Banco de dados desbloqueado!
echo 🚀 Agora você pode executar: node server.js
pause 