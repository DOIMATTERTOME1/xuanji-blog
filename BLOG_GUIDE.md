# Xuanji's Blog 使用与维护指南

线上网站：<https://xuanji-blog.vercel.app/>

GitHub 仓库：<https://github.com/DOIMATTERTOME1/xuanji-blog>

## 1. 在电脑上预览网站

1. 打开博客文件夹：`C:\Users\21839\Documents\ChatGPT\个人博客网站`。
2. 在该文件夹中打开 PowerShell。
3. 执行：

   ```powershell
   pnpm dev
   ```

4. 浏览器访问终端里显示的本地地址，通常是 <http://localhost:3000/>。
5. 结束预览时，在 PowerShell 中按 `Ctrl+C`。

如果依赖还没有安装，先执行一次 `pnpm install`。

## 2. 新建和修改文章

所有文章放在 `src/content/posts/` 下。可以按主题建立子文件夹，例如：

```text
src/content/posts/
└─ power-electronics/
   └─ llc-resonant-converter-learning.md
```

复制现有文章最省事。新文章文件名建议只用小写英文、数字和短横线，例如 `llc-gain-analysis.md`。

文章开头需要填写元信息：

```yaml
---
title: "文章标题"
published: 2026-09-02
description: "一两句话概括文章内容。"
image: "/assets/posts/llc-gain-analysis.webp"
tags: ["LLC", "MATLAB", "仿真"]
category: "电力电子"
draft: false
comment: false
---
```

- `published`：发布日期，格式为 `年-月-日`。
- `image`：文章封面，可省略。
- `tags`：一篇文章可以有多个标签。
- `category`：文章分类；归档页会自动按这里的文字归类。
- `draft: true`：草稿，不会出现在正式网站；发布时改成 `false`。

元信息下面直接使用 Markdown 写正文。保存文件后，本地预览会自动刷新。

## 3. 添加图片

建议把文章图片放在 `public/assets/posts/` 中。例如：

```text
public/assets/posts/llc-topology.webp
```

在文章正文中引用：

```markdown
![LLC 谐振变换器拓扑](/assets/posts/llc-topology.webp)
```

作为文章封面时，在文章开头填写：

```yaml
image: "/assets/posts/llc-topology.webp"
```

文件名尽量使用小写英文、数字和短横线；优先使用 WebP、PNG 或 JPG。

## 4. 修改网站资料和外观

- 网站名称、副标题、正式网址、主题色、首页横幅：`src/config/siteConfig.ts`
- 头像、姓名、个人简介、社交链接：`src/config/profileConfig.ts`
- 顶部导航栏及顺序：`src/config/navBarConfig.ts`
- 全屏壁纸设置：`src/config/backgroundWallpaper.ts`
- “关于”页面正文：`src/content/spec/about.md`
- 项目页面数据：`src/data/projects.ts`

### 更换头像

把新头像放入 `public/assets/images/`，然后修改 `src/config/profileConfig.ts` 中的 `avatar`。例如：

```ts
avatar: "/assets/images/my-avatar.webp",
```

### 更换首页背景图

横幅图片目前放在：

- 电脑端：`public/assets/desktop-banner/`
- 手机端：`public/assets/mobile-banner/`

可以直接替换同名图片，也可以把新文件路径写入 `src/config/siteConfig.ts` 的 `banner.src`。全屏壁纸的图片列表在 `src/config/backgroundWallpaper.ts`。

### 添加社交链接

修改 `src/config/profileConfig.ts` 的 `links`。例如：

```ts
links: [
	{
		name: "GitHub",
		url: "https://github.com/DOIMATTERTOME1",
		icon: "fa7-brands:github",
	},
],
```

### 添加项目

在 `src/data/projects.ts` 的 `projectsData` 数组里复制一个项目对象再修改。每个项目的 `id` 必须唯一；`status` 可用 `completed`、`in-progress` 或 `planned`。

## 5. 发布更新

修改完成后，先在博客目录执行：

```powershell
pnpm check
pnpm build
```

两条命令都成功后再上传：

```powershell
git add -A
git commit -m "描述这次修改"
git push
```

推送到 GitHub 的 `main` 分支后，Vercel 会自动重新构建并更新 <https://xuanji-blog.vercel.app/>，通常几分钟内完成。GitHub 和 Vercel 已经关联，不需要再次手动上传文件。

## 6. 常见情况

- 本地端口不是 3000：使用 PowerShell 中实际显示的网址。
- 新文章没出现：确认 `draft` 是 `false`，日期格式正确，并检查 `pnpm check` 的提示。
- 图片不显示：确认图片确实在 `public/` 下，引用路径以 `/assets/` 开头，且大小写完全一致。
- 构建失败：先不要推送；保存报错信息，再根据报错修改。
- 已经推送但线上还没变化：打开 Vercel 项目页查看最新一次部署，等待状态变为成功。

## 7. 重要原则

- 不要把密码、令牌、Cookie 或其他私密信息写进文章、配置文件或 GitHub 仓库。
- 大改之前先提交当前版本，方便需要时回到之前的状态。
- 每次发布前至少运行一次 `pnpm check` 和 `pnpm build`。
