# 猫和老鼠手游百科

[![CI](https://github.com/asHOH/Tom-and-jerry-chase-wiki/actions/workflows/ci.yml/badge.svg)](https://github.com/asHOH/Tom-and-jerry-chase-wiki/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://tom-and-jerry-chase-wiki.space)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![QQ群](https://img.shields.io/badge/QQ群-615882730-brightgreen?logo=tencentqq&logoColor=white)](https://qun.qq.com/universal-share/share?ac=1&authKey=%2BgPPblp3JfnQP2o3BI5PO1NmwvsNciCCaVCtSI9T6RAbv6yV2QHzzjz6gwY%2Bva9U&busi_data=eyJncm91cENvZGUiOiI2MTU4ODI3MzAiLCJ0b2tlbiI6Ijg3Ym9kMk9HTUVFTnJSU25GU2JCdWJoNEwxNGNOUlhWMGgvK3lMTWRGdy80Z0FnaUd4Yy9LYkZsYUJ5ZStTbUgiLCJ1aW4iOiIyOTAxODMzMjI1In0%3D&data=0yzCZAnaW0ZOxf01YibLkPBLkN17DRX2fS1NGi5Nndx2Qq2DMFDdWr1pxH3J8F9RefUGjWh_Zel5Rfjy-dPZ2A&svctype=4&tempid=h5_group_info)

专为《猫和老鼠手游》玩家打造的数据查询网站。

## 📱 功能简介

- **角色查询**: 查看角色属性、技能、推荐加点和知识卡等
- **知识卡查询**: 查看知识卡及其效果
- **筛选与搜索**: 快速找到目标角色或知识卡。

## 🌟 亮点

- 精确的角色数值
- 简洁的技能描述
- 直观的技能加点

## 🚀 快速访问

- **在线网站**: [tom-and-jerry-chase-wiki.space](https://tom-and-jerry-chase-wiki.space)
- **开发预览**: [develop 分支预览](https://dev.tom-and-jerry-chase-wiki.space)

## 💬 社区交流

- **QQ交流群**: [615882730](https://qun.qq.com/universal-share/share?ac=1&authKey=%2BgPPblp3JfnQP2o3BI5PO1NmwvsNciCCaVCtSI9T6RAbv6yV2QHzzjz6gwY%2Bva9U&busi_data=eyJncm91cENvZGUiOiI2MTU4ODI3MzAiLCJ0b2tlbiI6Ijg3Ym9kMk9HTUVFTnJSU25GU2JCdWJoNEwxNGNOUlhWMGgvK3lMTWRGdy80Z0FnaUd4Yy9LYkZsYUJ5ZStTbUgiLCJ1aW4iOiIyOTAxODMzMjI1In0%3D&data=0yzCZAnaW0ZOxf01YibLkPBLkN17DRX2fS1NGi5Nndx2Qq2DMFDdWr1pxH3J8F9RefUGjWh_Zel5Rfjy-dPZ2A&svctype=4&tempid=h5_group_info) (了解项目进展、提供建议、贡献内容、技术交流)

## 🛠️ 技术栈

- **框架**: [Next.js 14](https://nextjs.org/) (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **测试**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)
- **部署**: [Vercel](httpss://vercel.com/) (静态导出 `next export`)
- **代码规范**: [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

## 💻 本地开发

### 环境要求

- **Node.js**: `^20.0.0`
- **npm**: `^10.0.0`

### 开发步骤

1.  **克隆仓库**:

    ```bash
    git clone https://github.com/asHOH/Tom-and-jerry-chase-wiki.git
    cd Tom-and-jerry-chase-wiki
    ```

2.  **安装依赖**:

    ```bash
    npm install
    ```

3.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    之后，在浏览器中打开 `http://localhost:3000` 即可。

### 主要 NPM 命令

- `npm run dev`: 启动开发模式
- `npm run build`: 构建生产版本
- `npm test`: 运行单元测试
- `npm run lint`: 检查代码规范
- `npm run format`: 格式化所有代码

## 🤝 一起完善这个项目吧

### 贡献流程

**方法一：✅ GitHub 老手**

1.  **Fork** 本仓库。
2.  基于 `develop` 分支创建新的功能分支:
    ```bash
    git checkout develop
    git checkout -b feature/your-feature-name
    ```
3.  进行代码开发或数据修改。
4.  提交代码前，运行本地检查以确保代码质量：
    - **Windows (PowerShell)**: `.\test-github-workflows.ps1`
    - **macOS/Linux**: `.\test-github-workflows.bash`
5.  提交 Pull Request 到 `develop` 分支。

**方法二：🌱 GitHub 新手**

加入我们的[QQ群](#-社区交流)吧~

### 数据文件结构

- **猫角色数据**: [`src/data/catCharacters.ts`](src/data/catCharacters.ts)
- **鼠角色数据**: [`src/data/mouseCharacters.ts`](src/data/mouseCharacters.ts)
- **猫知识卡**: [`src/data/catKnowledgeCards.ts`](src/data/catKnowledgeCards.ts)
- **鼠知识卡**: [`src/data/mouseKnowledgeCards.ts`](src/data/mouseKnowledgeCards.ts)
- **图片资源**: [`public/images/`](public/images)

### 开发功能

项目计划：

#### 🚀 急

- **贡献者名单** - 创建并维护项目贡献者名单
- **返回按钮** - 为知识卡推荐的链接增加快速返回原角色的按钮
- **角色攻略** - 操作、意识等等
- **同一伤害写法** - 统一为基础(+增伤)的形式
- **特殊爪刀CD** - 苏蕊、托普斯等等
- **一武/二武专属定位** - 如图多一武和二武可以承担完全不同的定位
- **增强筛选** - 按外观筛选角色

#### 📋 不急

- **折叠** - 角色信息页面各种区域支持折叠，如加点、知识卡推荐等
- **萌新专区** - 类似博客的形式
- **角色关系** - 展示角色间的克制和配合关系
- **统一用词** - 硬直/眩晕，等等
- **特技** - 猫、鼠双方的特技
- **药水** - 五种药水的功能
- **年鉴** - 历代更新和角色调整记录
- **画廊** - 各种猫鼠二创
- **地图** - 展示地图，以及点位信息（墙缝、库博传送、几何桶等）

#### 🎨 技术改进

- UI美化
- 移动端适配改进

## 📁 项目结构

```
.
├── .github/            # GitHub Actions 工作流与模板
├── public/             # 静态资源 (图片, PWA manifest)
├── src/
│   ├── app/            # Next.js 页面与路由
│   ├── components/     # 可复用 React 组件
│   ├── constants/      # 全局常量
│   ├── context/        # React Context
│   ├── data/           # 核心游戏数据
│   └── lib/            # 工具函数与辅助模块
├── templates/          # 数据贡献模板
├── README.md           # 项目说明
└── package.json        # 项目依赖与脚本
```

## 📄 版权与许可

- **代码**: [GPL-3.0](./LICENSE-GPL) 许可。二次开发须以相同的许可证开源。
- **数据和文档内容**: [CC BY 4.0](./LICENSE-CC-BY) 许可。使用时请署名原作者 **asHOH** 并链接到本仓库。

**注意**: 许可不涉及《猫和老鼠手游》素材的版权。相关版权见[免责声明](#️-免责声明)。

## ⚠️ 免责声明

本网站为非盈利粉丝项目，仅供学习交流。

猫和老鼠（Tom and Jerry）角色版权归华纳兄弟娱乐公司（Warner Bros. Entertainment Inc.）所有。游戏素材版权归网易猫和老鼠手游所有。

若版权方提出要求，我们将立即配合调整。反馈渠道：Github Issues。

**🔒 隐私承诺：** 本网站承诺永不收集或分析任何用户数据。

**💰 免费承诺：** 本网站承诺所有功能永久免费。

**⚠️ 反诈提醒：** 如有任何网站声称是本项目但要求付费，请捂紧钱包并举报！

**特别鸣谢:**

- B站UP主 [梦回\_淦德蒸蚌](https://space.bilibili.com/1193776217)、[是莫莫喵](https://space.bilibili.com/443541296) 提供的测试数据
- B站UP主 [凡叔哇](https://space.bilibili.com/273122087) 分享的图片素材

---

**再次感谢所有为项目作出贡献的玩家和开发者！** 🎮
