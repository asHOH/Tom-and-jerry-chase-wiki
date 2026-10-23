# AkariBot 用户查询兼容接口

本站的 `/api.php` 提供只读的 MediaWiki 兼容接口，支持 AkariBot 现有的 `wiki user` 用户查询流程，无须修改机器人。

## 请求示例

机器人使用以下参数查询用户，其中 `ususers` 是公开昵称，不是登录用户名或用户 UUID：

```bash
curl --get 'https://www.tjwiki.com/api.php' \
  --data-urlencode 'action=query' \
  --data-urlencode 'format=json' \
  --data-urlencode 'list=users' \
  --data-urlencode 'ususers=测试用户' \
  --data-urlencode 'usprop=groups|blockinfo|registration|editcount|gender'
```

存在的用户返回如下结构，字段值取自现有公开用户资料：

```json
{
  "batchcomplete": true,
  "query": {
    "users": [
      {
        "name": "测试用户",
        "groups": ["编辑者"],
        "registration": "2026-07-01T08:00:00.000Z",
        "editcount": 5,
        "gender": "unknown"
      }
    ]
  }
}
```

## 字段与限制

- 昵称精确匹配，保留大小写、空格及下划线，不套用 MediaWiki 页面标题的规范化规则。
- `ususers` 可用 `|` 分隔至多 15 个昵称，每个昵称最多 500 个字符；响应按请求顺序排列。空昵称、超限参数或不支持的 `usprop` 会返回 MediaWiki 格式的错误对象。
- `name` 始终返回；其他字段仅在 `usprop` 指定时返回。不传 `usprop` 时只返回昵称。
- `groups` 使用公开用户资料中的用户组显示名称。后续的 `action=query&meta=allmessages&amprefix=group-` 请求返回空的 `query.allmessages` 数组，AkariBot 因而直接显示这些名称。其他消息前缀不受支持。
- `registration` 是账号注册时间；`editcount` 是公开资料的贡献总数，即已批准的文章版本数与游戏数据贡献数之和，游戏数据沿用公开资料的筛选规则并包含已同步记录。它不是所有提交、审核或评论的总数。
- 本站不提供公开性别，`gender` 固定为 `unknown`。接受 `blockinfo` 参数以兼容机器人，但不返回封禁详情、操作者或原因。
- 不返回登录用户名、邮箱、凭据、账号 UUID 或虚构的数字用户 ID。
- 不存在的用户返回 `{ "name": "请求昵称", "missing": true }`。Supabase 被禁用或未配置时，沿用公开资料读取器的不可用行为，同样返回缺失用户；后端异常返回通用 `internal_api_error`，不包含内部错误详情。

接口保留跨域 GET/OPTIONS 支持和 `Cache-Control: no-store, max-age=0`。底层公开资料继续复用现有服务端缓存及失效标签；用户查询和用户组消息不依赖游戏目录加载。

## 用户资料链接

站点信息保留 `articlepath: "/$1"`，并声明 User 命名空间。AkariBot 生成的 `/User:昵称` 链接会通过临时的同源 307 重定向进入现有公开资料页；GET 和 HEAD 均受支持。昵称路径只解码一次，然后通过现有用户资料链接工具编码；路由末尾的 `/` 作为路由斜线移除，昵称本身末尾的斜线应写为 `%2F`。

机器人上游目前会保留昵称中的 `?` 和 `#` 等 URL 分隔符，因此这类昵称可能无法通过机器人生成的链接完整传递。自行构造链接时应将昵称完整编码，例如 `/User:A%3FB%23C`；API 的 `ususers` 查询应始终使用 URL 参数编码。

兼容行为参考 [AkariBot 用户查询实现](https://github.com/Teahouse-Studios/akari-bot/blob/master/modules/wiki/utils/user.py)。
