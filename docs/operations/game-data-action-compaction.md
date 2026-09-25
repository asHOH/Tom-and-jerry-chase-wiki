# 游戏数据归档：一次授权，两次部署

## 什么时候需要这份手册

首次部署、日常代码更新和普通内容修改都不需要执行这里的操作。

站点运行一段时间后，管理员在网页中审核通过的游戏数据修改会积累在 Supabase 中。只有当维护者准备把一批修改永久写入仓库，并让线上站点不再从数据库重复加载这批修改时，才使用本手册。时间不是触发条件：可能是数周、数月，也可能一直不需要。开始前必须已经完成批次清点、源码修改和本地验证，并获得生产操作授权。

核心要求：**移除对应数据库行后，公开数据只能发生维护者明确批准的内容修正，其他数据必须不变。** 比对、行清单和执行记录由工具处理，维护者不需要手工操作这些证据。

后台不再提供单条改动“标为已同步”的操作；归档统一使用本文的已验证批次流程。`scripts/squash-pending-game-data-actions.mjs` 仅用于只读分析和导出，不再支持 `--apply` 或修改数据库行。

## 日常怎么做

1. **维护者一次授权本批次**：说明截止日期、目标站点和允许的动作，包括是否允许推送代码、把已验证的行改为 `synced`，以及由谁部署 VPS。已授权的动作不在每个阶段重复询问；范围、目标改变或出现真实冲突时再确认。
2. **Codex 准备代码**：冻结精确行清单，处理修改、运行验证、提交代码，并在已获授权时推送到指定仓库。只报告需要决定的内容冲突。
3. **维护者第一次部署**：部署补丁代码，此时数据库行仍为 `approved/public`；完成后告诉 Codex。
4. **Codex 归档数据库行**：直接运行 `sync`。它自带部署检查、完整数据比对、证据保存、原子状态切换和两类行的精确复查。已有本批次数据库授权就不再询问。
5. **维护者强制重新构建并部署**：数据库快照已变化，即使提交没有变化也必须重建；使用下方命令，不能只重载 PM2。
6. **Codex 最终检查**：运行只读 `post-check`；它自动核对部署版本、数据快照、归档行和依赖行，通过后本批次完成，无需再手工查询同一批行或 `/api/version`。

只有想先查看检查结果、尚未授权数据库修改，或需要排查问题时，才单独运行 `check`。正常已授权批次不必先手工 `check` 再 `sync`，因为 `sync` 本身会重新检查。

### 第二次部署：确保没有跳过构建

当前部署脚本只比较源码、环境、工具版本和本地构建输出，不查询数据库快照。因此同一提交在归档后再次部署可能显示 `Build skipped`；健康检查和提交号通过也不能证明数据快照已更新。

在 VPS 仓库根目录执行：

```bash
cd /workspace/Tom-and-jerry-chase-wiki
./scripts/ops/deploy_server.sh --force-build
```

若安装目录不同，替换 `cd` 路径。`--force-build` 强制重建，仍由部署脚本负责备份、构建失败恢复和激活。日志应以 `build=built` 完成；`build=skipped` 不算完成归档后的部署。无需删除构建复用记录、整个 `.next` 或重新安装依赖；仓库外的脚本副本须先更新以支持此参数。

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
- 正常切换中的完整 cutover 序列通过重复播放检查：支持带具体 `newValue` 的 `set`、非数组下标的属性 `add`，以及下述有确定重置点的结构操作。

默认 published parity 检查证明公开数据不变。若维护者明确批准归档时修正内容，在 ignored manifest 的 `approvedReconciliation` 中冻结 `reason`、`publishedChanges` 和 `sourceChanges`；每项使用字符串数组 `path` 和完整 `before`/`after` 值，不能只排除路径。工具先精确核对旧值，再将公开旧数据应用修正后与归档结果完整比较；action patch 仅在临时副本中逆转已批准的源码修正后验证原始修改链。两份证明绑定同一个修正摘要，内容变化必须重新验证；`strictlyEqual: false` 明确标记这不是无内容变化的归档。第一次部署到第二次部署之间，公开修改还可能再次播放，因此也要检查重复播放。

