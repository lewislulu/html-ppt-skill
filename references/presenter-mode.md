# Presenter Mode Guide · 演讲者模式指南

这份文档说明如何在 html-ppt skill 里做出**带逐字稿的演讲者模式 PPT**。

## 何时使用演讲者模式

当用户的需求涉及以下任何一项时，**优先使用演讲者模式**：

- 提到"**演讲**"、"**分享**"、"**讲稿**"、"**逐字稿**"、"**speaker notes**"
- 提到"**presenter view**"、"**演讲者视图**"、"**演讲者模式**"
- 需要"**30 分钟 / 45 分钟 / 1 小时**的分享"
- 说"我要去给团队讲 xxx"、"要做一场技术分享"、"要做路演"
- 强调"**不想忘词**"、"**怕讲不流畅**"、"**需要提词器**"

如果用户只要做一份"静态好看的 PPT"（例如小红书图文、产品图册、汇报 slides 自己不讲），**不需要**演讲者模式。

## 两种做法

### ✅ 推荐做法：直接用 `presenter-mode-reveal` 模板

```bash
cp -r templates/full-decks/presenter-mode-reveal examples/my-talk
```

这个模板已经预设好所有必需元素：
- 支持 S 键切换演讲者视图
- 5 个主题可用 T 键循环（tokyo-night / dracula / catppuccin-mocha / nord / corporate-clean）
- 左右键翻页
- 每一页都有 150–300 字的示例逐字稿
- 底部有键位提示

直接改内容即可。

### 🔧 进阶做法：给任意已有模板加演讲者模式

html-ppt 的 **S 键演讲者视图是 `runtime.js` 内置的，所有 full-deck 模板都自动支持**。你只需要做两件事：

1. **每张 slide 末尾加 `<aside class="notes">`**（或 `<div class="notes">`），里面写逐字稿
2. **确认 HTML 引入了 `assets/runtime.js`**

```html
<section class="slide">
  <h2>你的标题</h2>
  <p>内容...</p>
  <aside class="notes">
    <p>这里是演讲时要说的话，150-300 字...</p>
  </aside>
</section>
```

## 逐字稿写作三铁律

这是整个方法论的核心。AI 在帮用户写逐字稿时必须遵守：

### 铁律 1：不是讲稿，是"提示信号"

❌ **错误写法**（像在念稿）：
```
大家好，欢迎来到今天的分享。今天我将要给大家介绍一下我们团队在过去三个月做的工作。
首先，我们来看一下背景情况。在过去的三个月中，我们遇到了以下几个问题……
```

✅ **正确写法**（提示信号 + 加粗核心）：
```
<p>欢迎！今天分享我们团队<strong>过去 3 个月</strong>的工作。</p>
<p>先说<em>背景</em>——三个月前我们遇到了<strong>三个核心问题</strong>：
延迟高、成本炸、稳定性差。</p>
<p>接下来逐个讲解怎么解的。</p>
```

**差别**：正确版本把关键词加粗，过渡句独立成段，看一眼就能接上。

### 铁律 2：每页 150–300 字

- **少于 150 字**：提示不够，讲到一半会卡
- **多于 300 字**：你根本来不及扫完
- **2–3 分钟/页** 是最舒服的节奏

### 铁律 3：用口语，不用书面语

| ❌ 书面语 | ✅ 口语 |
|---|---|
| 因此 | 所以 |
| 该方案 | 这个方案 |
| 然而 | 但是 / 不过 |
| 进行优化 | 优化一下 |
| 我们将会 | 我们会 / 接下来 |
| 综上所述 | 所以简单来说 |

**检查方法**：写完读一遍，听起来像说话才对。

## 必备 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN" data-themes="tokyo-night,dracula,corporate-clean">
<head>
  <meta charset="utf-8">
  <title>...</title>
  <link rel="stylesheet" href="../../../assets/fonts.css">
  <link rel="stylesheet" href="../../../assets/base.css">
  <link rel="stylesheet" id="theme-link" href="../../../assets/themes/tokyo-night.css">
  <link rel="stylesheet" href="../../../assets/animations/animations.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="deck">

  <section class="slide" data-title="Cover">
    <h1>你的标题</h1>
    <p>副标题</p>
    <aside class="notes">
      <p>讲稿段落 1（加<strong>加粗关键词</strong>）。</p>
      <p>讲稿段落 2（过渡句独立成段）。</p>
      <p>讲稿段落 3（自然收尾，引出下一页）。</p>
    </aside>
  </section>

  <!-- 更多 slide ... -->

