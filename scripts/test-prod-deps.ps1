# Test Production Dependencies Script
# This script simulates a production environment by building the app and then removing devDependencies.

Write-Host "⚠️  WARNING: This script will modify your node_modules folder!" -ForegroundColor Yellow
Write-Host "It will run 'npm prune --production' which removes all devDependencies."
Write-Host "To restore them later, you will need to run 'npm install' again."
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Aborted."
    exit
}

# 1. Install all dependencies (ensure we can build)
Write-Host "`n📦 Step 1: Installing all dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }

# 2. Build the application
Write-Host "`n🏗️  Step 2: Building the application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

# 3. Reinstall only production dependencies (cleaner than prune)
Write-Host "`n♻️  Step 3: Reinstalling only production dependencies..." -ForegroundColor Cyan
# Remove node_modules to avoid lock issues and ensure clean state
if (Test-Path "node_modules") {
    Write-Host "Removing existing node_modules..."
    Remove-Item -Recurse -Force node_modules
}
# Use --ignore-scripts to prevent 'prepare' (husky) from running and failing
# Then run npm rebuild to ensure dependencies like sharp run their install scripts
npm install --omit=dev --ignore-scripts
if ($LASTEXITCODE -ne 0) { Write-Error "Install prod deps failed"; exit 1 }

Write-Host "Rebuilding dependencies (for native modules)..."
npm rebuild
if ($LASTEXITCODE -ne 0) { Write-Error "Rebuild failed"; exit 1 }

# 4. Start the application
Write-Host "`n🚀 Step 4: Starting the application in production mode..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server."
npm start
