<script lang="ts">
	import Icon from "@iconify/svelte";
	import ContentManager from "./ContentManager.svelte";
	import MediaManager from "./MediaManager.svelte";
	import SiteDesigner from "./SiteDesigner.svelte";
	import StructuredManager from "./StructuredManager.svelte";

	let {
		adminEmail = "网站管理员",
		previewMode = false,
	}: {
		adminEmail?: string;
		previewMode?: boolean;
	} = $props();

	type NavItem = {
		id: string;
		label: string;
		icon: string;
	};

	type HomeModule = {
		id: string;
		name: string;
		description: string;
		enabled: boolean;
	};

	const navItems: NavItem[] = [
		{ id: "overview", label: "首页概览", icon: "material-symbols:space-dashboard-rounded" },
		{ id: "write", label: "开始写作", icon: "material-symbols:edit-square-outline-rounded" },
		{ id: "content", label: "内容管理", icon: "material-symbols:article-outline-rounded" },
		{ id: "appearance", label: "网站装修", icon: "material-symbols:palette-outline-rounded" },
		{ id: "projects", label: "项目管理", icon: "material-symbols:work-outline-rounded" },
		{ id: "announcement", label: "公告管理", icon: "material-symbols:campaign-outline-rounded" },
		{ id: "anime", label: "追番管理", icon: "material-symbols:movie-outline-rounded" },
		{ id: "media", label: "图片管理", icon: "material-symbols:image-outline-rounded" },
	];

	let activeSection = "overview";
	let modules: HomeModule[] = [
		{ id: "banner", name: "首页横幅", description: "网站标题和背景图片", enabled: true },
		{ id: "profile", name: "个人介绍", description: "头像、姓名和个人简介", enabled: true },
		{ id: "latest-posts", name: "最新文章", description: "展示最近发布的内容", enabled: true },
		{ id: "study", name: "学习记录", description: "集中展示学习笔记", enabled: true },
		{ id: "diary", name: "最近日记", description: "展示最近的日常记录", enabled: true },
		{ id: "projects", name: "项目展示", description: "展示正在进行的项目", enabled: true },
		{ id: "anime", name: "追番动态", description: "展示正在看的动画", enabled: false },
	];

	const sectionTitles: Record<string, string> = {
		overview: "首页概览",
		write: "开始写作",
		content: "内容管理",
		appearance: "网站装修",
		projects: "项目管理",
		announcement: "公告管理",
		anime: "追番管理",
		media: "图片管理",
	};

	function toggleModule(id: string) {
		modules = modules.map((module) =>
			module.id === id ? { ...module, enabled: !module.enabled } : module,
		);
	}

	function moveModule(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= modules.length) return;
		const next = [...modules];
		[next[index], next[nextIndex]] = [next[nextIndex], next[index]];
		modules = next;
	}
</script>

<svelte:head>
	<meta name="description" content="Xuanji's Blog 中文管理后台" />
</svelte:head>

