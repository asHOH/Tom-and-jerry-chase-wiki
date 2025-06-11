# GitHub Actions Workflow Testing Script
# This script tests all components that run in GitHub Actions workflows

Write-Host "[TEST] Testing GitHub Actions Workflows Locally" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$ErrorCount = 0

# Function to run test and report results
function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$TestScript
    )
      Write-Host "`n[TESTING] $Name" -ForegroundColor Yellow
    try {
        & $TestScript
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[PASS] $Name - PASSED" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $Name - FAILED (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
            $script:ErrorCount++
        }
    } catch {
        Write-Host "[FAIL] $Name - FAILED (Exception: $($_.Exception.Message))" -ForegroundColor Red
        $script:ErrorCount++
    }
}

# 1. Code Quality Checks (CI Workflow)
Write-Host "`n[SECTION] Code Quality Checks (CI Workflow)" -ForegroundColor Magenta

Test-Component "Prettier Formatting" {
    npm run prettier:check
}

Test-Component "ESLint Linting" {
    npm run lint
}

Test-Component "TypeScript Compilation" {
    npx tsc --noEmit
}

# 2. Build Process (CI & Deploy Workflows)
Write-Host "`n[SECTION] Build Process" -ForegroundColor Magenta

Test-Component "Prisma Client Generation" {
    npm run prisma:generate
}

Test-Component "Project Build" {
    npm run build
}

# 3. Database Operations (Database-Check Workflow)
Write-Host "`n[SECTION] Database Operations" -ForegroundColor Magenta

Test-Component "Prisma Schema Validation" {
    npx prisma validate
}

Test-Component "Database Migration" {
    npm run prisma:migrate
}

Test-Component "Database Seeding" {
    npm run prisma:seed
}

# 4. Security Checks (Dependency-Check Workflow)
Write-Host "`n[SECTION] Security Checks" -ForegroundColor Magenta

Test-Component "Dependency Audit" {
    npm audit --audit-level=moderate
}

Test-Component "Outdated Packages Check" {
    npm outdated; $global:LASTEXITCODE = 0  # npm outdated always exits with 1 if packages are outdated
}

# 5. Build Output Verification
Write-Host "`n[SECTION] Build Output Verification" -ForegroundColor Magenta

Test-Component "Build Directory Check" {
    if (Test-Path ".next") {
        Write-Host "Build directory (.next) exists" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "Build directory (.next) not found" -ForegroundColor Red
        exit 1
    }
}

Test-Component "Static Export Check" {
    if (Test-Path "out") {
        Write-Host "Export directory (out) exists" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "Export directory (out) not found - this is expected for dev builds" -ForegroundColor Yellow
        exit 0
    }
}

# Summary
Write-Host "`n[SUMMARY] Test Summary" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

if ($ErrorCount -eq 0) {
    Write-Host "[SUCCESS] All workflow components passed! Your workflows should work correctly." -ForegroundColor Green
    Write-Host "`n[READY] Ready for:" -ForegroundColor Green
    Write-Host "  * Push to main/develop branches (triggers CI)" -ForegroundColor Gray
    Write-Host "  * Creating pull requests (triggers PR checks)" -ForegroundColor Gray
    Write-Host "  * Manual workflow dispatch" -ForegroundColor Gray
} else {
    Write-Host "[WARNING] $ErrorCount component(s) failed. Please fix before pushing." -ForegroundColor Red
}

Write-Host "`n[NEXT] Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Fix any failed components above" -ForegroundColor Gray
Write-Host "  2. Commit and push to trigger workflows" -ForegroundColor Gray
Write-Host "  3. Check GitHub Actions tab for live results" -ForegroundColor Gray
Write-Host "  4. Use 'workflow_dispatch' for manual testing" -ForegroundColor Gray

exit $ErrorCount
