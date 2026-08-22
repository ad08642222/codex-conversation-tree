# Codex Conversation Tree

[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-0078D4?logo=windows)](#系统要求)
[![Local first](https://img.shields.io/badge/data-local--only-2ea44f)](#隐私与安全)
[![Release](https://img.shields.io/badge/release-v1.1.1-ff7a45)](https://github.com/ad08642222/codex-conversation-tree/releases/tag/v1.1.1)
[![License: MIT](https://img.shields.io/badge/license-MIT-f97316.svg)](LICENSE)

把 Codex 的真实任务分支直接放进官方 Windows 客户端：左侧栏一键进入，在主工作区查看、搜索并打开无限分叉的会话树。

> **v1.1.1：真正使用同一个官方 Codex 窗口。** 不再启动第二个客户端或创建第二套会话数据；继续使用原来的登录状态和任务列表，手动重命名约 5 秒同步，内容区重建后自动恢复，并可一键回退普通官方启动方式。

> 非 OpenAI 官方项目。目前 Codex 插件没有公开的侧边栏 UI 扩展接口，所以项目通过本机 CDP 桥接实现侧边栏按钮和内嵌页面。

![反复分支只剩数字与真实会话树的使用体验对比](assets/posters/conversation-tree-before-after-bright.png)

[English](README.en.md) · [下载 v1.1.1](https://github.com/ad08642222/codex-conversation-tree/releases/tag/v1.1.1) · [安装](#安装只需三步) · [安全与回退](#为什么启动时需要重启一次-codex)

## 没有会话树时，哪里不方便？

Codex 原来的任务列表适合打开最近任务，但分支会话的标题往往只在原名称末尾增加 `1`、`2`、`3`。同一个任务连续分支几次后，满眼都是几乎相同的名字，既不知道每个数字代表哪次尝试，也看不出父子关系和当前路线。常见结果是：

- **只加数字，越分越乱。** `示例任务`、`示例任务 1`、`示例任务 2` 看不出谁从谁分出，更无法分辨每条路线做了什么。
- **分支关系被标题列表隐藏。** 父任务、子任务和平行探索混在一起，只能凭名称和时间回忆。
- **回到旧方案很费力。** 需要在长列表中反复搜索和试开，无法沿树直接回到某个节点。
- **独立窗口方案会割裂体验。** 第二个窗口或独立配置可能带来重复登录、任务列表不同步和互相冲突。
- **重命名后容易认不出来。** 外部视图如果只缓存自动标题，就不会跟随 Codex 中手动修改的名称。
- **外部面板增加隐私顾虑。** 会话标题、路径和关系一旦交给远端服务，就超出了本机范围。

## 安装后，它具体解决什么？

| 原来的痛点 | Codex Conversation Tree 的处理方式 |
|---|---|
| 分支标题只在末尾加数字，多次分支后无法辨认 | 按真实父子关系绘制树形路线，每个节点都处在明确位置 |
| 任务列表看不出父子关系 | 读取真实 `forked_from_id`，直接绘制父任务、子任务和平行分支 |
| 找到分支后还要回列表重开 | 单击树节点，直接回到官方 Codex 中对应的原生任务 |
| 第二个窗口产生两套登录和会话 | 复用同一个官方 Codex 窗口、配置、登录状态和任务列表 |
| 手动重命名后树上仍是旧标题 | 约 5 秒内同步新名称，同时保留原始标题搜索 |
| 担心会话数据被上传 | 本地只读解析，不上传、不修改会话数据库 |
| 担心注入后无法恢复 | 提供 **Restore Official Codex**，一键停止辅助进程并恢复普通启动 |

## 新版核心能力

- 根据 Codex 本地会话中的 `forked_from_id` 读取真实分支关系，不靠标题猜测。
- 复用官方 Codex 的原配置、登录状态和会话列表，不建立独立 `CodexProfile`。
- 在左侧 **Plugins** 下方显示 **Conversation Tree** 按钮。
- 在对话区域显示可缩放、拖动、折叠、搜索的无限树状视图。
- 点击节点直接打开对应 Codex 任务。
- 手动重命名任务后，节点名称会在约 5 秒内同步；搜索仍同时匹配原始标题。
- 提供 **Restore Official Codex**，随时停止注入并恢复普通官方启动方式。
- Codex 重建主内容区后自动识别新的 Chromium frame 并重新加载，避免空白黑屏。
- 只读运行，不修改任务内容；所有数据留在本机。
- 修复拖动画布后鼠标“黏住”的问题，并处理窗口失焦、指针取消等边界情况。

![Codex Conversation Tree 实际树状界面](assets/screenshots/tree-overview.png)

![左侧入口](assets/screenshots/sidebar-entry.png)

## 安装：只需三步

1. 从 [v1.1.1 Release](https://github.com/ad08642222/codex-conversation-tree/releases/tag/v1.1.1) 下载 `codex-conversation-tree-v1.1.1.zip`。
2. 解压后双击 **`install.cmd`**。
3. 使用桌面的 **Codex Conversation Tree** 快捷方式启动；如果 Codex 已经运行，会正常重启一次并继续使用原来的官方配置和会话。

安装器会把程序放到 `%LOCALAPPDATA%\CodexConversationTree`，从 Node.js 官网下载并校验便携运行时，同时注册可选的 Codex Skill。不会建立第二个 CodexProfile，无需安装 npm 依赖，也无需管理员权限。

如果 Windows 阻止脚本，可在仓库目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

卸载时双击 **`uninstall.cmd`**。它只删除本项目的程序、快捷方式和插件记录。

## 怎么使用

1. 从桌面快捷方式启动带会话树的官方 Codex 主窗口。
2. 点击左侧 **Conversation Tree**。
3. 滚轮缩放，拖动空白处平移；拖动节点调整布局。
4. 点击节点标题打开任务；用搜索框快速定位任务。

### 插件、Skill 和运行程序是什么关系？

核心功能由本地运行程序提供；插件包只是把 Skill 注册到 Codex，让你可以说“打开会话树”。二者不需要同时操作：桌面快捷方式本身就能完整使用，Skill 是额外入口。

```mermaid
flowchart LR
  A["Codex 本地会话"] -->|"只读解析"| B["本地树服务"]
  B --> C["树状页面"]
  D["官方 Codex 主窗口"] -->|"本机 CDP 注入"| E["侧边栏按钮"]
  E --> C
  F["可选 Skill"] -->|"打开"| D
```

## 为什么启动时需要重启一次 Codex？

Codex 插件可以提供 Skills、MCP、Apps 等能力，但目前没有公开的接口允许第三方直接向桌面端侧边栏添加按钮。因此，本项目必须在官方 Codex 启动时增加仅限本机的 CDP 参数，再动态插入侧边栏入口。它使用原来的官方配置和会话，不需要第二次登录，也不会形成两套不同步的任务列表。代价是 Codex 更新后，界面选择器可能需要跟随调整。

需要暂时关闭注入时，使用桌面的 **Restore Official Codex**；它会停止本项目的两个本地辅助进程，并从 Windows 官方应用入口重新启动 Codex。项目不修改 `app.asar`，因此可以随时回退。

从 1.0.0 升级时直接重新运行 `install.cmd` 即可。旧安装目录中的 `CodexProfile` 不再使用；如需彻底清理，可先卸载旧版再安装新版。

## 系统要求

- Windows 10/11 x64
- 已安装官方 Codex Windows 应用
- 安装时可访问 `nodejs.org`（仅下载已校验的便携 Node.js 运行时）

## 隐私与安全

- 树数据只从本机 Codex 会话目录读取，不上传到第三方服务。
- 本地服务默认只监听 `127.0.0.1:47831`，CDP 只监听 `127.0.0.1:9239`。
- 查看器为只读；打开节点只会导航到相应 Codex 任务。
- 官方 Codex 主窗口启用本机调试端口以完成界面注入。不要把端口暴露到局域网或公网。

详见 [SECURITY.md](SECURITY.md)。

## 开发与反馈

核心没有 npm 依赖。修改后可运行：

```powershell
node --check app/server.js
node --check app/inject.js
node --check app/embedded-launcher.js
node --check app/restore-official.js
```

欢迎提交 Issue 和 Pull Request。开发说明见 [CONTRIBUTING.md](CONTRIBUTING.md)，版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 反馈与交流

- 安装和使用咨询：[GitHub Discussions](https://github.com/ad08642222/codex-conversation-tree/discussions)
- 可复现的软件错误：[提交 Issue](https://github.com/ad08642222/codex-conversation-tree/issues/new/choose)
- 新功能建议：在 Discussions 的 **Ideas** 分类提出

上传截图或日志前，请隐藏用户名、本机路径、会话标题、会话 ID 和 Token。

## License

[MIT](LICENSE)
