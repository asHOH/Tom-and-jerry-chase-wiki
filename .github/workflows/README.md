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
- **Failure threshold**: Moderate or higher, including development dependencies

#### Transitive dependency overrides

`package.json` scopes security overrides to affected versions while upstream consumers retain older requirements:

| Package                   | Affected versions | Override  | Consumers                       |
| ------------------------- | ----------------- | --------- | ------------------------------- |
| `glob`                    | `>=9.0.0 <14.0.2` | `^14.0.6` | Jest, Serwist, coverage tooling |
| `minimatch`               | `>=7.0.0 <11.0.1` | `^11.0.8` | Coverage tooling                |
| `postcss-selector-parser` | `<6.1.5`          | `^6.1.5`  | Tailwind typography             |

The version ranges preserve unaffected dependency branches, including consumers of the legacy `minimatch` API. Remove each override when upstream requirements resolve patched versions directly. Validate dependency changes with a clean install, the security audit, coverage and script tests, and `npm run build:skip-images` to exercise service-worker generation.

As of 2026-11-17, Jest's [`deepmerge` advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) has no patched release. It remains visible as low-severity findings below the CI failure threshold; npm's proposed forced fix downgrades Jest.

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
