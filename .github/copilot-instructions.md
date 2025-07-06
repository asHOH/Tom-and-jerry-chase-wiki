# reply style

- Be concise. Eliminate filler words.

# Project Information

- **Type**: Static site (SSG) using Next.js with static export
- **Framework**: Next.js 14+ with TypeScript
- **Deployment**: Vercel with static hosting
- **Language**: Chinese (zh-CN)
- **Architecture**: Client-side only, no server-side rendering
- **Security**: Strict CSP for static content, no dynamic script loading

# Command line syntax

- Use PowerShell syntax: `;` instead of `&&`, etc.

# Comment edit rules

- Use meaningful variable/function names over comments
- Add comments only for: complex logic, non-obvious algorithms, or public APIs

# Code Standards

- Follow project's existing patterns
- Ensure TypeScript strict mode compliance
- Write features with least net code increase
- Avoid inline scripts/styles and use build-time bundling for CSP compliance (though not required)
- Ensure your implementation plan complies with best practices before and after editing
- Optimize for static delivery and client-side hydration
- Write a draft commit message after each step with `feat|fix|docs|style|refactor|perf|test|chore(scope): ...` as a reference.