<div class="admin-shell">
	<aside class="sidebar">
		<div class="brand">
			<div class="brand-mark"><Icon icon="material-symbols:ink-pen-rounded" /></div>
			<div>
				<strong>玄集后台</strong>
				<span>Xuanji's Blog</span>
			</div>
		</div>

		<nav aria-label="后台功能">
			{#each navItems as item}
				<button
					type="button"
					class:active={activeSection === item.id}
					onclick={() => (activeSection = item.id)}
				>
					<Icon icon={item.icon} />
					<span>{item.label}</span>
				</button>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<div class="avatar">X</div>
			<div>
				<strong>Xuanji</strong>
				<span>{adminEmail}</span>
			</div>
			<form method="post" action="/api/admin/auth/logout/">
				<button type="submit" aria-label="退出登录"><Icon icon="material-symbols:logout-rounded" /></button>
			</form>
		</div>
	</aside>

	<main class="workspace">
		<header class="topbar">
			<div>
				<p class="eyebrow">管理中心</p>
				<h1>{sectionTitles[activeSection]}</h1>
			</div>
			<div class="topbar-actions">
				<a class="preview-link" href="/" target="_blank">
					<Icon icon="material-symbols:visibility-outline-rounded" />
					查看网站
				</a>
				<span class="status"><i></i> {previewMode ? "本地预览" : "安全连接"}</span>
			</div>
		</header>

		{#if activeSection === "overview"}
			<section class="welcome-card">
				<div>
					<span class="welcome-label">早上好，Xuanji</span>
					<h2>今天想记录些什么？</h2>
					<p>你可以写技术文章、学习记录或日记，保存后再决定是否发布。</p>
					<div class="welcome-actions">
						<button class="primary" type="button" onclick={() => (activeSection = "write")}>
							<Icon icon="material-symbols:add-rounded" /> 新建内容
						</button>
						<button type="button" onclick={() => (activeSection = "appearance")}>
							<Icon icon="material-symbols:dashboard-customize-outline-rounded" /> 装修网站
						</button>
					</div>
				</div>
				<div class="welcome-illustration" aria-hidden="true">
					<Icon icon="material-symbols:menu-book-rounded" />
					<span></span>
				</div>
			</section>

			<section class="stat-grid" aria-label="内容统计">
				<div class="stat-card">
					<span class="stat-icon purple"><Icon icon="material-symbols:article-outline-rounded" /></span>
					<div><strong>1</strong><span>已发布内容</span></div>
				</div>
				<div class="stat-card">
					<span class="stat-icon amber"><Icon icon="material-symbols:draft-outline-rounded" /></span>
					<div><strong>0</strong><span>未完成草稿</span></div>
				</div>
				<div class="stat-card">
					<span class="stat-icon green"><Icon icon="material-symbols:calendar-month-outline-rounded" /></span>
					<div><strong>2</strong><span>网站运行天数</span></div>
				</div>
				<div class="stat-card">
					<span class="stat-icon blue"><Icon icon="material-symbols:movie-outline-rounded" /></span>
					<div><strong>0</strong><span>追番记录</span></div>
				</div>
			</section>

			<div class="dashboard-grid">
				<section class="panel recent-panel">
					<div class="panel-heading">
						<div><p>内容</p><h2>最近编辑</h2></div>
						<button type="button" onclick={() => (activeSection = "content")}>查看全部</button>
					</div>
					<div class="content-row">
						<span class="content-kind">技术文章</span>
						<div class="content-main">
							<strong>LLC谐振变换器学习记录</strong>
							<span>2026年9月1日 · 已发布</span>
						</div>
						<button type="button" aria-label="编辑 LLC谐振变换器学习记录">
							<Icon icon="material-symbols:edit-outline-rounded" />
						</button>
					</div>
					<div class="empty-row">
						<Icon icon="material-symbols:lightbulb-outline-rounded" />
						<span>新的想法可以先保存成草稿，不会立即公开。</span>
					</div>
				</section>

				<section class="panel module-panel">
					<div class="panel-heading">
						<div><p>网站装修</p><h2>首页模块</h2></div>
						<span>调整顺序和显示状态</span>
					</div>
					<div class="module-list">
						{#each modules.slice(0, 5) as module, index}
							<div class="module-row">
								<div class="module-order">
									<button type="button" aria-label={`上移${module.name}`} disabled={index === 0} onclick={() => moveModule(index, -1)}>
										<Icon icon="material-symbols:keyboard-arrow-up-rounded" />
									</button>
									<button type="button" aria-label={`下移${module.name}`} onclick={() => moveModule(index, 1)}>
										<Icon icon="material-symbols:keyboard-arrow-down-rounded" />
									</button>
								</div>
								<div class="module-copy"><strong>{module.name}</strong><span>{module.description}</span></div>
								<button
									type="button"
									class="switch"
									class:on={module.enabled}
									aria-pressed={module.enabled}
									aria-label={`${module.enabled ? "隐藏" : "显示"}${module.name}`}
									onclick={() => toggleModule(module.id)}
								><span></span></button>
							</div>
						{/each}
					</div>
				</section>
			</div>
		{:else if activeSection === "write" || activeSection === "content"}
			<ContentManager />
		{:else if activeSection === "appearance"}
			<SiteDesigner />
		{:else if activeSection === "projects"}
			<StructuredManager kind="project" />
		{:else if activeSection === "announcement"}
			<StructuredManager kind="announcement" />
		{:else if activeSection === "anime"}
			<StructuredManager kind="anime" />
		{:else if activeSection === "media"}
			<MediaManager />
		{:else}
			<section class="placeholder-panel">
				<div class="placeholder-icon"><Icon icon={navItems.find((item) => item.id === activeSection)?.icon ?? "material-symbols:construction-rounded"} /></div>
				<p>第一阶段正在搭建</p>
				<h2>{sectionTitles[activeSection]}</h2>
				<span>这里会使用简单的中文表单和按钮，不需要接触代码。</span>
				<button type="button" onclick={() => (activeSection = "overview")}>返回首页概览</button>
			</section>
		{/if}
	</main>
</div>

<style>
	:global(body) { overflow-x: hidden; }
	button, a { transition: 160ms ease; }
	button { border: 0; cursor: pointer; }
	.admin-shell { min-height: 100vh; display: grid; grid-template-columns: 248px minmax(0, 1fr); }
	.sidebar { position: sticky; top: 0; height: 100vh; padding: 24px 18px; display: flex; flex-direction: column; color: #e8e9ff; background: linear-gradient(180deg, #292a58 0%, #20213f 100%); box-shadow: 12px 0 32px rgba(26, 27, 66, .12); }
	.brand { display: flex; align-items: center; gap: 12px; padding: 0 8px 26px; }
	.brand-mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; font-size: 24px; color: white; background: linear-gradient(135deg, #8b8cf3, #6366d9); box-shadow: 0 10px 22px rgba(99, 102, 217, .35); }
	.brand strong, .brand span { display: block; }
	.brand strong { font-size: 17px; letter-spacing: .04em; }
	.brand span { margin-top: 3px; color: #aaacd2; font-size: 11px; }
	nav { display: grid; gap: 6px; }
	nav button { width: 100%; padding: 11px 13px; display: flex; align-items: center; gap: 12px; border-radius: 11px; color: #bfc1e2; background: transparent; text-align: left; }
	nav button :global(svg) { font-size: 21px; }
	nav button:hover { color: white; background: rgba(255,255,255,.08); }
	nav button.active { color: white; background: linear-gradient(90deg, rgba(117,119,231,.32), rgba(117,119,231,.14)); box-shadow: inset 3px 0 #9a9bf5; }
	.sidebar-footer { margin-top: auto; padding: 16px 8px 0; display: grid; grid-template-columns: 36px 1fr 32px; gap: 9px; align-items: center; border-top: 1px solid rgba(255,255,255,.1); }
	.avatar { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; color: white; font-weight: 700; background: #6f71d9; }
	.sidebar-footer strong, .sidebar-footer span { display: block; }
	.sidebar-footer strong { font-size: 13px; }
	.sidebar-footer span { margin-top: 2px; color: #9fa1c7; font-size: 11px; }
	.sidebar-footer button { display: grid; place-items: center; color: #aeb0d4; background: transparent; font-size: 20px; }
	.workspace { min-width: 0; padding: 30px clamp(22px, 4vw, 56px) 56px; }
	.topbar { max-width: 1320px; margin: 0 auto 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
	.eyebrow, .panel-heading p { margin: 0 0 5px; color: #8587a2; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
	h1 { margin: 0; font-size: clamp(24px, 3vw, 31px); letter-spacing: -.025em; }
	.topbar-actions { display: flex; align-items: center; gap: 12px; }
	.preview-link { padding: 9px 13px; display: inline-flex; align-items: center; gap: 7px; border: 1px solid #dedfeb; border-radius: 10px; color: #4f5066; background: rgba(255,255,255,.72); text-decoration: none; font-size: 13px; font-weight: 700; }
	.preview-link:hover { border-color: #b8b9e6; color: #5658c9; }
	.status { padding: 8px 11px; display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; color: #53745e; background: #e9f6ec; font-size: 12px; font-weight: 700; }
	.status i { width: 7px; height: 7px; border-radius: 50%; background: #4eaa68; box-shadow: 0 0 0 3px rgba(78,170,104,.12); }
	.welcome-card { position: relative; overflow: hidden; max-width: 1320px; margin: 0 auto 20px; min-height: 228px; padding: clamp(28px, 4vw, 44px); display: flex; align-items: center; border: 1px solid rgba(99,102,217,.14); border-radius: 24px; color: #2d2e50; background: linear-gradient(118deg, #eeefff 0%, #f9f8ff 62%, #ecebff 100%); box-shadow: 0 18px 48px rgba(65,66,125,.08); }
	.welcome-label { color: #6668c8; font-size: 13px; font-weight: 800; }
	.welcome-card h2 { margin: 9px 0 8px; font-size: clamp(25px, 3.6vw, 39px); letter-spacing: -.04em; }
	.welcome-card p { max-width: 580px; margin: 0; color: #6e6f88; line-height: 1.75; }
	.welcome-actions { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
	.welcome-actions button, .placeholder-panel button { padding: 11px 16px; display: inline-flex; align-items: center; gap: 7px; border: 1px solid #d8d8ec; border-radius: 11px; color: #4f5064; background: rgba(255,255,255,.84); font-weight: 750; }
	.welcome-actions button.primary { border-color: transparent; color: white; background: #5f61d1; box-shadow: 0 10px 20px rgba(95,97,209,.24); }
	.welcome-actions button:hover { transform: translateY(-1px); }
	.welcome-illustration { position: absolute; right: clamp(22px, 8vw, 96px); width: 160px; height: 160px; display: grid; place-items: center; border-radius: 48% 52% 45% 55%; color: #7779db; background: rgba(255,255,255,.48); font-size: 76px; transform: rotate(-4deg); }
	.welcome-illustration span { position: absolute; inset: 15px; border: 1px dashed rgba(94,96,203,.25); border-radius: inherit; }
	.stat-grid { max-width: 1320px; margin: 0 auto 20px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
	.stat-card { min-height: 104px; padding: 18px; display: flex; align-items: center; gap: 14px; border: 1px solid #e7e7ef; border-radius: 16px; background: rgba(255,255,255,.85); box-shadow: 0 8px 26px rgba(41,42,82,.045); }
	.stat-icon { width: 45px; height: 45px; display: grid; place-items: center; border-radius: 13px; font-size: 23px; }
	.stat-icon.purple { color: #6264cd; background: #ededff; }
	.stat-icon.amber { color: #b77b27; background: #fff3df; }
	.stat-icon.green { color: #3f9765; background: #e6f6ed; }
	.stat-icon.blue { color: #4587b7; background: #e9f4fb; }
	.stat-card strong, .stat-card span { display: block; }
	.stat-card strong { font-size: 25px; line-height: 1; }
	.stat-card div span { margin-top: 7px; color: #88899e; font-size: 12px; }
	.dashboard-grid { max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(360px, .92fr); gap: 18px; }
	.panel { padding: 22px; border: 1px solid #e7e7ef; border-radius: 18px; background: rgba(255,255,255,.9); box-shadow: 0 10px 30px rgba(41,42,82,.045); }
	.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 17px; }
	.panel-heading h2 { margin: 0; font-size: 18px; }
	.panel-heading > span { color: #9798aa; font-size: 11px; }
	.panel-heading button { color: #6365ca; background: transparent; font-size: 12px; font-weight: 750; }
	.content-row { padding: 16px 0; display: grid; grid-template-columns: auto 1fr 36px; align-items: center; gap: 13px; border-top: 1px solid #eeeeF4; border-bottom: 1px solid #eeeeF4; }
	.content-kind { padding: 6px 9px; border-radius: 8px; color: #5c5fc4; background: #eeeeff; font-size: 11px; font-weight: 700; }
	.content-main strong, .content-main span { display: block; }
	.content-main strong { font-size: 14px; }
	.content-main span { margin-top: 5px; color: #9697a9; font-size: 11px; }
	.content-row > button { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; color: #6d6e83; background: #f4f4f8; font-size: 18px; }
	.empty-row { margin-top: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 9px; border-radius: 10px; color: #7d7f92; background: #fafafc; font-size: 12px; }
	.empty-row :global(svg) { color: #d29b43; font-size: 18px; }
	.module-list { display: grid; gap: 4px; }
	.module-row { min-height: 54px; padding: 7px 2px; display: grid; grid-template-columns: 26px 1fr auto; align-items: center; gap: 10px; border-top: 1px solid #f0f0f5; }
	.module-order { display: grid; }
	.module-order button { height: 18px; display: grid; place-items: center; color: #a0a1b1; background: transparent; font-size: 17px; }
	.module-order button:disabled { opacity: .25; cursor: default; }
	.module-copy strong, .module-copy span { display: block; }
	.module-copy strong { font-size: 13px; }
	.module-copy span { margin-top: 3px; color: #9a9bac; font-size: 10px; }
	.switch { position: relative; width: 38px; height: 22px; padding: 2px; border-radius: 999px; background: #d8d9e3; }
	.switch span { display: block; width: 18px; height: 18px; border-radius: 50%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,.16); transition: 160ms ease; }
	.switch.on { background: #6668d2; }
	.switch.on span { transform: translateX(16px); }
	.placeholder-panel { max-width: 860px; min-height: 440px; margin: 50px auto 0; padding: 60px 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #e4e5ee; border-radius: 24px; background: rgba(255,255,255,.82); text-align: center; box-shadow: 0 18px 48px rgba(41,42,82,.06); }
	.placeholder-icon { width: 74px; height: 74px; display: grid; place-items: center; border-radius: 22px; color: #6567ce; background: #eeeefe; font-size: 38px; }
	.placeholder-panel p { margin: 22px 0 5px; color: #7779d5; font-size: 12px; font-weight: 800; }
	.placeholder-panel h2 { margin: 0; font-size: 28px; }
	.placeholder-panel span { margin: 10px 0 24px; color: #898a9e; }

	@media (max-width: 1040px) {
		.stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.dashboard-grid { grid-template-columns: 1fr; }
		.welcome-illustration { opacity: .38; right: 30px; }
		.welcome-card > div:first-child { position: relative; z-index: 1; }
	}

	@media (max-width: 760px) {
		.admin-shell { display: block; }
		.sidebar { position: fixed; z-index: 20; top: auto; bottom: 0; width: 100%; height: auto; padding: 8px 10px max(8px, env(safe-area-inset-bottom)); }
		.brand, .sidebar-footer { display: none; }
		nav { overflow-x: auto; grid-auto-flow: column; grid-auto-columns: minmax(72px, 1fr); gap: 2px; scrollbar-width: none; }
		nav::-webkit-scrollbar { display: none; }
		nav button { min-width: 72px; padding: 8px 4px; flex-direction: column; gap: 3px; border-radius: 9px; text-align: center; }
		nav button span { overflow: hidden; max-width: 100%; font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
		nav button.active { box-shadow: inset 0 2px #9a9bf5; }
		.workspace { padding: 22px 14px 96px; }
		.topbar { align-items: center; }
		.topbar-actions .status { display: none; }
		.preview-link { padding: 8px 10px; }
		.welcome-card { min-height: 0; padding: 26px 21px; border-radius: 18px; }
		.welcome-illustration { width: 120px; height: 120px; right: -22px; font-size: 58px; }
		.stat-grid { grid-template-columns: 1fr 1fr; gap: 9px; }
		.stat-card { min-height: 88px; padding: 13px; gap: 10px; }
		.stat-icon { width: 38px; height: 38px; font-size: 20px; }
		.stat-card strong { font-size: 21px; }
		.panel { padding: 17px; }
		.content-row { grid-template-columns: 1fr 34px; }
		.content-kind { width: max-content; grid-column: 1 / -1; }
	}
</style>
