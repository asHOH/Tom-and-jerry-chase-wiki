# reply style

- concise and informative

# Project Information

- **Type**: Static site (SSG) using Next.js with static export
- **Framework**: Next.js 14+ with TypeScript
- **Deployment**: Vercel with static hosting
- **Language**: Chinese (zh-CN)
- **Architecture**: Client-side only, no server-side rendering
- **Security**: Strict CSP for static content, no dynamic script loading

# Command line syntax

- Use PowerShell syntax: semicolons (`;`) instead of `&&`, `$env:VAR` for environment variables

# Comment edit rules

- Use meaningful variable/function names over comments
- Add comments only for: complex logic, non-obvious algorithms, or public APIs

# Code Standards

- use context7 to check lastest documentation
- Follow project's existing patterns
- Ensure TypeScript strict mode compliance
- Write features with least net code increase
- Avoid inline scripts/styles and use build-time bundling for CSP compliance (although not required for this project)
- Ensure your implementation plan complies with best practices before and after editing
- Optimize for static delivery and client-side hydration
- Write a recommended commit message after each step with `commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .{1,80}'`
