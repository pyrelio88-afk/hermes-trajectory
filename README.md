# hermes-trajectory

[中文说明](README.zh-CN.md)

A Hermes Desktop side pane that records one chat as a 3-lane trajectory: prompt, model, tools.

Not a fake progress bar on the composer.

## Use

Drop `plugin.js` here (folder name must equal plugin id):

```
%LOCALAPPDATA%\hermes\desktop-plugins\harness-progress\plugin.js
```

Command palette → **Reload desktop plugins**. Enable **Trajectory** in Settings → Plugins.

Works in any profile. Each profile and chat keeps its own layout.

## Views

Switch anytime: **Table**, **List**, **Board**, **Time**. The choice is remembered.

## Colors

Click a lane name (**Prompt / Model / Tools**) to add or remove kinds for that column (context, todo, goal, background, compact, …). The three lane names stay fixed. Layout and colors are stored per chat and profile.

## Language

Follows Hermes: `en` / `zh` / `zh-hant` / `ja` / `ar`. Events store keys, not frozen text.

## Spec

One ESM file. Imports only `@hermes/plugin-sdk`, `react`, `react/jsx-runtime`. No build, no JSX syntax.