结构操作必须有可验证的重置点，不能仅因当前结果看起来正确而放行：

- 同一行内的删除可由之前的具体 `set` 或非下标属性 `add` 重置其路径或祖先来证明。重置后同一根实体的操作必须全部位于该子树内，且 checked replay 必须成功；数组下标删除必须重置整个父数组，单独写回一个下标不够。既有的“紧邻 `set`、删除、再 `set` 恢复属性”证明继续适用。根实体与数组 `length` 删除仍不支持。
- 数组下标 `add` 会再次插入元素，不能独立归档。只有在同一实体类型的完整 cutover 序列中，随后影响该数组的第一次写入就是该父数组的完整具体 `set`，才能证明重复插入最终会被覆盖；这个重置行也必须进入 cutover，不能只是验证依赖。根实体直接属性上的数组允许中间修改其他兄弟属性；嵌套数组仍要求同一根实体的下一次写入就是重置，避免上层数组下标移动。
- 反向验证可从同一实体的更早具体重置点按 checked replay 重建完整父数组前后状态，包括对象被替换为数组和越界插入被限制到数组尾部。只有完整后状态与待验证源码一致、记录的旧值也匹配时才接受。Valtio 紧随下标删除记录的长度缩短按实际 splice 后的状态还原，不虚构空位；没有重置证据的数组截短仍拒绝。

这些证明保留原始修改历史，无需拆行或改写数据库中的 action。完整 action patch、approved reconciliation 和 published parity 检查仍必须通过；其他无法证明的结构操作继续阻塞。验证依赖行不参与切换，因此不受 cutover 重复播放门槛限制。

历史关系整表替换也可能覆盖其旧值、新值中均未改变的过期字段。反向验证仅在更早的具体重置点能重建实际前后状态、实际前状态与记录旧值的端点集合一致、声明修改的字段旧值匹配、完整后状态与待验证值匹配时，恢复有证据的实际前状态；更早的行仍须分别验证。这不代表过期投稿正确，也不改变新投稿的新鲜度校验。

若批准的修正已通过新 action 发布，归档本身可以没有公开内容变化：此时允许 `publishedChanges` 为空而 `sourceChanges` 非空，用精确前后值还原历史源码证明；公开数据仍必须严格相等。两者同时为空无效，不得为满足格式而虚构公开差异。

## 工具命令（由 Codex 或操作者执行）

部署前可先执行本地预检，无需 production origin：

```bash
npm run verify:game-data-compaction -- \
  --mode=local \
  --manifest=.tmp/<manifest>.json \
  --patched-ref=<patched-baseline-commit>
```

本地预检仍读取配置的 Supabase approved snapshot，核对 manifest、重复播放、action patch、
完整 published parity 和检查前后的 snapshot 稳定性；`local` 表示不依赖生产部署，不代表离线。
它检查已提交的 Git ref，不包含未提交修改，不修改数据库或 manifest，并拒绝 `--write-manifest`。
输出的 `production` 为 `null`，不能作为切换凭证。后续 `sync` 仍重跑全部检查并验证部署。

1. 在 cutover 行仍为 `approved/public` 时部署已写入补丁的基线。
2. 在本批次数据库归档已获授权时执行 `sync`。它会先核对目标并运行全部预检，预检失败时不会修改状态；无需再次索取相同授权：

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

   `sync` 自动复查所有 cutover 行已为 `synced/private`，所有 verification-only 行仍为 `approved/public`，并把已验证的依赖行 ID 写入切换记录。RPC 响应不确定时由精确复查判断结果，不会自动重试。**RPC 调用后的复查失败不代表数据库未变更**；此时保留证据，按只读恢复流程核实，不得再次运行 `sync`。

   预检失败时，输出保留外层 `preflight_failed`，并在 `error.verifierError` 中提供验证器的结构化原因，例如 `production_artifact_mismatch`。无法解析验证器输出时只报告通用失败和退出码，不回显原始命令或错误文本。

