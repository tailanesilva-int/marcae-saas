# =========================================
# BACKUP AUTOMÁTICO MARCAÊ SAAS
# PostgreSQL + Google Drive
# =========================================

$DATA = Get-Date -Format "yyyy-MM-dd_HH-mm"

# =========================
# CONFIGURAÇÕES
# =========================

$PROJECT_NAME = "marcae"

$BACKUP_LOCAL = "C:\Marcae\backup\temp"

$POSTGRES_BIN = "C:\Program Files\PostgreSQL\17\bin"

$PG_DUMP = "$POSTGRES_BIN\pg_dump.exe"

# =========================================
# URL DO BANCO SUPABASE
# PEGAR DO .env
# =========================================

$DATABASE_URL="postgresql://postgres.dcxceubqnzfacowfaqkh:%40meusonho%2B-123@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# =========================================
# CRIA PASTA TEMP SE NÃO EXISTIR
# =========================================

if (!(Test-Path $BACKUP_LOCAL)) {
    New-Item -ItemType Directory -Path $BACKUP_LOCAL
}

# =========================================
# NOME DOS ARQUIVOS
# =========================================

$SQL_FILE = "$BACKUP_LOCAL\$PROJECT_NAME-$DATA.sql"

$ZIP_FILE = "$BACKUP_LOCAL\$PROJECT_NAME-$DATA.zip"

# =========================================
# GERA BACKUP SQL
# =========================================

Write-Host ""
Write-Host "================================="
Write-Host "GERANDO BACKUP DO BANCO..."
Write-Host "================================="
Write-Host ""

& $PG_DUMP `
--dbname="$DATABASE_URL" `
--format=plain `
--no-owner `
--no-privileges `
--verbose `
--file="$SQL_FILE"

# =========================================
# VERIFICA SE BACKUP FOI GERADO
# =========================================

if (!(Test-Path $SQL_FILE)) {

    Write-Host ""
    Write-Host "ERRO AO GERAR BACKUP."
    Write-Host ""

    exit
}

# =========================================
# COMPACTA ZIP
# =========================================

Write-Host ""
Write-Host "================================="
Write-Host "COMPACTANDO BACKUP..."
Write-Host "================================="
Write-Host ""

Compress-Archive `
-Path $SQL_FILE `
-DestinationPath $ZIP_FILE `
-Force

# =========================================
# ENVIA PARA GOOGLE DRIVE
# =========================================

Write-Host ""
Write-Host "================================="
Write-Host "ENVIANDO PARA GOOGLE DRIVE..."
Write-Host "================================="
Write-Host ""

rclone copy `
"$ZIP_FILE" `
"gdrive:MarcaeBackups"

# =========================================
# REMOVE SQL TEMPORÁRIO
# =========================================

Remove-Item $SQL_FILE -Force

# =========================================
# REMOVE ZIP LOCAL ANTIGO (+7 DIAS)
# =========================================

Get-ChildItem $BACKUP_LOCAL -Filter *.zip |
Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-7)
} |
Remove-Item -Force

# =========================================
# FINALIZAÇÃO
# =========================================

Write-Host ""
Write-Host "================================="
Write-Host "BACKUP FINALIZADO COM SUCESSO!"
Write-Host "================================="
Write-Host ""