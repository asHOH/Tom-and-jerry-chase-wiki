# GitHub Actions Workflows

This directory contains automated workflows for the project.

## 🔄 Workflows

### 1. **CI (ci.yml)**
- **Triggers**: Push/PR to main/develop branches
- **Purpose**: Code quality checks and build validation
- **Jobs**:
  - Code Quality: Prettier formatting, ESLint, TypeScript compilation
  - Build Check: Ensures the project builds successfully

### 2. **PR Quality Check (pr-check.yml)**
- **Triggers**: Pull requests
- **Purpose**: Provides detailed feedback on PR quality
- **Features**: Creates a summary table with check results

### 3. **Auto Fix (auto-fix.yml)**
- **Triggers**: Push to main/develop, manual dispatch
- **Purpose**: Automatically fixes code formatting issues
- **Actions**: Runs Prettier and ESLint with auto-fix

### 4. **Database Check (database-check.yml)**
- **Triggers**: Changes to Prisma schema or data files
- **Purpose**: Validates database setup and migrations
- **Features**: Tests Prisma migrations and seeding

### 5. **Dependency Check (dependency-check.yml)**
- **Triggers**: Package.json changes, weekly schedule
- **Purpose**: Security audit and dependency monitoring
- **Features**: Checks for vulnerabilities and outdated packages

### 6. **Deploy (deploy.yml)**
- **Triggers**: Push to main branch
- **Purpose**: Automated deployment to GitHub Pages
- **Process**: Build → Upload → Deploy

### 7. **Test Coverage (test-coverage.yml)**
- **Triggers**: Push/PR to main/develop
- **Purpose**: Run tests and generate coverage reports
- **Note**: Currently checks if tests exist before running

### 8. **Maintenance (maintenance.yml)**
- **Triggers**: Weekly schedule (Mondays 9 AM UTC)
- **Purpose**: Automated maintenance checks
- **Features**: Creates issues for outdated packages and security vulnerabilities

### 9. **Update Badges (update-badges.yml)**
- **Triggers**: After CI or Deploy workflows complete
- **Purpose**: Updates README status badges
- **Features**: Reflects current build status

## 🛡️ Quality Gates

All workflows ensure:
- ✅ Code formatting (Prettier)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Build success
- ✅ Database integrity
- ✅ Security compliance

## 📋 Workflow Dependencies

```
CI ──┬── PR Check
     │
     └── Auto Fix (on push)

Deploy ── CI (must pass)

Maintenance ── Creates Issues (weekly)
```

## 🔧 Configuration

- **Node.js Version**: 18
- **Package Manager**: npm
- **Build Tool**: Next.js
- **Database**: SQLite with Prisma
- **Deployment**: GitHub Pages (static export)

## 📊 Status Badges

The following badges are available in the README:
- Build Status (CI)
- Deployment Status
- License Information

## 🤝 Contributing

When contributing:
1. Ensure all CI checks pass
2. Follow the automated code formatting
3. Test changes with workflow_dispatch triggers
