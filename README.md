# hermes-trajectory

Hermes Desktop 右侧「轨迹」面板：对照 DeepSeek Harness 的三车道色轴（输入 / 模型 / 工具），按 **bot + 会话** 分桶，一轮结束不删历史。

不是输入框上的进度胶囊。

## 装到本机 Hermes

把 `plugin.js` 放到：

```
%LOCALAPPDATA%\hermes\desktop-plugins\harness-progress\plugin.js
```

目录名必须等于插件 id：`harness-progress`。

⌘K → **Reload desktop plugins**。设置 → 插件里打开 **Trajectory**。

只进 default 电脑端；wechat-bot 不要拷这份。

## 怎么读

- 蓝：你
- 绿：上下文
- 靛：思考
- 紫：回复
- 橙：工具
- 青：子代理
- 黄：询问
- 红：错误

色轴可左右滑。换对话、换 bot 各看各的。

## 语言

跟 Hermes 一样：`en` / `zh` / `zh-hant` / `ja` / `ar`。`ctx.i18n.register` 嵌套 key，事件只存 key，切语言立刻变。

## 规范

单文件 ESM，只能 import `@hermes/plugin-sdk` / `react` / `react/jsx-runtime`。无构建、无 JSX 语法。
