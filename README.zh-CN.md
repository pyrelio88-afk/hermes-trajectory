# hermes-trajectory

[English](README.md)

Hermes Desktop 右侧「轨迹」面板。一场对话分成三道：**提问 / 模型 / 工具**。

不是输入框上的进度条。

![轨迹面板](docs/pane.png)

## 安装

把 `plugin.js` 放到（目录名必须等于插件 id `harness-progress`）：

```
%LOCALAPPDATA%\hermes\desktop-plugins\harness-progress\plugin.js
```

⌘K → **Reload desktop plugins**。设置 → 插件里打开 **Trajectory**。

任意 profile 都能加载。每个 profile、每场对话各自一份布局和颜色。

## 视图

随时切换（选过会记住）：

| 表格 | 列表 | 看板 | 时间 |
| --- | --- | --- | --- |
| 表格式 | 按时间一张张 | 三列 | 竖时间线 |

点色块或点一行，会锁定到同一步。

时间：今天只显示时分秒；换日带 `月-日`；换年带 `年-月-日`。

## 三列

列名固定是 **提问 / 模型 / 工具**。点列名可以给这一列增删种类（上下文、任务、目标、后台、压缩…）。

![图例](docs/legend.png)

图例色块随时能改颜色，按对话和 profile 分开记。

## 语言

跟 Hermes：**English、简体中文、繁體中文、日本語、العربية**。  
步骤只存 key，切语言界面一起变。

## 规范

单文件 ESM。只能 import `@hermes/plugin-sdk` / `react` / `react/jsx-runtime`。无构建、无 JSX 语法。

## 开发

```sh
npm test
```

测试会检查单文件 ESM 和 import 白名单。真实事件行为仍以 Hermes Desktop 为准。

MIT。
