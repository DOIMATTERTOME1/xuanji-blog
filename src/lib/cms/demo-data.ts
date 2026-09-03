import type { ContentEntry, ManagedItem, SiteSetting } from "./models";

const now = new Date().toISOString();

export const demoContent: ContentEntry[] = [
	{
		id: "local-llc-article",
		kind: "technical",
		title: "LLC谐振变换器学习记录",
		slug: "llc-resonant-converter-learning",
		summary: "用于验证博客文章、分类、标签、数学公式与 MATLAB 代码高亮的第一篇学习记录。",
		body: `这篇文章是博客的第一篇测试记录，用来确认 Markdown 内容、分类、标签、数学公式与代码块都能正常显示。

## 谐振频率

对由谐振电感 $L_r$ 和谐振电容 $C_r$ 组成的串联谐振网络，其谐振频率可以写为：

$$
f_r = \\frac{1}{2\\pi\\sqrt{L_r C_r}}
$$

这个频率是后续分析 LLC 变换器工作区间和归一化频率的重要参考。

## MATLAB 计算示例

\`\`\`matlab
Lr = 20e-6;      % 谐振电感，单位 H
Cr = 100e-9;     % 谐振电容，单位 F
fr = 1 / (2*pi*sqrt(Lr*Cr));

fprintf("谐振频率：%.2f kHz\\n", fr / 1e3);
\`\`\`

后续会继续补充增益曲线、软开关条件、器件参数选择和仿真结果。`,
		cover_url: null,
		category: "电力电子",
		tags: ["LLC", "谐振变换器", "电力电子"],
		status: "published",
		pinned: false,
		published_at: "2026-09-01T00:00:00.000Z",
		created_at: "2026-09-01T00:00:00.000Z",
		updated_at: now,
	},
];

export const demoManagedItems: ManagedItem[] = [
	{
		id: "local-llc-project",
		kind: "project",
		title: "LLC谐振变换器学习与设计",
		data: { status: "进行中", techStack: ["MATLAB", "Simulink", "KiCad"] },
		status: "published",
		sort_order: 0,
		created_at: "2026-09-01T00:00:00.000Z",
		updated_at: now,
	},
];

export const demoSettings: SiteSetting[] = [
	{
		key: "appearance",
		draft_value: { siteTitle: "Xuanji's Blog", subtitle: "记录学习、科研、技术与生活", themeHue: 240, wallpaperMode: "banner" },
		published_value: { siteTitle: "Xuanji's Blog", subtitle: "记录学习、科研、技术与生活", themeHue: 240, wallpaperMode: "banner" },
		default_value: { siteTitle: "Xuanji's Blog", subtitle: "记录学习、科研、技术与生活", themeHue: 240, wallpaperMode: "banner" },
		version: 1,
		updated_at: now,
	},
	{
		key: "profile",
		draft_value: { name: "Xuanji", bio: "记录学习、科研、技术与生活", avatar: "/assets/images/xuanji-avatar.svg", socialLinks: [] },
		published_value: { name: "Xuanji", bio: "记录学习、科研、技术与生活", avatar: "/assets/images/xuanji-avatar.svg", socialLinks: [] },
		default_value: { name: "Xuanji", bio: "记录学习、科研、技术与生活", avatar: "/assets/images/xuanji-avatar.svg", socialLinks: [] },
		version: 1,
		updated_at: now,
	},
	{
		key: "navigation",
		draft_value: { items: [
			{ id: "home", label: "首页", url: "/", enabled: true }, { id: "blog", label: "博客", url: "/#blog", enabled: true },
			{ id: "diary", label: "日记", url: "/diary/", enabled: true }, { id: "anime", label: "追番", url: "/anime/", enabled: true },
			{ id: "projects", label: "项目", url: "/projects/", enabled: true }, { id: "archive", label: "归档", url: "/archive/", enabled: true },
		] },
		published_value: { items: [
			{ id: "home", label: "首页", url: "/", enabled: true }, { id: "blog", label: "博客", url: "/#blog", enabled: true },
			{ id: "diary", label: "日记", url: "/diary/", enabled: true }, { id: "anime", label: "追番", url: "/anime/", enabled: true },
			{ id: "projects", label: "项目", url: "/projects/", enabled: true }, { id: "archive", label: "归档", url: "/archive/", enabled: true },
		] },
		default_value: {}, version: 1, updated_at: now,
	},
	{
		key: "home_modules",
		draft_value: { items: [
			{ id: "banner", label: "首页横幅", enabled: true }, { id: "profile", label: "个人介绍", enabled: true },
			{ id: "latest-posts", label: "最新文章", enabled: true }, { id: "study", label: "学习记录", enabled: true },
			{ id: "diary", label: "最近日记", enabled: true }, { id: "projects", label: "项目展示", enabled: true },
			{ id: "anime", label: "追番动态", enabled: true },
		] },
		published_value: { items: [
			{ id: "banner", label: "首页横幅", enabled: true }, { id: "profile", label: "个人介绍", enabled: true },
			{ id: "latest-posts", label: "最新文章", enabled: true }, { id: "study", label: "学习记录", enabled: true },
			{ id: "diary", label: "最近日记", enabled: true }, { id: "projects", label: "项目展示", enabled: true },
			{ id: "anime", label: "追番动态", enabled: true },
		] },
		default_value: {}, version: 1, updated_at: now,
	},
];
