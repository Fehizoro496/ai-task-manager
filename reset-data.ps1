# =============================================================================
# reset-data.ps1
# Reset backend PostgreSQL data, mobile Flutter SQLite cache, and Next.js
# frontend build cache. Re-seeds development data.
# Usage : .\reset-data.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$BackendDir   = Join-Path $PSScriptRoot "backend"
$FrontendDir  = Join-Path $PSScriptRoot "frontend"
$SqliteFile   = Join-Path $env:USERPROFILE "Documents\ai_task_manager.sqlite"
$NextCacheDir = Join-Path $FrontendDir ".next"

# -----------------------------------------------------------------------------
# Read DATABASE_URL from backend/.env
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
# 1. Backend : TRUNCATE PostgreSQL (CASCADE)
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
# 2. Backend : seed data (users + projets + taches)
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
# 3. Mobile Flutter : SQLite Drift cache
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host ">>> Mobile Flutter : suppression du cache SQLite..." -ForegroundColor Cyan

if (Test-Path $SqliteFile) {
    Remove-Item $SqliteFile -Force
    Write-Host "[OK] Fichier supprime : $SqliteFile" -ForegroundColor Green
} else {
    Write-Host "[INFO] Fichier absent (deja propre) : $SqliteFile" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# 4. Frontend Next.js : cache de build
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host ">>> Frontend Next.js : suppression du cache .next..." -ForegroundColor Cyan

if (Test-Path $NextCacheDir) {
    try {
        Remove-Item $NextCacheDir -Recurse -Force -ErrorAction Stop
        Write-Host "[OK] Dossier supprime : $NextCacheDir" -ForegroundColor Green
    } catch {
        Write-Host "[INFO] Cache .next verrouille (dev server actif ?). Ignore." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Cache .next absent." -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "Reset complet." -ForegroundColor Green
Write-Host ""
Write-Host "Comptes disponibles :" -ForegroundColor White
Write-Host "  Admin  : fehizoroandriantsarafara@gmail.com  (Google)" -ForegroundColor Gray
Write-Host "  User1  : user1@gmail.com  / 123456           (local)" -ForegroundColor Gray
Write-Host "  User2  : user2@gmail.com  / 123456           (local)" -ForegroundColor Gray
Write-Host ""
Write-Host "3 projets seedes (non assignes). Connectez-vous en admin pour ajouter des membres." -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend web : deconnectez-vous dans le navigateur" -ForegroundColor Yellow
Write-Host "(ou videz localStorage, cle auth_token) pour reinitialiser la session." -ForegroundColor Yellow
Write-Host ""
Write-Host "Relancez le serveur backend et l application." -ForegroundColor Green
