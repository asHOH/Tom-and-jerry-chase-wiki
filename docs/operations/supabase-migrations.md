# Supabase 数据库迁移运维手册

## 什么时候需要这份手册

首次部署只使用未启用 Supabase 动态功能的默认配置时，不需要执行这里的操作。

本手册适用于升级仓库锁定的 Supabase CLI、回放本地 migration 和更新数据库类型，以及向自己有权管理的 Supabase 项目应用新 migration。官方站点及其测试项目的凭据不会提供给第三方，也不应被请求、共享或复用。

## 凭据和目标确认

按照 [`.env.example`](../../.env.example) 配置自己的项目。`SUPABASE_SECRET_KEY` 具有高权限，只能保存在服务端环境变量中，不得提交到 Git、写入公开日志或发送给浏览器。

维护者 checkout 可能仍链接到生产项目。每次操作前都必须独立核对 Supabase project ref；测试项目应通过 `STAGING_DATABASE_URL` 和 `--db-url` 明确指定，不要依赖当前 CLI link 或历史终端上下文猜测目标。

维护者的 `develop` / `dev.tjwiki.com` 使用 `tjwiki-test`。Vercel 的 Preview 环境为 `develop` 单独设置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY` 和 `SUPABASE_DATABASE_PASSWORD`；新建预览分支时也应显式确认目标，避免继承生产数据库凭据。测试环境账号、文章和待审核数据独立于生产站点。

## Supabase CLI 升级

Dependabot 为 npm 包 `supabase` 的版本升级创建独立 PR。即使 migration 没有变化，新版生成器也可能改变类型结构、生成列的写入类型或输出格式，因此升级后必须重新生成并检查数据库类型。

1. 切换到升级 PR 的分支，运行 `npm ci`，再用 `npm exec -- supabase --version` 确认实际版本与 `package.json` 中锁定的版本一致。
2. 启动 Docker，在可丢弃的本地数据库上执行[迁移流程](#迁移流程)第 2 步的完整命令，回放 migration、生成类型并通过 `check:database-types` 和 `type-check`。`db reset --local` 会清空本地数据；有需要保留的数据时，先备份或使用隔离的本地环境。
3. 检查生成差异，修复新版类型暴露的调用方错误，并运行相关测试。将有变化的 `src/data/database.generated.ts` 与 `package.json`、`package-lock.json` 放在同一个升级 PR 中提交；不要手工修改生成文件。
4. 确认该 PR 的 `Database Types`、代码质量和测试检查通过后再合并。

仅升级 CLI 不需要向远端数据库推送 migration；有新增 migration 时再按下方流程处理远端。

## 迁移流程

### Data API 显式授权

Supabase 自 2026 年 10 月 30 日起停止为现有项目的 `public` 新表自动授予 Data API 权限；已有表保留原权限。新项目、预览环境和本地 reset 回放 migration 时会重新创建表，因此也必须具备显式授权。

创建供 Data API 使用的表或视图时，在同一 migration 中按调用角色声明所需的 `GRANT`，并配置 RLS 与策略。`security_invoker` 视图还需要调用角色拥有底层表的读取权限；`service_role` 绕过 RLS，仍需对象权限。序列权限按实际调用需要单独授予。

历史表的必要授权由 `20261020000000_explicit_data_api_grants.sql` 补齐。保留已有的 RPC 写入边界、通知 `read_at` 列级更新权限和发布操作表的服务端只读权限；避免通过 `GRANT ALL ON ALL TABLES` 恢复默认开放。已应用的历史 migration 保持原样，修正通过新 migration 完成。

验证时应在关闭自动授权的可丢弃本地环境完整回放，再运行 `npm exec -- supabase test db` 检查权限与现有数据库行为。仓库当前锁定的 CLI 可在临时测试配置的 `[api]` 下设置 `auto_expose_new_tables = false`；该开关属于过渡配置，升级 CLI 时应核对是否仍支持。

### 执行步骤

1. 在本地回放并测试 migration。
2. 运行 `npm run generate:database-types`，提交生成的 `src/data/database.generated.ts`；不要手工修改该文件。

   类型文件必须通过仓库锁定的 CLI 从本地数据库生成，与 CI 保持一致。不要用 Dashboard、`--linked` 或 `--project-id` 的远端生成结果覆盖该文件：远端输出可能包含本地生成器不输出的 `__InternalSupabase.PostgrestVersion`，即使数据库结构一致也会导致 CI 失败。

   在可丢弃的本地数据库上执行以下完整检查（`db reset --local` 会清空本地数据）：

   ```bash
   npm ci
   npm exec -- supabase db start
   npm exec -- supabase db reset --local --no-seed
   npm run generate:database-types
   npm run check:database-types
   npm run type-check
   git diff -- src/data/database.generated.ts
   ```

   检查输出的差异；若涉及表、字段或函数，先核对 migration 是否完整，不要只为通过 CI 删除类型。项目自定义的类型修正应放在 `src/data/database.types.ts`。

3. 将 Supabase CLI 链接到自己确认过的目标项目。
4. 查看迁移历史并执行 dry run：

   ```bash
   npm exec -- supabase migration list --linked
   npm exec -- supabase db push --linked --dry-run
   ```

5. 只有在本地和远端 migration history 一致、dry run 只包含预期 migration 且 project ref 正确时，才执行：

   ```bash
   npm exec -- supabase db push --linked
   ```

6. 应用后再次运行 dry run，要求没有待应用 migration，并验证相关函数权限和关键查询。

回滚应通过新的前向 migration 完成。不要修改已经应用到任何远端环境的 migration 文件。

## 文章草稿安全迁移（2026-10-28）

`20261028000000_article_submission_idempotency.sql`、`20261028000001_article_version_conflicts.sql` 和 `20261028000002_retire_pending_article_edits.sql` 应与对应应用版本一起发布。写入 RPC 的参数和权限会变化；安排短暂的文章提交、编辑及审核维护窗口，先按上述流程应用迁移，再切换应用并验证创建、重试、编辑和审核。旧应用直接写入的入口会失败，已经打开的旧编辑页面需先复制保存草稿，再刷新。

旧的 `/api/articles/edit-pending/[versionId]` 入口及对应数据库函数已移除。所有内容修改通过现有编辑页创建新版本；被替换的待审核版本会保留历史记录并撤销，审核操作始终针对固定的内容。

提交请求记录与文章版本在同一事务中保存。已完成请求的重试返回原始结果；清理这些记录会丢失对应请求的去重能力。新应用仍能恢复旧格式请求的已有回执，尚未完成且缺少版本信息的旧请求会要求刷新。

历史待审核版本的编辑起点保留为“未知”，内容和贡献者信息保持原样。作者在编辑页获取最新公开及待审核快照，手动合并草稿后确认更新编辑起点，再提交新版本。审核会拒绝起点未知或已经过期的版本。撤销已公开版本继续沿用原有回退行为。

## 历史不一致和非 CLI 应用

`--include-all` 只用于经过审计的 migration ledger 修复，不是常规部署选项。

如果 migration 通过 Supabase MCP 或 Dashboard 应用，必须把远端使用的**同一版本号和同一 SQL**提交到 `supabase/migrations/`。不要随后用另一个时间戳提交等价 migration，否则本地和远端账本会永久分叉。

发现 migration history 不一致时立即停止并核对。不要重复执行 SQL，也不要直接采用 CLI 输出的批量 repair 建议。必须先确认：

- SQL 是否已经实际应用；
- 远端 ledger 记录了哪个版本号；
- 本地是否缺少远端使用的原始 migration 文件；
- 当前连接的 project ref 是否正确。

只有在差异来源和预期最终账本都经过审查后，才能进行 ledger 修复。
