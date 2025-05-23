# 猫和老鼠手游角色技能数据库

这是一个用于存储和展示猫和老鼠手游角色技能内容的网站。

## 功能特点

- 按阵营（猫/鼠）分类展示角色
- 详细展示每个角色的技能信息
- 支持存储技能的多个等级数据
- 支持存储角色图片和技能视频
- 响应式设计，适配各种设备

## 技术栈

- **前端**: Next.js, React, TailwindCSS
- **后端**: Next.js API Routes
- **数据库**: SQLite (通过 Prisma ORM)
- **部署**: GitHub Pages

## 开发指南

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. 克隆仓库
   ```
   git clone https://github.com/yourusername/tom-and-jerry-chase-data.git
   cd tom-and-jerry-chase-data
   ```

2. 安装依赖
   ```
   npm install
   ```

3. 设置环境变量
   创建 `.env` 文件（已存在），确保包含以下内容：
   ```
   DATABASE_URL="file:./dev.db"
   ```

4. 初始化数据库
   ```
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. 启动开发服务器
   ```
   npm run dev
   ```

6. 访问 http://localhost:3000 查看网站

### 数据库管理

- 重置数据库: `npm run db:reset`
- 生成 Prisma 客户端: `npm run prisma:generate`
- 创建新的迁移: `npm run prisma:migrate`
- 填充种子数据: `npm run prisma:seed`

## 项目结构

```
tom-and-jerry-chase-data/
├── prisma/                  # Prisma 配置和迁移
│   ├── schema.prisma        # 数据库模型定义
│   └── seed.ts              # 种子数据脚本
├── public/                  # 静态资源
│   ├── images/              # 角色图片
│   └── videos/              # 技能视频
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API 路由
│   │   ├── characters/      # 角色页面
│   │   ├── factions/        # 阵营页面
│   │   ├── globals.css      # 全局样式
│   │   ├── layout.tsx       # 根布局
│   │   └── page.tsx         # 首页
│   └── lib/                 # 工具库
│       └── prisma.ts        # Prisma 客户端
├── .env                     # 环境变量
├── next.config.js           # Next.js 配置
├── package.json             # 项目依赖
├── postcss.config.js        # PostCSS 配置
├── tailwind.config.js       # Tailwind CSS 配置
└── tsconfig.json            # TypeScript 配置
```

## 部署到 GitHub Pages

1. 构建项目
   ```
   npm run build
   ```

2. 将 `out` 目录推送到 GitHub 仓库的 `gh-pages` 分支

3. 在 GitHub 仓库设置中启用 GitHub Pages，选择 `gh-pages` 分支作为源

## 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT
