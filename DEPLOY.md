# 首次部署指南（零基础）

本指南面向第一次部署自己站点的用户，只介绍如何启动项目并让网站可以访问。已有站点的数据库迁移、生产维护和游戏数据整理不属于首次部署，请参阅文末的“部署完成后的维护”。

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

4. 部署成功后，脚本会检查本机健康状态和提交版本；构建失败时会尝试恢复上一可用版本。高级参数和恢复机制见[服务器部署与维护手册](./docs/operations/server-deployment.md)。

5. 配置 pm2 开机自启：

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
# 版本要求以 package.json 的 engines、packageManager 和 devEngines 为准
nvm install 22
nvm use 22
npm install --global npm@11.18.0
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

## 进阶配置 (非 Vercel 部署)

如需启用版本显示、Analytics、ICP备案信息或 API 限流等可选功能，请以 [`.env.example`](./.env.example) 中的注释为准。

## 可选 让别人用域名访问

你已经能用 3000 端口打开网站后再看这一节。

### 方式一 Cloudflare Tunnel

没有公网 IP 时可以使用 Cloudflare Tunnel。首次部署推荐使用 Cloudflare Dashboard 管理的 Tunnel；本地 `config.yml` 管理方式见[服务器部署与维护手册](./docs/operations/server-deployment.md)。

#### 第 1 步 准备 Cloudflare 账号和域名

1. 注册 Cloudflare。
2. 把你的域名接入 Cloudflare，按提示修改 DNS。

#### 第 2 步 在 Dashboard 创建 Tunnel

1. 在 Cloudflare Dashboard 打开 **Networking > Tunnels**。
2. 创建一个 Cloudflared Tunnel。
3. 添加 Public Hostname，例如 `wiki.example.com`，Service 设置为 `http://127.0.0.1:3000`。

#### 第 3 步 安装 cloudflared

如果你的服务器的操作系统是 Ubuntu 或 Debian，你可以参照以下这个示例：

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-main.list
sudo apt update
sudo apt install -y cloudflared
```

#### 第 4 步 作为服务运行

打开刚创建的 Tunnel，选择添加 connector/replica，然后复制 Dashboard 显示的 Linux 安装命令。命令形式如下，其中 token 属于敏感凭据，不要提交到 Git 或分享给他人：

```bash
sudo cloudflared service install <TUNNEL_TOKEN>
```

检查服务状态：

```bash
sudo systemctl status cloudflared --no-pager
journalctl -u cloudflared -n 50 --no-pager
```

如果服务是 `active (running)` 且 Dashboard 显示 connector 已连接，Tunnel 就已连通。Cloudflare 的当前安装说明见[官方文档](https://developers.cloudflare.com/tunnel/downloads/)。

#### 第 5 步 访问

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

## 部署完成后的维护

首次部署后，遇到对应维护任务时可参考以下文档：

- [服务器部署与维护手册](./docs/operations/server-deployment.md)：部署脚本恢复机制、高级健康检查、反向代理和 Cloudflare Tunnel 高级配置。
- [Supabase 数据库迁移运维手册](./docs/operations/supabase-migrations.md)：已有站点出现新 migration 时的检查、推送和历史核对。
- [游戏数据修改归档与切换运维手册](./docs/operations/game-data-action-compaction.md)：Supabase 中积累了已审核的游戏数据修改，并准备永久合并进仓库时使用。
