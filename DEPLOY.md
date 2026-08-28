# 部署指南 零基础版

有 Vercel 账号可以不用看这篇，直接点击这个按钮：[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FasHOH%2FTom-and-jerry-chase-wiki%2Ftree%2Fdevelop&env=NEXT_PUBLIC_DISABLE_ARTICLES,NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL,NEXT_TELEMETRY_DISABLED&envDefaults=%7B%22NEXT_PUBLIC_DISABLE_ARTICLES%22%3A%221%22%2C%22NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL%22%3A%221%22%2C%22NEXT_TELEMETRY_DISABLED%22%3A%221%22%7D&envDescription=The%20environmental%20values%20disable%20some%20features.&project-name=tjwiki&repository-name=tjwiki&demo-title=%E7%8C%AB%E5%92%8C%E8%80%81%E9%BC%A0%E6%89%8B%E6%B8%B8%E7%99%BE%E7%A7%91&demo-description=%E7%8C%AB%E5%92%8C%E8%80%81%E9%BC%A0%E6%89%8B%E6%B8%B8wiki%20-%20%E6%8F%90%E4%BE%9B%E8%AF%A6%E7%BB%86%E7%9A%84%E8%A7%92%E8%89%B2%E5%B1%9E%E6%80%A7%E3%80%81%E6%8A%80%E8%83%BD%E3%80%81%E5%8A%A0%E7%82%B9%E3%80%81%E7%9F%A5%E8%AF%86%E5%8D%A1%E6%9F%A5%E8%AF%A2%E6%8E%A8%E8%8D%90%E7%AD%89%E6%95%B0%E6%8D%AE%E5%92%8C%E6%94%BB%E7%95%A5&demo-url=https%3A%2F%2Fwww.tjwiki.com&demo-image=https%3A%2F%2Fwww.tjwiki.com%2Ficon.png)，然后一路下一步，即可在 Vercel 上部署服务。

