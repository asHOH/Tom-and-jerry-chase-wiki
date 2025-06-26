# 安全策略

作为纯静态网站，我们已极力减少潜在的攻击可能性。

## 核心安全原则

- **最小权限**: 项目仅包含运行网站所必需的代码和依赖，无服务端逻辑。
- **无用户数据**: 本网站不收集、不存储任何用户个人信息。
- **依赖管理**: 定期审查和更新第三方依赖，修复漏洞。

## 安全措施

### 漏洞扫描

- **自动化依赖检查**: 我们使用 `npm audit` 和 Dependabot 来持续监控 `node_modules` 中的漏洞，并及时更新。

### 内容安全策略 (CSP)

本项目通过 Vercel 部署，并配置了严格的 **Content-Security-Policy (CSP)** 头，以防止跨站脚本（XSS）和其他代码注入攻击。策略包括：

- `default-src 'self'`: 限制资源的加载源为本站域名。
- `style-src 'self' 'unsafe-inline'`: 允许加载本站的样式文件以及内联样式（Tailwind CSS 所需）。
- `img-src 'self' data:`: 允许加载本站图片以及 Base64 编码的图片数据。

### 其他安全头

我们还启用了以下 HTTP 安全头来增强防护：

- `X-Content-Type-Options: nosniff`: 防止浏览器进行 MIME 类型嗅探。
- `X-Frame-Options: DENY`: 防止网站被嵌入到 `<iframe>` 中，避免点击劫持攻击。
- `Referrer-Policy: strict-origin-when-cross-origin`: 控制 `Referer` 头信息的发送范围。
- `Permissions-Policy`: 限制摄像头、麦克风等敏感 API 的使用权限。

### 开发安全

- **无硬编码密钥**: 代码库中不含任何 API 密钥、密码或其他敏感凭证。
- **TypeScript 严格模式**: 启用 `strict` 模式，从源头上避免了许多常见的类型相关漏洞。
- **静态导出**: 项目采用 `output: 'export'` 模式，生成纯静态 HTML/CSS/JS 文件，不依赖 Node.js 服务器环境，从而消除了所有服务器端攻击向量。

## 报告安全问题

如果您发现了任何安全漏洞，请通过以下方式联系我们：

- **GitHub Issues**: [创建新 Issue](https://github.com/asHOH/Tom-and-jerry-chase-wiki/issues/new)

我们会对所有报告进行处理。
