# 猫和老鼠手游百科

[![CI](https://github.com/asHOH/Tom-and-jerry-chase-wiki/actions/workflows/ci.yml/badge.svg)](https://github.com/asHOH/Tom-and-jerry-chase-wiki/actions/workflows/ci.yml)
[![Deploy](https://github.com/asHOH/Tom-and-jerry-chase-wiki/actions/workflows/deploy.yml/badge.svg)](https://github.com/asHOH/Tom-and-jerry-chase-wiki/actions/workflows/deploy.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

专为《猫和老鼠手游》玩家打造的数据查询网站。

## 📱 功能简介

- **角色查询**: 查看角色属性、技能
- **技能加点**: 秒懂技能加点，快速上手
- **知识卡查询**: 查看知识卡及其效果

## 🌟 亮点

- 精确的角色数值
- 简洁的技能描述
- 直观的技能加点

## 🚀 快速开始

### 在线体验

访问链接：[tom-and-jerry-chase-wiki.space](https://tom-and-jerry-chase-wiki.space)

### 本地部署

环境要求：Node.js 18+

```powershell
# 克隆项目
git clone https://github.com/asHOH/tom-and-jerry-chase-wiki.git
cd tom-and-jerry-chase-wiki

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后，在浏览器访问 http://localhost:3000 即可。

## 🤝 一起完善这个项目吧

### 补充数据

1. 数据文件位于 `src/data/` 目录下：

- [`catCharacters.ts`](./src/data/catCharacters.ts) - 猫阵营角色数据
- [`mouseCharacters.ts`](./src/data/mouseCharacters.ts) - 鼠阵营角色数据

2. 参考现有格式添加新角色数据。
3. （可选）补充角色及技能图片：

- 角色图片：[`public/images/cats/`](./public/images/cats/) 或 [`public/images/mice/`](./public/images/mice/)
- 技能图片：[`public/images/catSkills/`](./public/images/catSkills/) 或 [`public/images/mouseSkills/`](./public/images/mouseSkills/)

**提交方式:**

**方法一：✅ GitHub 老手**

1. Fork 仓库 → 切换到 develop 分支 → 补充数据 → 进行[提交前检查](#-提交前检查) → 发起 Pull Request (目标分支: develop)
2. 简要说明新增内容和数据来源

**方法二：🌱 GitHub 新手**

1. 点击仓库页面的 [Issues](../../issues) 标签
2. 创建新 Issue
3. 标题写角色名，内容贴角色数据

### 开发功能

项目计划：

#### 🚀 急

- **角色筛选** - 按定位、外观等条件筛选角色
- **内容搜索** - 直接搜索特定角色或知识卡
- **知识卡推荐** - 为每个角色推荐知识卡搭配

#### 📋 不急

- **角色克制关系** - 展示角色间的克制和配合关系

#### 🎨 技术改进

- 代码重构
- UI美化
- 移动端适配改进

**开发流程:**

1. Fork 仓库并切换到 develop 分支：`git checkout develop`
2. 创建功能分支：`git checkout -b feature/你的功能名`
3. 进行[提交前检查](#-提交前检查)
4. 完成开发后推送分支：`git push origin feature/你的功能名`
5. 发起 Pull Request，目标分支选择 `develop`

**注意**: 所有功能开发都应基于 `develop` 分支，PR 也应提交到 `develop` 分支。`main` 分支仅用于稳定版本发布。

### 🧪 提交前检查

发起 Pull Request 前，请运行以下命令检查代码：

```powershell
# 自动检查所有项目要求 (Windows PowerShell)
.\test-github-workflows.ps1
```

> **系统要求**: 此脚本需要 Windows PowerShell。macOS/Linux 用户请运行下方的单个命令进行检查。

**脚本功能**：

- 自动检查代码格式、规范、编译和构建
- 如果发现 Prettier 格式问题，会提示是否自动修复

如果检查失败，也可手动运行以下命令排查：

```powershell
npm run prettier:fix    # 修复代码格式
npm run lint            # 检查代码规范
npm run lint -- --fix   # 自动修复ESLint问题
npm test                # 运行测试套件
npm run test:watch      # 监视模式运行测试
npm run test:coverage   # 生成测试覆盖率报告
npm run build           # 构建项目
npx tsc --noEmit        # TypeScript类型检查
npm audit               # 检查依赖安全性
```

## 📁 项目结构

```
├── src/data/           # 游戏数据文件
├── public/images/      # 角色图片和图标
├── src/app/            # 页面组件
└── src/components/     # 可复用组件
```

## 🛠 技术栈

- **前端**: Next.js + React + TailwindCSS
- **部署**: GitHub Pages

## 📄 版权说明

### 代码许可证：GPL-3.0

- **范围**: 所有代码文件 (`.ts`, `.tsx`, `.js` 等)
- **要求**: 二次开发必须开源并使用相同许可证
- 详见 [LICENSE-GPL](./LICENSE-GPL) 文件

### 内容许可证：CC BY 4.0

- **范围**: 文档、数据等内容
- **要求**: 使用时署名原作者
- **允许**: 商用、修改、分发
- 详见 [LICENSE-CC-BY](./LICENSE-CC-BY) 文件

### 署名要求

使用本项目内容时请标注：

- **原作者**: asHOH (GitHub: [@asHOH](https://github.com/asHOH))
- **来源**: [Tom and Jerry Chase Wiki](https://github.com/asHOH/Tom-and-jerry-chase-wiki)
- **遵守对应许可证**

**注意**: 许可证不涉及《猫和老鼠手游》素材的版权。相关版权见免责声明。

## ⚠️ 免责声明

本网站为非盈利粉丝项目，仅供学习交流。

猫和老鼠（Tom and Jerry）角色版权归华纳兄弟娱乐公司（Warner Bros. Entertainment Inc.）所有。游戏素材版权归网易猫和老鼠手游所有。

若版权方提出要求，我们将立即配合调整相关内容。反馈渠道：Github Issues。

**🔒 隐私承诺**

本网站承诺永远不会收集、存储或分析任何用户数据。

**💰 免费承诺**

本网站承诺所有功能永久免费。

⚠️ **反诈提醒：如有任何网站声称是本项目但要求付费，请捂紧钱包并举报！**

**特别鸣谢:**

- B站UP主 [梦回\_淦德蒸蚌](https://space.bilibili.com/1193776217)、[是莫莫喵](https://space.bilibili.com/443541296) 提供的测试数据
- B站UP主 [凡叔哇](https://space.bilibili.com/273122087) 分享的图片素材

---

**再次感谢所有为项目贡献数据和代码的玩家和开发者！** 🎮
