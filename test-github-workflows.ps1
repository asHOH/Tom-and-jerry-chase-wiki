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

# Function to reset service worker to original state
function Reset-ServiceWorker {
    $swPath = "public/sw.js"
    $content = Get-Content $swPath -Raw
    
    # Reset to placeholder version for development
    $resetContent = $content -replace "const CACHE_VERSION = '[^']+';", "const CACHE_VERSION = '__CACHE_VERSION__';"
    
    if ($content -ne $resetContent) {
        Set-Content $swPath -Value $resetContent -NoNewline
        Write-Host "[RESET] Service worker cache version reset to placeholder" -ForegroundColor Gray
    }
}

# 1. Code Quality Checks (CI Workflow)
Write-Host "`n[SECTION] Code Quality Checks (CI Workflow)" -ForegroundColor Magenta

# Enhanced Prettier check with fix option
Write-Host "`n[TESTING] Prettier Formatting" -ForegroundColor Yellow
try {
    npm run prettier:check
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Prettier Formatting - PASSED" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Prettier Formatting - FAILED (Formatting issues found)" -ForegroundColor Red
        Write-Host "`n[SUGGESTION] Run 'npm run prettier:fix' to automatically fix formatting issues" -ForegroundColor Yellow
        
        $response = Read-Host "`nWould you like to run prettier:fix now? (y/N)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Host "`n[FIXING] Running prettier:fix..." -ForegroundColor Cyan
            npm run prettier:fix
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[FIXED] Prettier formatting issues have been fixed" -ForegroundColor Green
                Write-Host "[INFO] Re-checking formatting..." -ForegroundColor Gray
                npm run prettier:check
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[PASS] Prettier Formatting - NOW PASSED" -ForegroundColor Green
                } else {
                    Write-Host "[FAIL] Prettier Formatting - Still has issues after fix" -ForegroundColor Red
                    $script:ErrorCount++
                }
            } else {
                Write-Host "[FAIL] prettier:fix failed" -ForegroundColor Red
                $script:ErrorCount++
            }
        } else {
            $script:ErrorCount++
        }
    }
} catch {
    Write-Host "[FAIL] Prettier Formatting - FAILED (Exception: $($_.Exception.Message))" -ForegroundColor Red
    $script:ErrorCount++
}

Test-Component "ESLint Linting" {
    npm run lint
}

Test-Component "TypeScript Compilation" {
    npx tsc --noEmit
}

# 2. Build Process (CI & Deploy Workflows)
Write-Host "`n[SECTION] Build Process" -ForegroundColor Magenta

# Service Worker Cache Version Update Test
Test-Component "Service Worker Cache Version Update" {
    # Create a temporary copy of the service worker for testing
    $tempSw = "public/sw-test.js"
    Copy-Item "public/sw.js" $tempSw -Force
    
    # Test the cross-platform SW version update script on temp file
    $env:SW_PATH = $tempSw
    node update-sw-version.js --dev --test
    
    # Verify the temp file was updated correctly
    $content = Get-Content $tempSw -Raw
    if ($content -match "const CACHE_VERSION = 'dev-\d{8}-\d{6}';") {
        Write-Host "Cache version pattern correctly updated" -ForegroundColor Gray
        $exitCode = 0
    } else {
        Write-Host "Cache version pattern not found or incorrect" -ForegroundColor Red
        $exitCode = 1
    }
    
    # Clean up temp file and environment variable
    Remove-Item $tempSw -Force -ErrorAction SilentlyContinue
    $env:SW_PATH = $null
    
    return $exitCode
}

Test-Component "Project Build" {
    npm run build
}

# 3. Security Checks (Dependency-Check Workflow)
Write-Host "`n[SECTION] Security Checks" -ForegroundColor Magenta

Test-Component "Dependency Audit" {
    npm audit --audit-level=moderate
}

Test-Component "Outdated Packages Check" {
    npm outdated; $global:LASTEXITCODE = 0  # npm outdated always exits with 1 if packages are outdated
}

# 4. Build Output Verification
Write-Host "`n[SECTION] Build Output Verification" -ForegroundColor Magenta

Test-Component "Build Directory Check" {
    if (Test-Path ".next") {
        Write-Host "Build directory (.next) exists" -ForegroundColor Gray
        return 0
    } else {
        Write-Host "Build directory (.next) not found" -ForegroundColor Red
        return 1
    }
}

Test-Component "Static Export Check" {
    if (Test-Path "out") {
        Write-Host "Export directory (out) exists" -ForegroundColor Gray
        return 0
    } else {
        Write-Host "Export directory (out) not found - this is expected for dev builds" -ForegroundColor Yellow
        return 0
    }
}

# Summary
Write-Host "`n[SUMMARY] Test Summary" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Reset service worker to original state
Reset-ServiceWorker

if ($ErrorCount -eq 0) {
    Write-Host "[SUCCESS] All workflow components passed! Your workflows should work correctly." -ForegroundColor Green
    Write-Host "`n[READY] Ready for:" -ForegroundColor Green
    Write-Host "  * Push to main/develop branches (triggers CI)" -ForegroundColor Gray
    Write-Host "  * Creating pull requests (triggers PR checks)" -ForegroundColor Gray
} else {
    Write-Host "[WARNING] $ErrorCount component(s) failed. Please fix before pushing." -ForegroundColor Red
}

exit $ErrorCount
