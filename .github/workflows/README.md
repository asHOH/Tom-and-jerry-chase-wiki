# GitHub Actions Workflows

This directory contains automated workflows for the project.

## 🔄 Workflows

### 1. **CI (ci.yml)**

- **Triggers**: Push/PR to main/develop branches
- **Purpose**: Code quality checks and testing
- **Jobs**:
  - Database Types: Replay migrations and verify generated Supabase types
  - Code Quality: Actor profiles, Prettier formatting, Oxlint, Tailwind class simplifications, TypeScript compilation
  - Tests & Coverage: Run tests and generate coverage reports

### 2. **Security Audit (dependency-check.yml)**

- **Triggers**: Package.json changes, weekly schedule
- **Purpose**: Security vulnerability detection

## 🛡️ Quality Gates

All workflows ensure:

- ✅ Code formatting (Prettier) - _CI and Husky pre-commit hooks_
- ✅ Supabase database type generation remains synchronized with migrations
- ✅ Linting (Oxlint) - _CI and Husky pre-commit hooks_
- ✅ Tailwind class simplifications (`npm run check:tailwind`) - _CI only; Git hooks unchanged_
- ✅ Type checking (TypeScript)
- ✅ Test execution and coverage
- ✅ Security compliance

## 📋 Workflow Dependencies

```
CI ──── Database Types, Code Quality, Tests & Coverage

Security Audit ── Dependency vulnerability checks
```

## 🔧 Configuration

- **Node.js Version**: 26
- **Package Manager**: npm
- **Build Tool**: Next.js
- **Deployment**: VPS + Cloudflare Tunnel (production), Vercel (development preview)
- **Code Quality**: CI checks, plus Husky + lint-staged for existing pre-commit checks
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
