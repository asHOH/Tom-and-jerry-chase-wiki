#!/bin/bash

# GitHub Actions Workflow Testing Script
# This script tests all components that run in GitHub Actions workflows

# ANSI color codes
COLOR_CYAN='\033[0;36m'
COLOR_YELLOW='\033[0;33m'
COLOR_MAGENTA='\033[0;35m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_GRAY='\033[0;90m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_CYAN}[TEST] Testing GitHub Actions Workflows Locally${COLOR_RESET}"
echo -e "${COLOR_CYAN}=================================================${COLOR_RESET}"

ErrorCount=0

# Function to run test and report results
Test-Component() {
    local Name="$1"
    local TestScript="$2"
    echo -e "\n${COLOR_YELLOW}[TESTING] $Name${COLOR_RESET}"
    if eval "$TestScript"; then
        if [ $? -eq 0 ]; then
            echo -e "${COLOR_GREEN}[PASS] $Name - PASSED${COLOR_RESET}"
        else
            echo -e "${COLOR_RED}[FAIL] $Name - FAILED (Exit Code: $?)${COLOR_RESET}"
            ((ErrorCount++))
        fi
    else
        echo -e "${COLOR_RED}[FAIL] $Name - FAILED (Command execution error)${COLOR_RESET}"
        ((ErrorCount++))
    fi
}

# 1. Code Quality Checks (CI Workflow)
echo -e "\n${COLOR_MAGENTA}[SECTION] Code Quality Checks (CI Workflow)${COLOR_RESET}"

# Enhanced Prettier check with fix option
echo -e "\n${COLOR_YELLOW}[TESTING] Prettier Formatting${COLOR_RESET}"
npm run prettier:check
if [ $? -eq 0 ]; then
    echo -e "${COLOR_GREEN}[PASS] Prettier Formatting - PASSED${COLOR_RESET}"
else
    echo -e "${COLOR_RED}[FAIL] Prettier Formatting - FAILED (Formatting issues found)${COLOR_RESET}"
    echo -e "\n${COLOR_YELLOW}[SUGGESTION] Run 'npm run prettier:fix' to automatically fix formatting issues${COLOR_RESET}"
    
    read -p $'\nWould you like to run prettier:fix now? (y/N) ' response
    if [[ "$response" =~ ^[yY]$ ]]; then
        echo -e "\n${COLOR_CYAN}[FIXING] Running prettier:fix...${COLOR_RESET}"
        npm run prettier:fix
        if [ $? -eq 0 ]; then
            echo -e "${COLOR_GREEN}[FIXED] Prettier formatting issues have been fixed${COLOR_RESET}"
            echo -e "${COLOR_GRAY}[INFO] Re-checking formatting...${COLOR_RESET}"
            npm run prettier:check
            if [ $? -eq 0 ]; then
                echo -e "${COLOR_GREEN}[PASS] Prettier Formatting - NOW PASSED${COLOR_RESET}"
            else
                echo -e "${COLOR_RED}[FAIL] Prettier Formatting - Still has issues after fix${COLOR_RESET}"
                ((ErrorCount++))
            fi
        else
            echo -e "${COLOR_RED}[FAIL] prettier:fix failed${COLOR_RESET}"
            ((ErrorCount++))
        fi
    else
        ((ErrorCount++))
    fi
fi

Test-Component "ESLint Linting" "npm run lint"

Test-Component "TypeScript Compilation" "npx tsc --noEmit"

# 2. Build Process (CI & Deploy Workflows)
echo -e "\n${COLOR_MAGENTA}[SECTION] Build Process${COLOR_RESET}"

Test-Component "Project Build" "npm run build"

# 3. Security Checks (Dependency-Check Workflow)
echo -e "\n${COLOR_MAGENTA}[SECTION] Security Checks${COLOR_RESET}"

Test-Component "Dependency Audit" "npm audit --audit-level=moderate"

Test-Component "Outdated Packages Check" "npm outdated; exit 0" # npm outdated always exits with 1 if packages are outdated

# 4. Build Output Verification
echo -e "\n${COLOR_MAGENTA}[SECTION] Build Output Verification${COLOR_RESET}"

Test-Component "Build Directory Check" "if [ -d \".next\" ]; then echo -e \"${COLOR_GRAY}Build directory (.next) exists${COLOR_RESET}\"; exit 0; else echo -e \"${COLOR_RED}Build directory (.next) not found${COLOR_RESET}\"; exit 1; fi"

Test-Component "Static Export Check" "if [ -d \"out\" ]; then echo -e \"${COLOR_GRAY}Export directory (out) exists${COLOR_RESET}\"; exit 0; else echo -e \"${COLOR_YELLOW}Export directory (out) not found - this is expected for dev builds${COLOR_RESET}\"; exit 0; fi"

# Summary
echo -e "\n${COLOR_CYAN}[SUMMARY] Test Summary${COLOR_RESET}"
echo -e "${COLOR_CYAN}========================${COLOR_RESET}"

if [ $ErrorCount -eq 0 ]; then
    echo -e "${COLOR_GREEN}[SUCCESS] All workflow components passed! Your workflows should work correctly.${COLOR_RESET}"
    echo -e "\n${COLOR_GREEN}[READY] Ready for:${COLOR_RESET}"
    echo -e "  * Push to main/develop branches (triggers CI)${COLOR_GRAY}"
    echo -e "  * Creating pull requests (triggers PR checks)${COLOR_GRAY}"
else
    echo -e "${COLOR_RED}[WARNING] $ErrorCount component(s) failed. Please fix before pushing.${COLOR_RESET}"
fi

exit $ErrorCount
