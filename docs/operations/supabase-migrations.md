# Supabase 数据库迁移运维手册

## 什么时候需要这份手册

首次部署只使用未启用 Supabase 动态功能的默认配置时，不需要执行这里的操作。

本手册适用于维护自己创建且有权管理的 Supabase 项目，并且待部署代码在 `supabase/migrations/` 中包含目标数据库尚未应用的新 migration。官方站点及其测试项目的凭据不会提供给第三方，也不应被请求、共享或复用。

## 凭据和目标确认

按照 [`.env.example`](../../.env.example) 配置自己的项目。`SUPABASE_SECRET_KEY` 具有高权限，只能保存在服务端环境变量中，不得提交到 Git、写入公开日志或发送给浏览器。

维护者 checkout 可能仍链接到生产项目。每次操作前都必须独立核对 Supabase project ref；测试项目应通过 `STAGING_DATABASE_URL` 和 `--db-url` 明确指定，不要依赖当前 CLI link 或历史终端上下文猜测目标。

## 迁移流程

1. 在本地回放并测试 migration。
2. 运行 `npm run generate:database-types`，提交生成的 `src/data/database.generated.ts`；不要手工修改该文件。
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

## 历史不一致和非 CLI 应用

`--include-all` 只用于经过审计的 migration ledger 修复，不是常规部署选项。

如果 migration 通过 Supabase MCP 或 Dashboard 应用，必须把远端使用的**同一版本号和同一 SQL**提交到 `supabase/migrations/`。不要随后用另一个时间戳提交等价 migration，否则本地和远端账本会永久分叉。

发现 migration history 不一致时立即停止并核对。不要重复执行 SQL，也不要直接采用 CLI 输出的批量 repair 建议。必须先确认：

- SQL 是否已经实际应用；
- 远端 ledger 记录了哪个版本号；
- 本地是否缺少远端使用的原始 migration 文件；
- 当前连接的 project ref 是否正确。

只有在差异来源和预期最终账本都经过审查后，才能进行 ledger 修复。