3. 按上方 `--force-build` 命令重新构建并部署，使构建产物使用切换后的当前 approved snapshot。
4. 部署后运行只读 `post-check`。正常流程会自动使用 manifest 中绑定的 retained 证据，不需要传入路径：

   ```bash
   npm run cutover:game-data-compaction -- \
     --mode=post-check \
     --manifest=.tmp/<manifest>.json \
     --patched-ref=<patched-baseline-commit> \
     --production-origin=https://www.tjwiki.com \
     --expected-supabase-host=<project-ref>.supabase.co
   ```

   `post-check` 自动核对 retained 文件的路径、摘要和元数据，检查 `/api/version` 的 deployment identity、replay epoch、action revision、row count 和 commit，并在完整数据比对前后精确复查两类行。依赖行继续参与 action patch 验证，但不进入归档集合。缺行、状态变化或行角色重叠都会阻止生成通过记录。

仅诊断或尚未授权数据库修改时，把 `sync` 命令中的 `--mode=sync` 换成 `--mode=check`，并省略 `--actor-id` 和 `--confirm`。正常流程不必重复运行 `check`；第二次实际构建和最终 `post-check` 仍是完成条件。

## 数据库行已经切换时：只读恢复

如果精确查询已经显示目标行是 `synced/private`，不要把它们恢复为 approved，也不要再次运行 sync。此时普通切换前检查已经不适用，只能验证当前生产状态。

1. 保留原 manifest，不把后来观察到的行追加到原 `rows`。额外行应记录在明确标注的 retrospective observation 中。
2. 优先使用正常 `sync` 自动保存并绑定的 retained 文件。仅处理旧批次或未完成绑定的恢复操作时，
   才手工指定被忽略的 `.tmp/` retained 文件。不得把 action payload、凭据或用户标识提交到 Git。
3. 状态已经切换时只需按上方命令强制重新构建并部署一次。部署后运行：

   ```bash
   npm run cutover:game-data-compaction -- \
     --mode=post-check \
     --manifest=.tmp/<manifest>.json \
     --retained-rows=.tmp/<retained-rows>.json \
     --patched-ref=<frozen-patched-baseline-commit> \
     --production-origin=https://www.tjwiki.com \
     --expected-supabase-host=<project-ref>.supabase.co
   ```

4. `post-check` 只读运行，不执行 approved-row preflight，也不调用 mutation RPC。它会确认归档行仍为 `synced/private`、manifest 中的依赖行仍为 `approved/public`，并用保留的 action 和当前 approved snapshot 重建 published parity。
5. `/api/version` 的 artifact epoch、revision、row count、deployment identity 和部署提交关系都必须匹配当前生产快照。全部通过后才允许写入 `result.postCutoverVerification`。

恢复流程可以包含非 `set` action，因为它不会改变状态；published parity 仍须按同一份已批准修正严格通过。

## 必须立即停止的情况

- Supabase host/project ref 与显式预期或 retrospective target 不一致。
- 本地和远端 migration history 不一致，或 dry run 出现非预期迁移。
- manifest、行角色、retained 精确集合、行 digest、epoch 或 revision 缺失、重叠、混合或发生变化。
- 正常切换未通过重复播放检查，或 action patch、dependency replay、published parity 任一失败。
- 已部署提交不包含冻结的补丁提交，或 `/api/version` 任一字段不匹配。
- RPC 响应不确定，且精确查询不能证明整个 batch 都是 `synced/private`。
- 任一目标行已经 synced；此时只能使用只读恢复流程，不能重试切换。

除上述精确冻结的已批准内容修正外，不要放宽等价判断；禁止伪造历史证据、批量 restore、重复 sync 或跳过第二次部署。

## 当前禁止再次切换的批次

2026-07-28 至 2026-07-29 的已核对批次包含原 manifest 的 24 行和额外观察到的 3 行 G09，共 27 行。它们均为 `synced/private`，不得再次进入 `--mode=sync`。

该批次当前的 recovery post-check 仍报告角色关系 published parity 差异。在差异解决或完成明确审查前，不得生成 `postCutoverVerification`；该阻塞不构成恢复或重试 sync 的理由。