</div>
<script src="../../../assets/runtime.js"></script>
</body>
</html>
```

## 演讲者视图显示的内容

按 `S` 键后，屏幕分成两部分：

```
┌────────────────────────┬──────────────────────┐
│                        │  NEXT                │
│    CURRENT             │  [下一页缩略图]      │
│    [当前页大图]        ├──────────────────────┤
│                        │  SPEAKER SCRIPT      │
│                        │  [大字号逐字稿]      │
│                        │  [可滚动]            │
│                        ├──────────────────────┤
│                        │  ⏱ 12:34  3 / 8  💡  │
└────────────────────────┴──────────────────────┘
```

- **左侧 55%**：当前页实时预览
- **右上 30%**：下一页预览（帮助过渡）
- **右中**：逐字稿，字号 18px，高对比度，可滚动
- **右下**：计时器 + 页码 + 键位提示

## 键盘快捷键（演讲者模式）

| 键 | 动作 |
|---|---|
| `S` | 进入 / 退出演讲者视图 |
| `←` `→` / Space / PgDn | 翻页（即使在演讲者视图里） |
| `T` | 切换主题 |
| `R` | 重置计时器（仅演讲者视图下） |
| `F` | 全屏 |
| `O` | 总览 |
| `Esc` | 关闭所有浮层 |

## 双屏演讲的标准流程

1. 副屏（你看的屏幕）：打开 HTML，按 `F` 全屏
2. 主屏（观众看的）：Cmd+Tab 或投屏软件把全屏窗口发到主屏
3. 副屏上按 `S` → 你看演讲者视图，观众看干净的 slide
4. 你翻页，主屏同步

> 💡 html-ppt 目前不支持"真正的 dual-screen 独立窗口"——演讲者视图和主视图在同一个 HTML 里切换。如果需要双屏独立显示，推荐用 reveal.js 的原生 speaker view（`/speaker.html`）。

## 常见错误

### ❌ 把逐字稿写在 slide 可见位置

```html
<!-- 错误：这段文字观众会看到 -->
<p style="font-size:12px;color:gray">
  这里讲 xxx，然后讲 yyy...
</p>
```

✅ 正确：
```html
<aside class="notes">
  <p>这里讲 xxx，然后讲 yyy...</p>
</aside>
```

`.notes` 类默认 `display:none`，只在演讲者视图可见。

### ❌ 忘记引入 runtime.js

没有 `<script src="../../../assets/runtime.js"></script>` = 没有 S 键、没有演讲者视图、没有翻页。

### ❌ 逐字稿用书面语

念出来像 AI 机器人。**写完一定读一遍**。

### ❌ 每页 50 字

提示不够，照样忘词。

### ❌ 每页 500 字

眼睛根本扫不过来，等于没写。

## 用 AI 生成逐字稿的标准 prompt

> "请为每一张 slide 写一段 **150-300 字**的逐字稿，放在 `<aside class="notes">` 里。
> 要求：
> 1. 用**口语**，不要书面语（所以/但是/接下来，不是因此/然而/综上所述）
> 2. 把**核心关键词**用 `<strong>` 加粗
> 3. 过渡句独立成段（每段 1-3 句）
> 4. 读起来像说话，不像念稿
> 5. 结尾要有自然的过渡，引出下一页"

## 推荐搭配

- **主题**：`tokyo-night`（深色，技术分享首选）、`corporate-clean`（浅色，商务汇报）、`dracula`（深色备选）
- **字体**：默认 Noto Sans SC + JetBrains Mono，无需更改
- **动效**：克制使用，`fade-up` / `rise-in` 最自然，不要用 `glitch-in` / `confetti-burst` 之类花哨的
- **页数**：30 分钟分享 = 8–12 页；45 分钟 = 12–16 页；1 小时 = 16–22 页
