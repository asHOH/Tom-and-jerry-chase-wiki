# 猫和老鼠手游百科

[![CI](https://github.com/asHOH/Tom-and-jerry-chase-wiki/actions/workflows/ci.yml/badge.svg)](https://github.com/asHOH/Tom-and-jerry-chase-wiki/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://tjwiki.com)
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

- **在线网站**: [tjwiki.com](https://tjwiki.com)
- **开发预览**: [develop 分支预览](https://dev.tjwiki.com)

## 💬 社区交流

- **QQ交流群**: [615882730](https://qun.qq.com/universal-share/share?ac=1&authKey=%2BgPPblp3JfnQP2o3BI5PO1NmwvsNciCCaVCtSI9T6RAbv6yV2QHzzjz6gwY%2Bva9U&busi_data=eyJncm91cENvZGUiOiI2MTU4ODI3MzAiLCJ0b2tlbiI6Ijg3Ym9kMk9HTUVFTnJSU25GU2JCdWJoNEwxNGNOUlhWMGgvK3lMTWRGdy80Z0FnaUd4Yy9LYkZsYUJ5ZStTbUgiLCJ1aW4iOiIyOTAxODMzMjI1In0%3D&data=0yzCZAnaW0ZOxf01YibLkPBLkN17DRX2fS1NGi5Nndx2Qq2DMFDdWr1pxH3J8F9RefUGjWh_Zel5Rfjy-dPZ2A&svctype=4&tempid=h5_group_info) (了解项目进展、提供建议、贡献内容、技术交流)

## 🛠️ 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **状态管理**: [Valtio](https://valtio.pmnd.rs/) & [SWR](https://swr.vercel.app/)
- **测试**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)
- **部署**: [Vercel](https://vercel.com/)
- **代码规范**: [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

## 💻 本地开发

### 环境要求

- **Node.js**: `>=20.0.0`
- **npm**: `>=10.0.0`

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

### 主要 npm 命令

```bash
# 开发
npm run dev             # 启动开发服务器
npm run build           # 构建生产版本
npm run start           # 启动生产服务器

# 代码质量
npm run lint            # 运行 ESLint
npm run lint:fix        # 修复 ESLint 问题
npm run format          # 格式化代码 (Prettier + ESLint)
npm run type-check      # TypeScript 类型检查

# 测试
npm test                # 运行测试
npm run test:watch      # 监视模式
npm run test:coverage   # 生成覆盖率报告
npm run test:ci         # CI 优化测试

# 工具
npm run clean           # 清理构建产物
npm run analyze         # 包分析
```

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
    - **macOS/Linux**: `./test-github-workflows.bash`
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

- **编辑模式** - 角色攻略（小心rce）、知识卡、特技、道具、角色详情中知识卡组的组合
- **统一伤害写法** - 统一为基础（+增伤）的形式
- **特殊爪刀CD** - 苏蕊、托普斯、天汤等等

#### 📋 不急

- **增强筛选** - 按外观筛选角色
- **角色关系** - 展示角色间的克制和配合关系
- **统一用词** - 技能描述中的“硬直/眩晕”，等等
- **NPC** - 斯派克、女主人等
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
├── .husky/             # Git 钩子配置
├── public/             # 静态资源 (图片, PWA manifest)
├── src/
│   ├── app/            # Next.js App Router 页面与 API 路由
│   ├── components/     # 可复用 React 组件
│   │   ├── ui/         # 基础 UI 组件
│   │   └── displays/   # 复杂展示组件
│   ├── constants/      # 全局常量
│   ├── context/        # React Context 提供者
│   ├── data/           # 核心游戏数据与类型定义
│   ├── lib/            # 工具函数与业务逻辑
├── scripts/            # 工具脚本
├── README.md           # 项目说明
└── package.json        # 项目依赖与脚本
```

## 📄 版权与许可

- **代码**: [GPL-3.0](./LICENSE-GPL) 许可。二次开发须以相同的许可证开源。
- **数据和文档内容**: [CC BY 4.0](./LICENSE-CC-BY) 许可。使用时请署名原作者 **asHOH** 并链接到本仓库。

**注意**: 《猫和老鼠手游》素材的版权见[免责声明](#️-免责声明)。

## ⚠️ 免责声明

本网站为非盈利粉丝项目，仅供学习交流。

**🔒 隐私承诺：** 永不收集任何用户数据。

**💰 免费承诺：** 所有功能永久免费。

猫和老鼠（Tom and Jerry）角色版权归华纳兄弟娱乐公司（Warner Bros. Entertainment Inc.）所有。游戏素材版权归网易猫和老鼠手游所有。

若版权方提出要求，我们将立即调整。

**特别鸣谢:**

- [追风汤姆](https://space.bilibili.com/3493135485241940)、[隔壁老米LM](https://space.bilibili.com/3493090618771682)、音乐家杰瑞、[梦回\_淦德蒸蚌](https://space.bilibili.com/1193776217)、[是莫莫喵](https://space.bilibili.com/443541296) 提供测试数据
- [隔壁老米LM](https://space.bilibili.com/3493090618771682)、[凡叔哇](https://space.bilibili.com/273122087) 分享图片素材
- [海阔天空](https://github.com/3swordman)、音乐家杰瑞 进行项目开发
- [海阔天空](https://github.com/3swordman)、[追风汤姆](https://space.bilibili.com/3493135485241940)、[隔壁老米LM](https://space.bilibili.com/3493090618771682)、音乐家杰瑞、[雨狼嗷嗷](https://space.bilibili.com/3546721078479411)、[爱你不慎走安详](https://space.bilibili.com/3493083362625926)、[虚拟未来](https://space.bilibili.com/489570540)、人畜有害的白菜、SYSTEM_CPYTHON、[夜空乄浩瀚](https://space.bilibili.com/3546658333788386)、[追风汤姆Official](https://space.bilibili.com/1060009579)、[-无尽炽羽-](https://space.bilibili.com/3493104889891012)、[北雀](https://space.bilibili.com/510324311)、一个气球君、鸽子、你小睿大帝、大水将军、[冰美式](https://space.bilibili.com/439320147)、[饮泉思源](https://zh.moegirl.org.cn/User:Yqsychzs)、[睡亿夏](https://space.bilibili.com/1350743315)、[港鸽](https://space.bilibili.com/431678062)、[若梦](https://space.bilibili.com/3537122405386648)、生煎包勇闯猫鼠、祈风盼陌上花开、[\_1322\_](https://space.bilibili.com/508985250)、dream、[乐善好施陈阿姨](https://space.bilibili.com/418408689) 撰写角色文案

---

**再次感谢所有为项目作出贡献的玩家和开发者！** 🎮
