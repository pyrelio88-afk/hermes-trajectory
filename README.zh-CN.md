# hermes-trajectory

[English](README.md)

Hermes Desktop 右侧「轨迹」面板。一场对话分成三道：提问、模型、工具。

不是输入框上的进度条。

## 安装

把 `plugin.js` 放到（目录名必须等于插件 id）：

```
%LOCALAPPDATA%\hermes\desktop-plugins\harness-progress\plugin.js
```

⌘K → **Reload desktop plugins**。设置 → 插件里打开 **Trajectory**。

只进 default，不要拷到 wechat-bot。

## 视图

随时切换：**表格**、**列表**、**看板**、**时间**。选过会记住。

## 颜色

点列名（**提问 / 模型 / 工具**）可以给这一列增删种类（上下文、任务、目标、后台、压缩…）。三列名字不变。列布局和颜色按对话、按 profile 分开存。

## 语言

跟 Hermes：`en` / `zh` / `zh-hant` / `ja` / `ar`。步骤只存 key，切语言会变。

## 规范

单文件 ESM。只能 import `@hermes/plugin-sdk` / `react` / `react/jsx-runtime`。无构建、无 JSX 语法。
