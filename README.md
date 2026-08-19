# hermes-trajectory

Hermes Desktop 右侧「轨迹」面板。对照 DeepSeek Harness 的三车道，不是输入框上的进度条。

![轨迹面板](docs/pane.png)

## 三列怎么读

上面色轴、中间图例、下面步骤，都是同一套三列：

| 提问区 | 模型区 | 工具区 |
| --- | --- | --- |
| 蓝 · 提问 | 紫 · 思考 | 橙 · 工具 |
| 绿 · 上下文 | 玫红 · 回答 | 青 · 子任务 |
|  |  | 黄绿 · 待确认 |
|  |  | 红 · 出错 |

![颜色图例](docs/legend.png)

色轴可左右滑。一轮结束不删。换对话、换 bot 各看各的。

下面四种视图可切换，和 Zotero 一样选一种看：

- **看板**：提问 / 模型 / 工具 三列
- **列表**：按时间一条条
- **表格**：时间 + 种类 + 内容
- **时间**：竖着的时间线

选择会记住。

## 装到本机 Hermes

把 `plugin.js` 放到：

```
%LOCALAPPDATA%\hermes\desktop-plugins\harness-progress\plugin.js
```

目录名必须等于插件 id：`harness-progress`。

⌘K → **Reload desktop plugins**。设置 → 插件里打开 **Trajectory**。

只进 default 电脑端，不要拷到 wechat-bot。

## 语言

跟 Hermes 一样：`en` / `zh` / `zh-hant` / `ja` / `ar`。事件只存 key，切语言立刻变。

## 规范

单文件 ESM，只能 import `@hermes/plugin-sdk` / `react` / `react/jsx-runtime`。无构建、无 JSX 语法。
