# reply style

- concise and informative

# Command line syntax

- Use PowerShell syntax: semicolons (`;`) instead of `&&`, `$env:VAR` for environment variables

# Comment edit rules

- Add comments only for: complex logic, non-obvious algorithms, or public APIs

# Code Standards

- Use meaningful variable/function names over comments
- Follow project's existing patterns
- Ensure TypeScript strict mode compliance
- Write features with least net code increase
- Ensure your implementation plan complies with best practices before and after editing
- When doing a multiple-step task, stop and write a recommended commit message after each step with `commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .{1,80}'`
