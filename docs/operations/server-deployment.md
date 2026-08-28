# 服务器部署与维护手册

## 什么时候需要这份手册

本手册面向已经完成首次部署、需要维护自托管服务器的操作者。第一次启动站点请先阅读 [`DEPLOY.md`](../../DEPLOY.md)。

这里记录自动化部署脚本的恢复机制、高级健康检查、反向代理注意事项，以及 Cloudflare Tunnel 的本地管理方式。

## 自动化部署脚本

[`scripts/ops/deploy_server.sh`](../../scripts/ops/deploy_server.sh) 负责拉取代码、安装依赖、构建、启动或重载 pm2，并验证健康状态和提交版本。[`scripts/ops/start_server.sh`](../../scripts/ops/start_server.sh) 只负责运行 `next start`，供 pm2 托管。

### 构建和恢复

需要重新构建时，部署脚本会先验证当前 pm2 进程、提交版本和构建输出，并保存当前可用版本的提交号、`.next` 与生成的运行时公共文件。随后脚本停止站点进程并原地构建，因此构建期间站点不可用。

候选版本在依赖安装、构建、启动或验证阶段失败时，脚本会以非零状态退出，并尝试恢复上一源码提交、构建输出、运行时公共文件和匹配依赖。自动恢复也失败时必须人工处理；不要把失败的候选构建当作已部署版本。

无法从远程仓库拉取 `develop` 时，脚本同样会以非零状态退出。

### 依赖安装

依赖成功安装后，脚本会在 `node_modules` 中保存依赖输入指纹。`package.json`、`package-lock.json`、`.npmrc`、Node/npm 版本、平台架构及安装策略都未变化时，后续部署会跳过 `npm ci`。

如果 `node_modules` 可能被手动修改或损坏，可强制重新安装：

```bash
FORCE_DEPENDENCY_INSTALL=1 ./deploy_server.sh
```

### 公开路径健康检查

部署脚本默认检查本机 `/api/health` 的响应和 `/api/version` 的提交版本。需要同时检查经过反向代理或 CDN 的公开路径时，传入：

```bash
PUBLIC_HEALTH_CHECK_URL=https://www.example.com/api/health \
PUBLIC_VERSION_CHECK_URL=https://www.example.com/api/version \
./deploy_server.sh
```

可通过 `HEALTH_CHECK_MAX_ATTEMPTS` 和 `HEALTH_CHECK_RETRY_DELAY_SECONDS` 调整验证次数和间隔。公开 URL 必须指向本次部署的站点，避免验证到其他环境或旧域名。

## 反向代理和缓存

`next.config.ts` 会为运行时响应发送核心安全头，包括 CSP 和 HSTS。使用 Netlify、Cloudflare、Nginx 或其他代理时，还应为静态资源配置与 `vercel.json` 一致的缓存策略。

变更代理或 CDN 配置后，至少检查：

- 首页、静态资源和 `/_next/` 资源可访问；
- `/api/health` 和 `/api/version` 未被错误缓存；
- HTTPS、Host、`X-Forwarded-For` 和 `X-Forwarded-Proto` 转发符合部署拓扑；
- 旧构建资源不会覆盖当前部署。

## Cloudflare Tunnel

首次部署推荐使用 [`DEPLOY.md`](../../DEPLOY.md) 中的 Dashboard 管理方式。Cloudflare 也建议大多数场景使用 remotely-managed Tunnel；本地管理方式主要用于测试、旧配置或必须把路由配置保存在服务器上的场景。

### 本地管理方式

1. 安装 `cloudflared`，然后登录并创建 Tunnel：

   ```bash
   cloudflared tunnel login
   cloudflared tunnel create tjwiki
   cloudflared tunnel list
   ```

2. 从创建命令的输出中记录 Tunnel UUID 和凭据文件的真实路径。凭据文件名是 UUID，不是 Tunnel 名称。
3. 在当前用户的 `~/.cloudflared/config.yml` 中配置路由：

   ```yml
   tunnel: <TUNNEL_UUID>
   credentials-file: /home/<USER>/.cloudflared/<TUNNEL_UUID>.json

   ingress:
     - hostname: wiki.example.com
       service: http://127.0.0.1:3000
     - service: http_status:404
   ```

4. 验证配置并绑定 DNS：

   ```bash
   cloudflared tunnel ingress validate
   cloudflared tunnel route dns <TUNNEL_UUID> wiki.example.com
   ```

5. 显式指定配置文件安装系统服务，避免 `sudo` 将 `$HOME` 切换到 `/root` 后找不到配置：

   ```bash
   sudo cloudflared --config /home/<USER>/.cloudflared/config.yml service install
   sudo systemctl start cloudflared
   sudo systemctl status cloudflared --no-pager
   ```

不要把 remotely-managed Tunnel 的 token 服务命令与本地 `config.yml`/credentials-file 流程混用。详细说明以 Cloudflare 的[本地管理 Tunnel](https://developers.cloudflare.com/tunnel/advanced/local-management/)和[Linux 服务](https://developers.cloudflare.com/tunnel/advanced/local-management/as-a-service/linux/)文档为准。
