# 安全策略

## 核心安全原则

- **最小权限**: 项目仅包含运行网站所必需的代码和依赖。
- **无用户数据**: 本网站不收集、不存储任何用户个人信息。
- **依赖管理**: 定期审查和更新第三方依赖，通过 Dependabot 自动修复漏洞。

## 安全措施

### 内容安全策略 (CSP)

本项目通过 Vercel 部署，并配置了严格的 **Content-Security-Policy (CSP)** 头，以防止跨站脚本（XSS）和其他代码注入攻击。

### 其他安全头

我们还启用了以下 HTTP 安全头来增强防护：

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 开发安全

- **无硬编码密钥**: 代码库中不含任何 API 密钥、密码或其他敏感凭证。
- **TypeScript 严格模式**: 启用 `strict` 模式，从源头上避免了许多常见的类型相关漏洞。

## 报告安全问题

如果您发现了任何安全漏洞，请通过 [GitHub Issues](https://github.com/asHOH/Tom-and-jerry-chase-wiki/issues/new) 联系我们。
