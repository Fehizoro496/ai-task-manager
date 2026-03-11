# =============================================================================
# reset-data.ps1  —  Efface toutes les données backend (PostgreSQL) et
#                    frontend (SQLite Drift cache)
# Usage : .\reset-data.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$BackendDir = Join-Path $PSScriptRoot "backend"
$SqliteFile = Join-Path $env:USERPROFILE "Documents\ai_task_manager.sqlite"

# -----------------------------------------------------------------------------
# 1. Backend — TRUNCATE toutes les tables PostgreSQL (ordre CASCADE)
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host ">>> Backend : truncate PostgreSQL..." -ForegroundColor Cyan

$sql = @"
TRUNCATE TABLE "Task", "Story", "Epic", "AiDraft", "Project", "User" RESTART IDENTITY CASCADE;
"@

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
# 2. Backend — Seed admin
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host ">>> Backend : seed admin..." -ForegroundColor Cyan

Push-Location $BackendDir
try {
    node src/scripts/seed-admin.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] seed-admin.js a echoue." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host "[OK] Compte admin seede." -ForegroundColor Green

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
Write-Host "Reset complet. Relancez le serveur backend et l'application." -ForegroundColor Green