Netlify 也一样：[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https%3A%2F%2Fgithub.com%2FasHOH%2FTom-and-jerry-chase-wiki#NEXT_PUBLIC_DISABLE_ARTICLES=1&NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL=1&NEXT_TELEMETRY_DISABLED=1&branch=develop)。

<!-- TODO: Add button for cloudflare worker -->

如果不使用这种 serverless 服务，还可以选择这三种自部署的方式，都会使服务在 3000 端口运行：

- Docker
- 自动化运维脚本 (Linux 推荐)
- 手动运行 npm

另外可以通过以下两种可选方式来使你的服务能在外网访问：

- Cloudflare Tunnel
- 配置 Nginx 或 Caddy（需要服务器有公网 IP）

## 方法一 Docker

### 第 1 步 安装 Docker

#### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

#### macOS / Windows

安装 [Docker Desktop](https://www.docker.com/products/docker-desktop) 并打开

### 第 2 步 获取项目代码

```bash
git clone https://github.com/asHOH/Tom-and-jerry-chase-wiki.git
cd Tom-and-jerry-chase-wiki
git checkout develop
```

### 第 3 步 构建并启动

```bash
docker compose build
docker compose up -d
```

第一次会比较慢，因为需要下载依赖并构建。

### 更新

```bash
git pull
docker compose build
docker compose up -d
```

## 方法二 自动化运维脚本 (Linux 推荐)

`scripts/ops/deploy_server.sh` 是推荐的 Linux 生产部署脚本，一次性执行拉取代码、安装依赖、构建，并在成功后重载 pm2。`scripts/ops/start_server.sh` 只负责运行时启动 `next start`，供 pm2 托管。特点：

- **原地构建与恢复**: 需要重新构建时会先验证并保存当前可用版本，再停止 pm2 站点进程；构建期间站点不可用，候选版本失败时会自动尝试恢复已验证的上一版本
- **环境配置**: 自动安装 NVM 与 Node.js；自动切换 npm 镜像源（npmmirror/官方）
- **智能更新**: Git 拉取防超时；依赖未变化时跳过重复安装
- **运行托管**: pm2 只托管站点进程；`cloudflared` 单独作为系统服务运行

### 使用方法

1. 下载脚本：

   ```bash
   mkdir -p ~/tjwiki-ops
   cd ~/tjwiki-ops
   wget https://raw.githubusercontent.com/asHOH/Tom-and-jerry-chase-wiki/develop/scripts/ops/deploy_server.sh
   wget https://raw.githubusercontent.com/asHOH/Tom-and-jerry-chase-wiki/develop/scripts/ops/start_server.sh
   chmod +x deploy_server.sh start_server.sh
   ```

2. 首次部署：

   ```bash
   ./deploy_server.sh
   ```

   首次运行会克隆仓库到 `Tom-and-jerry-chase-wiki` 目录，并在缺少 `.env.production` 时提示先补齐生产环境变量。

3. 后续更新：

   ```bash
   cd ~/tjwiki-ops
   ./deploy_server.sh
   ```

4. 脚本技术细节（可忽略）

   需要重新构建时，脚本会先验证当前 pm2 进程的健康状态、提交版本和构建输出，并保存该版本的提交号、`.next` 与生成的运行时公共文件，然后停止 pm2 站点进程并原地构建。构建成功后，pm2 会启动或重载 `tjwiki`、验证健康状态和提交版本，再清理临时备份。

   如果候选版本在备份完成后的依赖安装、构建、启动或验证阶段失败，脚本会以非零状态退出，并自动尝试恢复上一源码提交、构建输出、生成的运行时公共文件和匹配的依赖，再重新启动并验证站点。自动恢复本身失败时仍需人工处理。构建和恢复期间站点不可用。

   依赖成功安装后，脚本会在 `node_modules` 中保存依赖输入指纹。`package.json`、`package-lock.json`、`.npmrc`、Node/npm 版本、平台架构及安装策略均未变化时，后续部署会跳过 `npm ci`。如需修复可能被手动修改或损坏的 `node_modules`，可强制重新安装：

   ```bash
   FORCE_DEPENDENCY_INSTALL=1 ./deploy_server.sh
   ```

   如果无法从远程仓库拉取 `develop`，部署会以非零状态退出。

5. 健康检查

   部署后，脚本会同时检查本机 `/api/health` 的响应内容和 `/api/version` 返回的提交版本。可按需设置以下变量来检查经过反向代理或 CDN 的公开访问路径：

   ```bash
   PUBLIC_HEALTH_CHECK_URL=https://www.tjwiki.com/api/health \
   PUBLIC_VERSION_CHECK_URL=https://www.tjwiki.com/api/version \
   ./deploy_server.sh
   ```

   可通过 `HEALTH_CHECK_MAX_ATTEMPTS` 和 `HEALTH_CHECK_RETRY_DELAY_SECONDS` 调整验证次数与间隔。

6. 配置 pm2 开机自启：

   ```bash
   pm2 startup
   pm2 save
   ```

   `pm2 startup` 会输出一条需要使用 `sudo` 执行的命令，请按提示执行一次。

## 方法三 手动构建

### 第 1 步 安装 Node.js

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
# 请安装 20.3.0 以上版本
nvm install 20
```

### 第 2 步 下载项目

```bash
git clone https://github.com/asHOH/Tom-and-jerry-chase-wiki.git
cd Tom-and-jerry-chase-wiki
```

### 第 3 步 设置环境变量

[`.env.example`](./.env.example) 是部署环境变量示例，请复制为 `.env.local`，再按照文件内的注释替换需要启用的功能所对应的值：

```bash
cp .env.example .env.local
```

### 第 4 步 安装依赖与构建

```bash
npm install
# 内存较小请先运行: export NEXT_CPU_COUNT=1
npm run build
```

### 第 5 步 启动

```bash
npm run start
```

## Supabase 数据库迁移（维护者）

本节仅适用于你自己创建并有权管理的 Supabase 项目。官方站点及其测试项目的数据库凭据不会提供给第三方，也不应被请求、共享或复用。请按照 [`.env.example`](./.env.example) 配置你自己的项目；`SUPABASE_SECRET_KEY` 具有高权限，只能保存在服务端环境变量中，绝对不应提交到 Git 或发送到浏览器。

当待部署代码包含 `supabase/migrations/` 中的新迁移时，应先在本地回放并测试迁移、重新生成数据库类型，然后将 Supabase CLI 链接到你自己的目标项目。以下命令中的 `--linked` 始终表示当前操作者自行链接的项目；执行前必须核对 project ref，确认不会误操作其他数据库：

```bash
npm exec -- supabase migration list --linked
npm exec -- supabase db push --linked --dry-run
npm exec -- supabase db push --linked
```

仅在 migration list 两侧一致、dry run 只列出预期迁移且已确认目标项目后继续。应用后再次运行 dry run，要求返回无待应用迁移，并验证函数权限和关键查询。回滚应使用新的前向迁移，不要修改已经应用的迁移文件。

`--include-all` 只用于经过审计的历史账本修复，不是常规部署选项。若迁移通过 Supabase MCP 或 Dashboard 应用，必须把远端生成的**同一版本号和 SQL**提交到 `supabase/migrations/`；不要随后用另一个时间戳提交等价迁移。发现本地与远端迁移历史不一致时立即停止并核对，不要重复执行 SQL 或直接采用 CLI 的批量 repair 建议。

## 进阶配置 (非 Vercel 部署)

如需启用版本显示、Analytics、ICP备案信息或 API 限流等可选功能，请以 [`.env.example`](./.env.example) 中的注释为准。

`next.config.ts` 已在运行时发送核心安全头（CSP、HSTS 等），请在目标平台（如 Netlify、Cloudflare、Nginx）继续配置静态资源头信息，保持与 `vercel.json` 一致的缓存策略。

## 可选 让别人用域名访问

你已经能用 3000 端口打开网站后再看这一节。

### 方式一 Cloudflare Tunnel

没公网 IP 就用 Cloudflare 大法啦！但因为境内没有它的服务器，所以访问会比较慢。

#### 第 1 步 准备 Cloudflare 账号和域名

1. 注册 Cloudflare。
2. 把你的域名接入 Cloudflare，按提示修改 DNS。

#### 第 2 步 安装 cloudflared

如果你的服务器的操作系统是 Ubuntu 或 Debian，你可以参照以下这个示例：

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-main.list
sudo apt update
sudo apt install -y cloudflared
```

#### 第 3 步 登录 Cloudflare

```bash
cloudflared tunnel login
```

#### 第 4 步 创建隧道

把 `tjwiki` 换成你喜欢的名字：

```bash
cloudflared tunnel create tjwiki
```

#### 第 5 步 绑定域名

例如你要用 `wiki.example.com`：

```bash
cloudflared tunnel route dns tjwiki wiki.example.com
```

#### 第 6 步 配置转发

创建配置文件，路径如下。

```bash
sudo mkdir -p /etc/cloudflared
sudo vim /etc/cloudflared/config.yml
```

把下面内容粘贴进去，把域名换成你的。

```yml
tunnel: tjwiki
credentials-file: /root/.cloudflared/tjwiki.json

ingress:
  - hostname: wiki.example.com
    service: http://localhost:3000
  - service: http_status:404
```

保存并退出。附 vim 常用指令：`"*p`（从系统剪切板粘贴），`i`（进入插入模式），`<Esc>`（退出插入模式），`:wq`（保存并退出）

#### 第 7 步 作为服务运行

如果你使用 **Token 管理的 Tunnel**（推荐），请在 Cloudflare Dashboard 中为目标域名分别配置 Public Hostname，目标都指向 `http://127.0.0.1:3000`。

先保存 token：

```bash
sudo install -D -m 600 /path/to/tunnel.token /etc/cloudflared/tunnel.token
```

创建 systemd 服务：

```bash
sudo tee /etc/systemd/system/cloudflared.service > /dev/null <<'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Restart=always
RestartSec=5
ExecStart=/usr/bin/cloudflared tunnel --loglevel info run --token-file /etc/cloudflared/tunnel.token

[Install]
WantedBy=multi-user.target
EOF
```

启用并检查状态：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared --no-pager
journalctl -u cloudflared -n 50 --no-pager
```

如果状态是 `active (running)`，并且日志中能看到 `Registered tunnel connection`，就说明隧道已经连通。

#### 第 8 步 访问

- `https://wiki.example.com/`

### 方式二 配置 Nginx 或 Caddy

#### 选项 A Nginx

安装

```bash
sudo apt update
sudo apt install -y nginx
```

创建配置文件

```bash
sudo vim /etc/nginx/sites-available/tjwiki
```

写入

```nginx
server {
  listen 80;
  server_name YOUR_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

启用并重启

```bash
sudo ln -sf /etc/nginx/sites-available/tjwiki /etc/nginx/sites-enabled/tjwiki
sudo nginx -t
sudo systemctl restart nginx
```

现在访问 `http://YOUR_DOMAIN/` 就会转到 3000。

#### 选项 B Caddy

安装

```bash
sudo apt update
sudo apt install -y caddy
```

编辑配置

```bash
sudo vim /etc/caddy/Caddyfile
```

写入

```caddy
YOUR_DOMAIN {
  reverse_proxy 127.0.0.1:3000
}
```

重启

```bash
sudo systemctl restart caddy
```
