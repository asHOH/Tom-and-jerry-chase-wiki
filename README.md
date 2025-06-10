# 猫和老鼠手游角色技能百科

一个专为《猫和老鼠手游》玩家打造的角色技能查询网站，由玩家社区共同维护。

## 📱 功能简介

- **角色技能查询**: 查看角色的属性、技能信息
- **技能推荐加点**: 秒懂技能加点，快速上手
- **知识卡查询**: 查看知识卡及其效果
- **移动端适配**: 支持手机、平板等设备

### 亮点
- 更精确的角色数值
- 更准确的角色定位
- 更简洁的技能描述
- 直观展示技能加点

## 🚀 快速开始

### 在线访问
直接访问：[项目链接](#) *(待部署)*

### 本地运行
需要 Node.js 18+ 环境：

```powershell
# 克隆项目
git clone https://github.com/asHOH/tom-and-jerry-chase-wiki.git
cd tom-and-jerry-chase-wiki

# 安装依赖
npm install

# 初始化数据库
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 启动开发服务器
npm run dev
```

之后浏览器访问 http://localhost:3000 查看网站

## 🤝 一起完善这个项目

### 补充数据

1. 在 `src/data/` 目录下找到数据文件
  - [`catCharacters.ts`](./src/data/catCharacters.ts) - 猫阵营角色数据
  - [`mouseCharacters.ts`](./src/data/mouseCharacters.ts) - 鼠阵营角色数据
2. 参考已有格式创建新角色
3. （可选）补充角色图片和技能图片
  - 角色图片：[`public/images/cats/`](./public/images/cats/) 或 [`public/images/mice/`](./public/images/mice/)
  - 技能图片：[`public/images/catSkills/`](./public/images/catSkills/) 或 [`public/images/mouseSkills/`](./public/images/mouseSkills/)

**提交方式:**

**方式一：✅ GitHub 老玩家**
1. Fork仓库 → 补充数据 → 发起Pull Request
2. 简要说明新增内容和数据来源

**方式二：🌱 GitHub 新手**
1. 点击仓库页面的 [Issues](../../issues) 标签
2. 创建新 Issue
3. 标题写角色名，内容贴角色数据

### 开发功能

欢迎开发者贡献代码！以下是项目的发展计划（按优先级排序）：

#### 🚀 急
- **角色筛选系统** - 按角色定位、外观等条件筛选角色
- **搜索功能** - 直接搜索特定角色或知识卡
- **知识卡推荐** - 根据角色推荐知识卡搭配

#### 📋 不急
- **角色克制关系** - 展示角色间的克制和配合关系

#### 🎨 技术改进
- 代码重构
- UI美化
- 移动端适配改进

**开发流程:**
1. Fork 仓库并创建功能分支：`git checkout -b feature/你的功能名`
2. 开发并推送分支：`git push origin feature/你的功能名`
3. 创建 Pull Request

## 📁 项目结构

```
├── src/data/           # 游戏数据文件
├── public/images/      # 角色图片和图标
├── src/app/            # 页面组件
├── src/components/     # 可复用组件
└── prisma/             # 数据库配置
```

## 🛠 技术栈

- **前端**: Next.js + React + TailwindCSS
- **数据库**: SQLite + Prisma ORM
- **部署**: GitHub Pages

## 📄 版权说明

### 代码许可证：GPL-3.0
- **适用范围**: 所有代码文件 (`.ts`, `.tsx`, `.js`, `.css` 等)
- **要求**: 衍生作品必须开源并使用相同许可证
- 详见 [LICENSE-GPL](./LICENSE-GPL) 文件

### 内容许可证：CC BY 4.0
- **适用范围**: 文档、数据等内容
- **要求**: 使用时必须署名原作者
- **允许**: 商业使用、修改、分发
- 详见 [LICENSE-CC-BY](./LICENSE-CC-BY) 文件

### 署名要求
使用本项目内容时请标注：
- **原作者**: asHOH (GitHub: [@asHOH](https://github.com/asHOH))
- **来源**: [Tom and Jerry Chase Wiki](https://github.com/asHOH/Tom-and-jerry-chase-wiki)
- **遵守对应许可证**:

**注意**: 此许可证不涉及《猫和老鼠》游戏素材的版权，游戏相关版权请参见免责声明。

## ⚠️ 免责声明

本网站为非营利粉丝项目，仅供学习交流。

猫和老鼠（Tom and Jerry）角色版权归华纳兄弟娱乐公司（Warner Bros. Entertainment Inc.）所有。游戏素材版权归网易猫和老鼠手游所有。

如版权方要求移除相关内容，我们将立即配合处理。请通过 Github Issues 联系我们。

**特别鸣谢:**
- B站UP主 [梦回_淦德蒸蚌](https://space.bilibili.com/1193776217)、[是莫莫喵](https://space.bilibili.com/443541296) 提供的测试数据
- B站UP主 [凡叔哇](https://space.bilibili.com/273122087) 分享的图片素材

---

**感谢所有为项目贡献数据和代码的玩家和开发者！** 🎮
