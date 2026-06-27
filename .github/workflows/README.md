# GitHub Actions Workflows

This directory contains automated workflows for the project.

## 🔄 Workflows

### 1. **CI (ci.yml)**

- **Triggers**: Push/PR to main/develop branches
- **Purpose**: Code quality checks and testing
- **Jobs**:
  - Code Quality: Prettier formatting, Oxlint, TypeScript compilation
  - Tests & Coverage: Run tests and generate coverage reports

### 2. **Security Audit (dependency-check.yml)**

- **Triggers**: Package.json changes, weekly schedule
- **Purpose**: Security vulnerability detection

### 3. **Project Health Check (maintenance.yml)**

- **Triggers**: Monthly schedule (First Monday 9 AM UTC), manual dispatch
- **Purpose**: Comprehensive project health analysis
- **Features**:
  - Test coverage analysis (warns if < 80%)
  - Unused dependency detection
  - Project complexity assessment
  - Creates issues when attention is needed

## 🛡️ Quality Gates

All workflows ensure:

- ✅ Code formatting (Prettier) - _Handled by Husky pre-commit hooks_
- ✅ Linting (Oxlint) - _Handled by Husky pre-commit hooks_
- ✅ Type checking (TypeScript)
- ✅ Test execution and coverage
- ✅ Security compliance

## 📋 Workflow Dependencies

```
CI ──── Tests & Coverage

Security Audit ── Dependency vulnerability checks

Maintenance ── Creates Issues (monthly)
```

## 🔧 Configuration

- **Node.js Version**: 20
- **Package Manager**: npm
- **Build Tool**: Next.js
- **Deployment**: Vercel (auto-deployment)
- **Code Quality**: Husky + lint-staged (pre-commit hooks)
- **Dependency Management**: Dependabot (automated PRs)

## 📊 Status Badges

The following badges are available in the README:

- Build Status (CI)
- Deployment Status
- License Information

## 🤝 Contributing

When contributing:

1. Ensure all CI checks pass
2. Code formatting is handled automatically by Husky pre-commit hooks
3. Dependabot manages dependency updates via PRs
4. Security vulnerabilities are checked automatically
