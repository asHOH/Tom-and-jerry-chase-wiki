# 游戏数据修改归档与切换运维手册

## 什么时候需要这份手册

首次部署、日常代码更新和普通内容修改都不需要执行这里的操作。

站点运行一段时间后，管理员在网页中审核通过的游戏数据修改会积累在 Supabase 中。只有当维护者准备把一批修改永久写入仓库，并让线上站点不再从数据库重复加载这批修改时，才使用本手册。时间不是触发条件：可能是数周、数月，也可能一直不需要。开始前必须已经完成批次清点、源码修改和本地验证，并获得生产操作授权。

这项操作会接触生产数据库和生产部署。任何目标、数据或验证结果不明确时都应停止，而不是猜测或重试。

## 理解这项操作

Supabase 的 `game_data_actions` 保存网页中审核通过的动态修改。归档流程先把这些修改写入仓库中的静态数据，再把对应数据库行从公开加载状态改为已归档状态。

每次操作都要准备一个 manifest，用来冻结本次处理的精确行和验证证据。其中两类行不能混用：

- `cutoverRowIds`：本次确实要从 `approved/public` 切换为 `synced/private` 的行，也是唯一允许传给切换 RPC 的集合。
- `verificationDependencyRowIds`：只用于还原修改链或证明结果的依赖行。它们不得因为验证需要而被切换。

正常切换生成 `cutoverVerification` 证据。若数据库行早已切换，只能进行只读的切换后验证并生成 `postCutoverVerification`；它不能补写当时未知的操作者、执行时间、切换前指纹或原子性证明。

## 开始前检查

- manifest 已冻结，源码补丁、action patch 验证和完整 published parity 均已通过。
- 已独立确认生产 Supabase project ref，并可传入 `--expected-supabase-host=<project-ref>.supabase.co`。
- 本地与目标数据库的 migration history 一致，没有待推送迁移。
- 已确认本次部署的 production origin 和补丁提交。
- 正常切换中的所有 cutover action 都是带具体 `newValue` 的 `set`。

最后一项是正常流程的硬限制。第一次部署到第二次部署之间，数据库中的公开修改可能被再次播放；具体的 `set` 重放后结果不变。验证依赖行不参与切换，因此不受此限制。

## 正常流程：两次部署

1. 在 cutover 行仍为 `approved/public` 时部署已写入补丁的基线。
2. 对第一次部署运行只读检查：

   ```bash
   npm run cutover:game-data-compaction -- \
     --mode=check \
     --manifest=.tmp/<manifest>.json \
     --patched-ref=<patched-baseline-commit> \
     --production-origin=https://www.tjwiki.com \
     --expected-supabase-host=<project-ref>.supabase.co
   ```

3. 核对命令打印的 Supabase host 和 project ref。只在全部检查通过并获得单独授权后，执行一次原子切换：

   ```bash
   npm run cutover:game-data-compaction -- \
     --mode=sync \
     --manifest=.tmp/<manifest>.json \
     --patched-ref=<patched-baseline-commit> \
     --production-origin=https://www.tjwiki.com \
     --expected-supabase-host=<project-ref>.supabase.co \
     --actor-id=<authorized-user-uuid> \
     --confirm=SYNC_APPROVED_COMPACTION_BATCH
   ```

   `sync` 会在调用切换 RPC 前，从同一个 approved replay snapshot 自动保存精确的切换前 action 行，
   写入被忽略的 `.tmp/` 文件，并把文件路径、摘要、目标、epoch/revision 和行数绑定到 manifest。
   若证据无法持久写入、重新读取不一致或 snapshot 已变化，命令必须在 RPC 前停止。新批次不要手工构造 retained 文件。

4. 精确复查：所有 cutover 行必须为 `synced/private`，所有 verification-only 行必须保持原状态。响应不确定时只能依靠精确复查判断结果，不得盲目重试。
5. 再部署一次，使构建产物使用切换后的当前 approved snapshot。
6. 部署后运行只读 `post-check`。正常流程会自动使用 manifest 中绑定的 retained 证据，不需要传入路径：

   ```bash
   npm run cutover:game-data-compaction -- \
     --mode=post-check \
     --manifest=.tmp/<manifest>.json \
     --patched-ref=<patched-baseline-commit> \
     --production-origin=https://www.tjwiki.com \
     --expected-supabase-host=<project-ref>.supabase.co
   ```

7. 核对 `/api/version` 的 deployment identity、replay epoch、action revision、row count 和 commit，
   并再次精确查询两类行。`post-check` 只有在 retained 文件路径、摘要和元数据与 manifest 完全一致时才会继续。

只读检查和切换不能合并，也不能省略第二次部署。

## 数据库行已经切换时：只读恢复

如果精确查询已经显示目标行是 `synced/private`，不要把它们恢复为 approved，也不要再次运行 sync。此时普通切换前检查已经不适用，只能验证当前生产状态。

1. 保留原 manifest，不把后来观察到的行追加到原 `rows`。额外行应记录在明确标注的 retrospective observation 中。
2. 优先使用正常 `sync` 自动保存并绑定的 retained 文件。仅处理旧批次或未完成绑定的恢复操作时，
   才手工指定被忽略的 `.tmp/` retained 文件。不得把 action payload、凭据或用户标识提交到 Git。
3. 状态已经切换时只需部署一次。部署后运行：

   ```bash
   npm run cutover:game-data-compaction -- \
     --mode=post-check \
     --manifest=.tmp/<manifest>.json \
     --retained-rows=.tmp/<retained-rows>.json \
     --patched-ref=<frozen-patched-baseline-commit> \
     --production-origin=https://www.tjwiki.com \
     --expected-supabase-host=<project-ref>.supabase.co
   ```

4. `post-check` 只读运行，不执行 approved-row preflight，也不调用 mutation RPC。它会确认精确行仍为 `synced/private`，并用保留的 action 和当前 approved snapshot 重建 published parity。
5. `/api/version` 的 artifact epoch、revision、row count、deployment identity 和部署提交关系都必须匹配当前生产快照。全部通过后才允许写入 `result.postCutoverVerification`。

恢复流程可以包含非 `set` action，因为它不会改变状态；published parity 仍必须严格通过。

## 必须立即停止的情况

- Supabase host/project ref 与显式预期或 retrospective target 不一致。
- 本地和远端 migration history 不一致，或 dry run 出现非预期迁移。
- manifest、行角色、retained 精确集合、行 digest、epoch 或 revision 缺失、重叠、混合或发生变化。
- 正常切换包含非具体 `set`，或 action patch、dependency replay、published parity 任一失败。
- 已部署提交不包含冻结的补丁提交，或 `/api/version` 任一字段不匹配。
- RPC 响应不确定，且精确查询不能证明整个 batch 都是 `synced/private`。
- 任一目标行已经 synced；此时只能使用只读恢复流程，不能重试切换。

不要通过放宽等价判断、伪造历史证据、批量 restore、重复 sync 或跳过第二次部署来绕过停止条件。

## 当前禁止再次切换的批次

2026-07-28 至 2026-07-29 的已核对批次包含原 manifest 的 24 行和额外观察到的 3 行 G09，共 27 行。它们均为 `synced/private`，不得再次进入 `--mode=sync`。

该批次当前的 recovery post-check 仍报告角色关系 published parity 差异。在差异解决或完成明确审查前，不得生成 `postCutoverVerification`；该阻塞不构成恢复或重试 sync 的理由。
