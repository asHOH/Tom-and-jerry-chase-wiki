# Vercel 迁移清单

## ✅ 准备阶段

- [x] 创建 `vercel.json` 配置文件
- [x] 创建 `.github/workflows/deploy-vercel.yml`
- [x] 更新 README.md 部署说明

## 🔑 Vercel 设置

- [ ] 注册/登录 Vercel 账户
- [ ] 安装 Vercel CLI: `npm i -g vercel`
- [ ] 连接 GitHub 仓库到 Vercel
- [ ] 获取并设置 GitHub Secrets:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`

## 🌐 域名迁移

- [ ] 从 GitHub Pages 解绑域名
  - [ ] GitHub 仓库 → Settings → Pages → 删除 Custom domain
  - [ ] 禁用 GitHub Pages (Source: None)
- [ ] 在 Vercel 中添加域名
  - [ ] Vercel Dashboard → 项目 → Settings → Domains
  - [ ] 添加 `tom-and-jerry-chase-wiki.space`
- [ ] 更新 DNS 记录
  - [ ] 将 A 记录指向 Vercel IP
  - [ ] 等待 DNS 传播 (最多24小时)

## 🗑️ 清理工作

- [x] 禁用 GitHub Pages 部署工作流
- [x] 注释 `public/CNAME` 文件
- [ ] 确认 Vercel 部署成功后删除:
  - [ ] `.github/workflows/deploy.yml`
  - [ ] `public/CNAME`

## 🧪 测试验证

- [ ] 推送代码触发 Vercel 部署
- [ ] 验证网站在新域名下正常访问
- [ ] 检查所有功能正常工作
- [ ] 验证 CDN 和缓存策略
- [ ] 测试移动端性能

## 📈 后续优化

- [ ] 配置 Vercel Analytics
- [ ] 设置性能监控
- [ ] 优化图片压缩和CDN
- [ ] 配置环境变量 (如果需要)

## 🚨 回滚计划 (如有问题)

- [ ] 重新启用 GitHub Pages 部署工作流
- [ ] 恢复 `public/CNAME` 文件
- [ ] 将域名 DNS 重新指向 GitHub Pages
