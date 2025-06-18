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

### 利用deepseek填写（推荐）

1. 整理角色文案（包含角色名称、描述、属性、加点、知识卡推荐、技能等）
2. 将如下信息发给deepseek，替换【】内容：

```text
请将我的文案填入角色数据模板。要求：1.替换所有"角色名"为实际角色名；2.数值字段删除引号填入纯数字，布尔字段填true/false，文字字段保留引号；3.如果角色没有第二个武器，删除整个"weapon2"板块；4.将结果在代码块中输出为JSON格式。如果某个字段在文案中找不到对应数据，请将该字段留空（确保JSON解析时报错）并在输出后说明，严禁杜撰数据。

文案：【此处粘贴角色文案】
模板：【此处粘贴cat-template.json或mouse-template.json内容】
```

### 手动填写

1. 替换所有"角色名"为实际角色名
2. 参考示例文件了解各字段含义
3. 如果角色没有二武，删除整个"weapon2"板块
4. 填写所有字段，注意格式：
   - **数值字段**：删除引号，直接填入数字
   - **文字字段**：保留引号，填入描述文字
   - **布尔字段**：删除引号，填入 true 或 false

**格式示例**：

```json
// 错误 ❌
"maxHp": "255",
"isMinor": "false"

// 正确 ✅
"maxHp": 255,
"isMinor": false
```

## 定位

**老鼠**：奶酪、干扰、辅助、救援、破局、砸墙、后期

**猫咪**：进攻、防守、追击、打架、速通、后期、翻盘

## 推荐数据来源

**猫移速**：[我在猫鼠学物理1.0](https://www.bilibili.com/video/BV1W85Ez1EJv)
