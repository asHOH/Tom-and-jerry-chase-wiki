# reply style

- concise and informative

# Command line syntax

- Use PowerShell syntax: semicolons (`;`) instead of `&&`, `$env:VAR` for environment variables

# Comment edit rules

- Add comments only for: complex logic, non-obvious algorithms, or public APIs

# Code Standards

- Follow project's existing patterns and conventions
- Prioritize TypeScript strict mode compliance
- Use meaningful variable/function names over comments
- Write features with least net code increase
- Ensure that your implementation complies with best practices before and after the change
- When doing a task with multiple steps, stop and write a recommended commit message with `prefix(scope): description` after each step

# File Editing Tool Preference

- Avoid `replace_string_in_file`, `patch_edit`, `text_edit`, or any model-specific editing tool.
