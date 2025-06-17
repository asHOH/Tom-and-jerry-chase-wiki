# 角色数据模板

在对应模板（两个json文件）里填写内容后发给我即可。

## 模板文件

### 老鼠角色模板

[mouse-template.json](./mouse-template.json)

### 猫咪角色模板

[cat-template.json](./cat-template.json)

### 示例文件

[tom-example.jsonc](./tom-example.jsonc) - 汤姆角色完整示例

[jerry-example.jsonc](./jerry-example.jsonc) - 杰瑞角色完整示例

## 填写说明

1. 替换所有"角色名"为实际角色名
2. 参考汤姆示例文件了解各字段含义
3. 填写所有数值和描述：
   - **数值字段**：删除引号，直接填入数字（如 `"血量上限"` → `255`）
   - **文字字段**：保留引号，填入描述文字（如 `"角色描述"` → `"角色描述文字"`）
   - **布尔字段**：删除引号，填入 true 或 false（如 `"是否为次要定位(true/false)"` → `false`）
4. 如果角色没有二武，删除整个"weapon2"板块
5. 发送修改后的json文件给我

### 数值/布尔字段示例

```json
// 错误 ❌
"maxHp": "255"
"isMinor": "false"

// 正确 ✅
"maxHp": 255
"isMinor": false
```

## 定位

**老鼠**：奶酪、干扰、辅助、救援、破局、砸墙、后期

**猫咪**：进攻、防守、追击、打架、速通、后期、翻盘

## 猫移速

参考[我在猫鼠学物理1.0](https://www.bilibili.com/video/BV1W85Ez1EJv)
