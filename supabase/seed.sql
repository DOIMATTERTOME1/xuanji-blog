-- Default values for Xuanji's Blog. Run after the migration.

insert into public.site_settings (key, draft_value, published_value, default_value)
values
(
	'profile',
	'{"name":"Xuanji","bio":"记录学习、科研、技术与生活","avatar":"/assets/images/xuanji-avatar.svg","socialLinks":[]}'::jsonb,
	'{"name":"Xuanji","bio":"记录学习、科研、技术与生活","avatar":"/assets/images/xuanji-avatar.svg","socialLinks":[]}'::jsonb,
	'{"name":"Xuanji","bio":"记录学习、科研、技术与生活","avatar":"/assets/images/xuanji-avatar.svg","socialLinks":[]}'::jsonb
),
(
	'appearance',
	'{"siteTitle":"Xuanji''s Blog","subtitle":"记录学习、科研、技术与生活","themeHue":240,"wallpaperMode":"banner"}'::jsonb,
	'{"siteTitle":"Xuanji''s Blog","subtitle":"记录学习、科研、技术与生活","themeHue":240,"wallpaperMode":"banner"}'::jsonb,
	'{"siteTitle":"Xuanji''s Blog","subtitle":"记录学习、科研、技术与生活","themeHue":240,"wallpaperMode":"banner"}'::jsonb
),
(
	'navigation',
	'{"items":[{"id":"home","label":"首页","url":"/","enabled":true},{"id":"blog","label":"博客","url":"/#blog","enabled":true},{"id":"diary","label":"日记","url":"/diary/","enabled":true},{"id":"anime","label":"追番","url":"/anime/","enabled":true},{"id":"projects","label":"项目","url":"/projects/","enabled":true},{"id":"archive","label":"归档","url":"/archive/","enabled":true},{"id":"about","label":"关于","url":"/about/","enabled":true}]}'::jsonb,
	'{"items":[{"id":"home","label":"首页","url":"/","enabled":true},{"id":"blog","label":"博客","url":"/#blog","enabled":true},{"id":"diary","label":"日记","url":"/diary/","enabled":true},{"id":"anime","label":"追番","url":"/anime/","enabled":true},{"id":"projects","label":"项目","url":"/projects/","enabled":true},{"id":"archive","label":"归档","url":"/archive/","enabled":true},{"id":"about","label":"关于","url":"/about/","enabled":true}]}'::jsonb,
	'{"items":[{"id":"home","label":"首页","url":"/","enabled":true},{"id":"blog","label":"博客","url":"/#blog","enabled":true},{"id":"diary","label":"日记","url":"/diary/","enabled":true},{"id":"anime","label":"追番","url":"/anime/","enabled":true},{"id":"projects","label":"项目","url":"/projects/","enabled":true},{"id":"archive","label":"归档","url":"/archive/","enabled":true},{"id":"about","label":"关于","url":"/about/","enabled":true}]}'::jsonb
),
(
	'home_modules',
	'{"items":[{"id":"banner","label":"首页横幅","enabled":true},{"id":"profile","label":"个人介绍","enabled":true},{"id":"latest-posts","label":"最新文章","enabled":true},{"id":"study","label":"学习记录","enabled":true},{"id":"diary","label":"最近日记","enabled":true},{"id":"projects","label":"项目展示","enabled":true},{"id":"anime","label":"追番动态","enabled":false}]}'::jsonb,
	'{"items":[{"id":"banner","label":"首页横幅","enabled":true},{"id":"profile","label":"个人介绍","enabled":true},{"id":"latest-posts","label":"最新文章","enabled":true},{"id":"study","label":"学习记录","enabled":true},{"id":"diary","label":"最近日记","enabled":true},{"id":"projects","label":"项目展示","enabled":true},{"id":"anime","label":"追番动态","enabled":false}]}'::jsonb,
	'{"items":[{"id":"banner","label":"首页横幅","enabled":true},{"id":"profile","label":"个人介绍","enabled":true},{"id":"latest-posts","label":"最新文章","enabled":true},{"id":"study","label":"学习记录","enabled":true},{"id":"diary","label":"最近日记","enabled":true},{"id":"projects","label":"项目展示","enabled":true},{"id":"anime","label":"追番动态","enabled":false}]}'::jsonb
)
on conflict (key) do nothing;

-- Import the existing article into the new editor without removing its source
-- Markdown file. The stable UUID makes this seed safe to run more than once.
insert into public.content_entries (
	id, kind, title, slug, summary, body, category, tags, status, published_at
) values (
	'2fb38b3d-a53e-4fd0-9b9c-090396f544d3'::uuid,
	'technical',
	'LLC谐振变换器学习记录',
	'llc-resonant-converter-learning',
	'用于验证博客文章、分类、标签、数学公式与 MATLAB 代码高亮的第一篇学习记录。',
	$article$这篇文章是博客的第一篇测试记录，用来确认 Markdown 内容、分类、标签、数学公式与代码块都能正常显示。

## 谐振频率

对由谐振电感 $L_r$ 和谐振电容 $C_r$ 组成的串联谐振网络，其谐振频率可以写为：

$$
f_r = \frac{1}{2\pi\sqrt{L_r C_r}}
$$

这个频率是后续分析 LLC 变换器工作区间和归一化频率的重要参考。

## MATLAB 计算示例

```matlab
Lr = 20e-6;      % 谐振电感，单位 H
Cr = 100e-9;     % 谐振电容，单位 F
fr = 1 / (2*pi*sqrt(Lr*Cr));

fprintf("谐振频率：%.2f kHz\n", fr / 1e3);
```

后续会继续补充增益曲线、软开关条件、器件参数选择和仿真结果。$article$,
	'电力电子',
	array['LLC', '谐振变换器', '电力电子'],
	'published',
	'2026-09-01T00:00:00+08:00'::timestamptz
)
on conflict (id) do nothing;

insert into public.managed_items (id, kind, title, data, status, sort_order)
values (
	'2a176bfe-946c-4702-af2c-37e1db635aa8'::uuid,
	'project',
	'LLC谐振变换器学习与设计',
	'{"description":"围绕 LLC 谐振变换器开展参数设计、仿真与 PCB 学习。","techStack":["MATLAB","Simulink","KiCad"]}'::jsonb,
	'published',
	0
)
on conflict (id) do nothing;
