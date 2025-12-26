# 部署指南 零基础版

有 Vercel 账号可以不用看这篇，直接点击这个按钮：[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FasHOH%2FTom-and-jerry-chase-wiki&env=NEXT_PUBLIC_DISABLE_ARTICLES,NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL,NEXT_TELEMETRY_DISABLED&envDefaults=%7B%22NEXT_PUBLIC_DISABLE_ARTICLES%22%3A%221%22%2C%22NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL%22%3A%221%22%2C%22NEXT_TELEMETRY_DISABLED%22%3A%221%22%7D&envDescription=The%20environmental%20values%20disable%20some%20features.&project-name=tjwiki&repository-name=tjwiki&demo-title=%E7%8C%AB%E5%92%8C%E8%80%81%E9%BC%A0%E6%89%8B%E6%B8%B8%E7%99%BE%E7%A7%91&demo-description=%E7%8C%AB%E5%92%8C%E8%80%81%E9%BC%A0%E6%89%8B%E6%B8%B8wiki%20-%20%E6%8F%90%E4%BE%9B%E8%AF%A6%E7%BB%86%E7%9A%84%E8%A7%92%E8%89%B2%E5%B1%9E%E6%80%A7%E3%80%81%E6%8A%80%E8%83%BD%E3%80%81%E5%8A%A0%E7%82%B9%E3%80%81%E7%9F%A5%E8%AF%86%E5%8D%A1%E6%9F%A5%E8%AF%A2%E6%8E%A8%E8%8D%90%E7%AD%89%E6%95%B0%E6%8D%AE%E5%92%8C%E6%94%BB%E7%95%A5&demo-url=https%3A%2F%2Ftjwiki.com&demo-image=https%3A%2F%2Ftjwiki.com%2Ficon.png)，然后一路下一步，即可在 Vercel 上部署服务。

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

`scripts/ops/start_server.sh` 是为 Linux 生产环境设计的自动化脚本，主站就在用此脚本维护。特点：

- **环境配置**: 自动安装 NVM 与 Node.js；自动切换 npm 镜像源（npmmirror/官方）
- **智能更新**: Git 拉取防超时、断点续传；仅在代码变更时增量构建
- **一键启动**: 自动处理环境变量加载与服务启动

### 使用方法

1. 下载脚本：

   ```bash
   mkdir -p ~/tjwiki-ops
   cd ~/tjwiki-ops
   wget https://raw.githubusercontent.com/asHOH/Tom-and-jerry-chase-wiki/develop/scripts/ops/start_server.sh
   chmod +x start_server.sh
   ```

2. 运行脚本：
   ```bash
   ./start_server.sh
   ```
   首次运行会克隆仓库到 `Tom-and-jerry-chase-wiki` 目录，并生成 `.env.production` 模板文件。请按提示填入环境变量后再次运行。

## 方法三 手动构建

### 第 1 步 安装 Node.js

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
```

### 第 2 步 下载项目

```bash
git clone https://github.com/asHOH/Tom-and-jerry-chase-wiki.git
cd Tom-and-jerry-chase-wiki
```

### 第 3 步 设置两项关闭开关

```bash
cat << EOF > .env.local
export NEXT_PUBLIC_DISABLE_ARTICLES=1
export NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL=1
EOF
```

### 第 4 步 安装依赖与构建

```bash
npm install
npm run build
```

### 第 5 步 启动

```bash
npm run start
```

## 进阶配置 (非 Vercel 部署)

如需更高级的功能（版本显示、深色模式 Cookie 跨域、Analytics），请参考以下配置：

1. **环境变量**
   - 在构建阶段注入 `COMMIT_SHA`（或 `DEPLOY_COMMIT_SHA`）以保证 `/api/version` 返回准确版本信息。
   - `DEPLOYMENT_ENVIRONMENT`（可选值 `development`/`preview`/`production`）标记运行环境；如不设置将回退为 `NODE_ENV`。
   - 将 `APP_PUBLIC_HOST` 设置为生产域名（例如 `wiki.example.com`）以确保深色模式 Cookie 覆盖所有子域。
   - 默认不加载 Vercel Analytics/Speed Insights。若需使用，将 `NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS` 设为 `1`。

2. **安全头与缓存策略**
   - `next.config.mjs` 已在运行时发送核心安全头（CSP、HSTS 等），请在目标平台（如 Netlify、Cloudflare、Nginx）继续配置静态资源头信息，保持与 `vercel.json` 一致的缓存策略。

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

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared --no-pager
```

如果状态是 running，就成功了。

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
