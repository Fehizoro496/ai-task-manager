# =============================================================================
# reset-data.ps1  —  Efface toutes les données backend (PostgreSQL) et
#                    frontend (SQLite Drift cache), puis seede les données
#                    de développement.
# Usage : .\reset-data.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$BackendDir = Join-Path $PSScriptRoot "backend"
$SqliteFile = Join-Path $env:USERPROFILE "Documents\ai_task_manager.sqlite"

# -----------------------------------------------------------------------------
# Lecture de DATABASE_URL depuis backend/.env
# -----------------------------------------------------------------------------
$envFile = Join-Path $BackendDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERREUR] Fichier backend/.env introuvable." -ForegroundColor Red
    exit 1
}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]*)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}
if (-not $env:DATABASE_URL) {
    Write-Host "[ERREUR] DATABASE_URL introuvable dans backend/.env" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# 1. Backend — TRUNCATE toutes les tables PostgreSQL (ordre CASCADE)
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host ">>> Backend : truncate PostgreSQL..." -ForegroundColor Cyan

$sql = @'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma%'
  LOOP
    EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', r.tablename);
  END LOOP;
END $$;
'@

Push-Location $BackendDir
try {
    $sql | npx prisma db execute --stdin --schema "prisma\schema.prisma"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Prisma db execute a echoue." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host "[OK] Tables PostgreSQL videes." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 2. Backend — Seed : users + projets + tâches
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host ">>> Backend : seed donnees..." -ForegroundColor Cyan

Push-Location $BackendDir
try {
    node src/scripts/seed-data.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] seed-data.js a echoue." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host "[OK] Donnees seedees." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 3. Frontend — Suppression du cache SQLite Drift
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host ">>> Frontend : suppression du cache SQLite..." -ForegroundColor Cyan

if (Test-Path $SqliteFile) {
    Remove-Item $SqliteFile -Force
    Write-Host "[OK] Fichier supprime : $SqliteFile" -ForegroundColor Green
} else {
    Write-Host "[INFO] Fichier absent (deja propre) : $SqliteFile" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "Reset complet." -ForegroundColor Green
Write-Host ""
Write-Host "Comptes disponibles :" -ForegroundColor White
Write-Host "  Admin  : fehizoroandriantsarafara@gmail.com  (Google)" -ForegroundColor Gray
Write-Host "  User   : fehizoroandrian496@gmail.com        (Google)" -ForegroundColor Gray
Write-Host "  User1  : user1@gmail.com  / 123456           (local)" -ForegroundColor Gray
Write-Host "  User2  : user2@gmail.com  / 123456           (local)" -ForegroundColor Gray
Write-Host ""
Write-Host "3 projets seedes (non assignes). Connectez-vous en admin pour ajouter des membres." -ForegroundColor Gray
Write-Host ""
Write-Host "Relancez le serveur backend et l'application." -ForegroundColor Green
