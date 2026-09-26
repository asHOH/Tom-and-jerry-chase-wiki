# 服务器部署与维护手册

## 什么时候需要这份手册

本手册面向已经完成首次部署、需要维护自托管服务器的操作者。第一次启动站点请先阅读 [`DEPLOY.md`](../../DEPLOY.md)。

这里记录自动化部署脚本的恢复机制、高级健康检查、反向代理注意事项，以及 Cloudflare Tunnel 的本地管理方式。

## 自动化部署脚本

[`scripts/ops/deploy_server.sh`](../../scripts/ops/deploy_server.sh) 负责拉取代码、安装依赖、构建、启动或重载 pm2，并验证健康状态和提交版本。[`scripts/ops/start_server.sh`](../../scripts/ops/start_server.sh) 只负责运行 `next start`，供 pm2 托管。

### 构建和恢复

需要重新构建时，部署脚本先验证当前 pm2 进程、提交版本和构建输出，再在原仓库旁的 `Tom-and-jerry-chase-wiki.releases/` 中创建独立 Git worktree。候选版本有自己的源码、`node_modules`、`.next`、公共文件和 `.env.production`，安装依赖及构建期间不会停止或修改当前版本。

构建成功后，脚本保留上一版本，短暂停止并重新注册同名 pm2 进程，使其从候选目录启动。健康检查通过后才确认切换；日志的 `cutover_time` 记录切换至验证完成的耗时。这不是零停机部署，但停机窗口不再包含构建时间。没有变化时只验证当前版本，不重启进程。

依赖安装或构建失败时，脚本以非零状态退出，当前版本继续运行。启动或验证失败时，会直接从保留的上一版本目录启动，不需要重新构建或安装依赖。自动恢复也失败时保留目录供人工处理；不要把失败的候选构建当作已部署版本。

首次升级时，脚本会在切换前复制原地运行版本的构建输出、依赖和公共文件，作为可恢复的旧版本。成功切换后，原仓库更新至已部署提交，供后续部署和维护使用；pm2 从独立目录提供服务。原仓库中的旧 `.next` 不再代表线上产物。原仓库的 `.tmp/deploy/current` 与 `.tmp/deploy/previous` 分别指向当前版本和保留的上一版本，后续成功部署会清理更早的保留版本。

首次启用此流程时，应先将新版部署脚本下载到仓库外，从原仓库的父目录运行它；不要先对正在原地提供服务的仓库执行 `git pull` 或 `git reset`，否则源码提交与线上构建不一致会导致旧版本验证失败。例如，原仓库位于 `/workspace/Tom-and-jerry-chase-wiki`，且新版脚本已经合入 `develop` 时：

```bash
cd /workspace
curl -fsSL https://raw.githubusercontent.com/asHOH/Tom-and-jerry-chase-wiki/develop/scripts/ops/deploy_server.sh -o deploy_server.sh
bash ./deploy_server.sh --force-build
```

发布目录和依赖缓存需要额外磁盘空间，复制时尽量使用文件系统的 reflink，不使用会联动修改文件内容的硬链接。不要手动移动或删除当前发布目录，也不要在发布目录内运行 `git pull`、`npm ci` 或构建命令。修改生产配置仍应编辑原仓库的 `.env.production` 后重新部署。

2 vCPU、4 GB 内存服务器默认仍使用一个构建 worker。自动堆上限会参考当前可用内存，为运行中的站点和原生分配预留至少 1 GiB 的可用余量；连最低 768 MiB 堆上限都无法满足时，构建前退出。`NODE_MEMORY_LIMIT` 可显式覆盖自动值，但它只限制每个 Node 进程的 V8 old-space，不限制整个构建的总内存。首次部署应观察服务器峰值内存；空间不足时改用异机构建。

服务器构建继续跳过 TypeScript 检查，部署前应确保该提交已通过开发端或 CI 检查。脚本不会等待 CI。为避免准备阶段重启其他应用，部署不再自动执行 `pm2 update`；PM2 daemon 升级应单独安排。并发部署由 `flock` 拒绝。

无法从远程仓库拉取 `develop` 时，脚本同样会以非零状态退出。

### 数据库变化后的同版本重建

部署脚本的跳过构建判断不包含数据库内容。游戏数据归档后，即使代码提交不变，也需要重新构建以更新数据快照。只重载 PM2 或看到提交号一致，不代表这一步完成。

在 VPS 仓库根目录运行：

```bash
./scripts/ops/deploy_server.sh --force-build
```

`--force-build` 强制创建独立候选版本，保留上一版本和失败恢复，不强制安装依赖；不需要手动删除构建复用记录或整个 `.next`。确认最终日志为 `build=built`，然后按[游戏数据归档流程](./game-data-action-compaction.md)运行最终检查。使用仓库外的脚本副本时，先更新该副本以支持此流程。

### 依赖安装

依赖成功安装后，脚本会在 `node_modules` 中保存依赖输入指纹。`package.json`、`package-lock.json`、`.npmrc`、Node/npm 版本、平台架构及安装策略都未变化时，新候选目录会复制匹配依赖并跳过 `npm ci`。构建缓存也独立复制，候选版本不会写入当前版本的缓存。

如果 `node_modules` 可能被手动修改或损坏，可强制重新安装：

```bash
FORCE_DEPENDENCY_INSTALL=1 ./deploy_server.sh
```

### 公开路径健康检查

部署脚本默认检查本机 `/api/health` 的响应，以及 `/api/version` 是否包含预期提交版本和非空的 `gameDataArtifact` 对象。缺少构建快照时，即使提交号正确也会部署失败；关闭文章功能时生成的空快照仍可通过检查。保存和恢复旧版本时只要求健康状态和提交号匹配，以便从尚未提供快照信息的旧版本升级或回退。需要同时检查经过反向代理或 CDN 的公开路径时，传入：

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
