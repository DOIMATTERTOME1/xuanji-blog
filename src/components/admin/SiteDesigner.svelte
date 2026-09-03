<script lang="ts">
	import Icon from "@iconify/svelte";

	type HomeModule = { id: string; label: string; enabled: boolean };
	type NavItem = { id: string; label: string; url: string; enabled: boolean };

	const defaults = {
		appearance: {
			siteTitle: "Xuanji's Blog",
			subtitle: "记录学习、科研、技术与生活",
			themeHue: 240,
			wallpaperMode: "banner",
			desktopBanner: "/assets/desktop-banner/1.webp",
			mobileBanner: "/assets/mobile-banner/1.webp",
		},
		profile: {
			name: "Xuanji",
			bio: "记录学习、科研、技术与生活",
			avatar: "/assets/images/xuanji-avatar.svg",
			socialLinks: [] as { name: string; url: string }[],
		},
		navigation: {
			items: [
				{ id: "home", label: "首页", url: "/", enabled: true },
				{ id: "blog", label: "博客", url: "/#blog", enabled: true },
				{ id: "diary", label: "日记", url: "/diary/", enabled: false },
				{ id: "anime", label: "追番", url: "/anime/", enabled: false },
				{ id: "projects", label: "项目", url: "/projects/", enabled: true },
				{ id: "archive", label: "归档", url: "/archive/", enabled: true },
				{ id: "about", label: "关于", url: "/about/", enabled: true },
			] as NavItem[],
		},
		home_modules: {
			items: [
				{ id: "banner", label: "首页横幅", enabled: true },
				{ id: "profile", label: "个人介绍", enabled: true },
				{ id: "latest-posts", label: "最新文章", enabled: true },
				{ id: "study", label: "学习记录", enabled: true },
				{ id: "diary", label: "最近日记", enabled: true },
				{ id: "projects", label: "项目展示", enabled: true },
				{ id: "anime", label: "追番动态", enabled: false },
			] as HomeModule[],
		},
	};

	let appearance = structuredClone(defaults.appearance);
	let profile = structuredClone(defaults.profile);
	let navigation = structuredClone(defaults.navigation);
	let homeModules = structuredClone(defaults.home_modules);
	let published = structuredClone(defaults);
	let activeTab: "basic" | "navigation" | "modules" = "basic";
	let loading = true;
	let saving = false;
	let message = "";
	let error = "";
	let draggedIndex = -1;

	async function loadSettings() {
		loading = true;
		try {
			const response = await fetch("/api/admin/settings/", { headers: { Accept: "application/json" } });
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "读取设置失败");
			const map = new Map(result.settings.map((setting: { key: string; draft_value: Record<string, unknown> }) => [setting.key, setting.draft_value]));
			const publishedMap = new Map(result.settings.map((setting: { key: string; published_value: Record<string, unknown> }) => [setting.key, setting.published_value]));
			appearance = { ...defaults.appearance, ...(map.get("appearance") ?? {}) } as typeof appearance;
			profile = { ...defaults.profile, ...(map.get("profile") ?? {}) } as typeof profile;
			navigation = { ...defaults.navigation, ...(map.get("navigation") ?? {}) } as typeof navigation;
			homeModules = { ...defaults.home_modules, ...(map.get("home_modules") ?? {}) } as typeof homeModules;
			published = {
				appearance: { ...defaults.appearance, ...(publishedMap.get("appearance") ?? {}) } as typeof appearance,
				profile: { ...defaults.profile, ...(publishedMap.get("profile") ?? {}) } as typeof profile,
				navigation: { ...defaults.navigation, ...(publishedMap.get("navigation") ?? {}) } as typeof navigation,
				home_modules: { ...defaults.home_modules, ...(publishedMap.get("home_modules") ?? {}) } as typeof homeModules,
			};
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "读取设置失败";
		} finally {
			loading = false;
		}
	}

	async function saveSetting(key: string, draftValue: Record<string, unknown>, publish: boolean) {
		const response = await fetch(`/api/admin/settings/${key}/`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ draft_value: draftValue, publish }),
		});
		const result = await response.json();
		if (!response.ok) throw new Error(result.error || "保存失败");
	}

	async function saveAll(publish: boolean) {
		saving = true;
		message = "";
		error = "";
		try {
			await Promise.all([
				saveSetting("appearance", appearance, publish),
				saveSetting("profile", profile, publish),
				saveSetting("navigation", navigation, publish),
				saveSetting("home_modules", homeModules, publish),
			]);
			message = publish ? "网站设置已经发布。" : "装修草稿已经保存。";
			if (publish) published = { appearance: structuredClone(appearance), profile: structuredClone(profile), navigation: structuredClone(navigation), home_modules: structuredClone(homeModules) };
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "保存失败";
		} finally {
			saving = false;
		}
	}

	function undoCurrent() {
		if (!confirm("撤销这一页尚未发布的修改，恢复成目前公开网站的设置吗？")) return;
		if (activeTab === "basic") {
			appearance = structuredClone(published.appearance);
			profile = structuredClone(published.profile);
		} else if (activeTab === "navigation") navigation = structuredClone(published.navigation);
		else homeModules = structuredClone(published.home_modules);
		message = "已撤销尚未发布的修改。再次保存后才会写入后台。";
	}

	function resetCurrent() {
		if (!confirm("确定恢复这一页的默认设置吗？尚未保存的修改会消失。")) return;
		if (activeTab === "basic") {
			appearance = structuredClone(defaults.appearance);
			profile = structuredClone(defaults.profile);
		} else if (activeTab === "navigation") {
			navigation = structuredClone(defaults.navigation);
		} else {
			homeModules = structuredClone(defaults.home_modules);
		}
	}

	function toggleModule(id: string) {
		homeModules.items = homeModules.items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item);
		homeModules = { ...homeModules };
	}

	function toggleNav(id: string) {
		navigation.items = navigation.items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item);
		navigation = { ...navigation };
	}

	function dropModule(targetIndex: number) {
		if (draggedIndex < 0 || draggedIndex === targetIndex) return;
		const items = [...homeModules.items];
		const [moved] = items.splice(draggedIndex, 1);
		items.splice(targetIndex, 0, moved);
		homeModules = { items };
		draggedIndex = -1;
	}

	function addSocialLink() {
		profile.socialLinks = [...profile.socialLinks, { name: "GitHub", url: "" }];
		profile = { ...profile };
	}

	loadSettings();
</script>

<section class="designer">
	<div class="section-head">
		<div><p>可视化装修</p><h2>网站装修</h2><span>修改后先保存草稿，确认满意再发布。</span></div>
		<div class="head-actions"><button type="button" onclick={undoCurrent}><Icon icon="material-symbols:undo-rounded" /> 撤销修改</button><button type="button" onclick={resetCurrent}><Icon icon="material-symbols:restart-alt-rounded" /> 恢复默认</button><button type="button" disabled={saving} onclick={() => saveAll(false)}>保存草稿</button><button class="primary" type="button" disabled={saving} onclick={() => saveAll(true)}>{saving ? "正在保存…" : "确认发布"}</button></div>
	</div>

	{#if message}<p class="notice success">{message}</p>{/if}
	{#if error}<p class="notice error">{error}</p>{/if}

	<div class="tabs" role="tablist">
		<button class:active={activeTab === "basic"} type="button" onclick={() => (activeTab = "basic")}>基本外观</button>
		<button class:active={activeTab === "navigation"} type="button" onclick={() => (activeTab = "navigation")}>导航菜单</button>
		<button class:active={activeTab === "modules"} type="button" onclick={() => (activeTab = "modules")}>首页模块</button>
	</div>

	{#if loading}
		<div class="loading"><Icon icon="material-symbols:progress-activity" /> 正在读取网站设置…</div>
	{:else if activeTab === "basic"}
		<div class="basic-grid">
			<div class="settings-card">
				<h3>网站资料</h3>
				<label><span>网站名称</span><input bind:value={appearance.siteTitle} maxlength="80" /></label>
				<label><span>网站介绍</span><input bind:value={appearance.subtitle} maxlength="160" /></label>
				<div class="two-cols"><label><span>你的名字</span><input bind:value={profile.name} maxlength="60" /></label><label><span>头像地址</span><input bind:value={profile.avatar} /></label></div>
				<label><span>个人简介</span><textarea bind:value={profile.bio} maxlength="240"></textarea></label>
				<h3>背景和颜色</h3>
				<label><span>主题颜色</span><div class="hue-control"><input type="range" min="0" max="360" bind:value={appearance.themeHue} /><i style={`--preview-hue:${appearance.themeHue}`}></i><b>{appearance.themeHue}</b></div></label>
				<div class="two-cols"><label><span>电脑背景图</span><input bind:value={appearance.desktopBanner} /></label><label><span>手机背景图</span><input bind:value={appearance.mobileBanner} /></label></div>
				<label><span>背景显示方式</span><select bind:value={appearance.wallpaperMode}><option value="banner">顶部横幅</option><option value="fullscreen">全屏背景</option><option value="none">不显示背景</option></select></label>
				<h3>社交链接</h3>
				{#each profile.socialLinks as link, index}
					<div class="social-row"><input bind:value={link.name} aria-label="平台名称" placeholder="例如：GitHub" /><input bind:value={link.url} aria-label="链接地址" placeholder="https://…" /><button type="button" aria-label="删除链接" onclick={() => { profile.socialLinks.splice(index, 1); profile = { ...profile }; }}><Icon icon="material-symbols:delete-outline-rounded" /></button></div>
				{/each}
				<button class="add-link" type="button" onclick={addSocialLink}><Icon icon="material-symbols:add-rounded" /> 添加社交链接</button>
			</div>

			<div class="preview-card">
				<p>效果预览</p>
				<div class="site-preview" style={`--preview-hue:${appearance.themeHue}; --preview-bg:url('${appearance.desktopBanner}')`}>
					<div class="preview-nav"><strong>{appearance.siteTitle || "网站名称"}</strong><span>首页　博客　归档　关于</span></div>
					<div class="preview-hero"><img src={profile.avatar} alt="头像预览" /><h3>{appearance.siteTitle || "网站名称"}</h3><p>{appearance.subtitle || "网站介绍"}</p></div>
					<div class="preview-body"><strong>{profile.name || "你的名字"}</strong><span>{profile.bio || "个人简介"}</span><div><i></i><i></i><i></i></div></div>
				</div>
			</div>
		</div>
	{:else if activeTab === "navigation"}
		<div class="list-card">
			<div class="list-heading"><div><h3>顶部导航栏</h3><p>修改名称，或者决定是否显示某个入口。</p></div></div>
			{#each navigation.items as item}
				<div class="nav-row"><div class="drag"><Icon icon="material-symbols:drag-indicator-rounded" /></div><input bind:value={item.label} aria-label="导航名称" /><code>{item.url}</code><button class="switch" class:on={item.enabled} type="button" aria-pressed={item.enabled} onclick={() => toggleNav(item.id)}><span></span></button></div>
			{/each}
			<p class="tip"><Icon icon="material-symbols:info-outline-rounded" /> 开启“日记”或“追番”后，对应入口才会显示。</p>
		</div>
	{:else}
		<div class="list-card">
			<div class="list-heading"><div><h3>首页模块顺序</h3><p>按住左侧图标拖动，右侧开关控制是否显示。</p></div></div>
			{#each homeModules.items as module, index}
				<div class="module-row" draggable="true" ondragstart={() => (draggedIndex = index)} ondragover={(event) => event.preventDefault()} ondrop={() => dropModule(index)}>
					<div class="drag"><Icon icon="material-symbols:drag-indicator-rounded" /></div><div><strong>{module.label}</strong><span>第 {index + 1} 个模块</span></div><button class="switch" class:on={module.enabled} type="button" aria-pressed={module.enabled} onclick={() => toggleModule(module.id)}><span></span></button>
				</div>
			{/each}
			<p class="tip"><Icon icon="material-symbols:info-outline-rounded" /> 修改只会先保存为草稿，点击“确认发布”后才影响公开网站。</p>
		</div>
	{/if}
</section>

<style>
	.designer { max-width: 1320px; margin: 0 auto; }
	.section-head { margin-bottom: 18px; display: flex; align-items: flex-end; justify-content: space-between; gap: 22px; }
	.section-head p { margin: 0 0 5px; color: #7779d5; font-size: 12px; font-weight: 800; }
	.section-head h2 { margin: 0; font-size: 27px; }
	.section-head span { display: block; margin-top: 7px; color: #85869a; font-size: 13px; }
	.head-actions { display: flex; flex-wrap: wrap; gap: 7px; }
	button { border: 0; cursor: pointer; }
	.head-actions button, .add-link { padding: 9px 12px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid #dedfeb; border-radius: 9px; color: #55566c; background: white; font-size: 12px; font-weight: 750; }
	.head-actions .primary { border-color: transparent; color: white; background: #5f61d1; }
	.head-actions button:disabled { opacity: .6; cursor: wait; }
	.notice { margin: 0 0 13px; padding: 11px 14px; border-radius: 10px; font-size: 12px; }
	.notice.success { color: #3c7853; background: #eaf7ee; }
	.notice.error { color: #a64350; background: #fff0f2; }
	.tabs { margin-bottom: 14px; display: flex; gap: 5px; }
	.tabs button { padding: 8px 13px; border-radius: 9px; color: #747589; background: transparent; font-size: 12px; font-weight: 750; }
	.tabs button.active { color: #5d5fc5; background: #eaeafc; }
	.loading { min-height: 320px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #898a9d; }
	.basic-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(340px, .95fr); gap: 18px; }
	.settings-card, .preview-card, .list-card { padding: 22px; border: 1px solid #e5e6ee; border-radius: 18px; background: rgba(255,255,255,.9); box-shadow: 0 12px 34px rgba(41,42,82,.05); }
	.settings-card { display: grid; gap: 14px; }
	.settings-card h3 { margin: 7px 0 0; padding-bottom: 8px; border-bottom: 1px solid #eeeef3; font-size: 15px; }
	.settings-card h3:first-child { margin-top: 0; }
	label > span { display: block; margin-bottom: 6px; color: #55566b; font-size: 12px; font-weight: 750; }
	input, select, textarea { width: 100%; border: 1px solid #dedfe9; border-radius: 9px; outline: none; color: #2b2c43; background: white; }
	input, select { height: 41px; padding: 0 11px; }
	textarea { min-height: 76px; padding: 10px 11px; resize: vertical; }
	input:focus, select:focus, textarea:focus { border-color: #7779d6; box-shadow: 0 0 0 3px rgba(119,121,214,.1); }
	.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.hue-control { display: grid; grid-template-columns: 1fr 24px 35px; align-items: center; gap: 9px; }
	.hue-control input { height: auto; padding: 0; }
	.hue-control i { width: 23px; height: 23px; border-radius: 50%; background: hsl(var(--preview-hue), 62%, 58%); }
	.hue-control b { color: #77788c; font-size: 11px; }
	.social-row { display: grid; grid-template-columns: 120px 1fr 38px; gap: 7px; }
	.social-row button { display: grid; place-items: center; border-radius: 8px; color: #a34b56; background: #fff0f2; font-size: 18px; }
	.add-link { width: max-content; }
	.preview-card > p { margin: 0 0 12px; color: #77788c; font-size: 12px; font-weight: 750; }
	.site-preview { position: sticky; top: 24px; overflow: hidden; min-height: 470px; border: 1px solid #dfe0e9; border-radius: 16px; color: white; background: linear-gradient(rgba(24,25,49,.28), rgba(24,25,49,.48)), var(--preview-bg) center/cover; box-shadow: 0 18px 40px rgba(32,33,72,.16); }
	.preview-nav { padding: 15px 17px; display: flex; justify-content: space-between; gap: 12px; background: rgba(20,21,45,.36); backdrop-filter: blur(12px); font-size: 11px; }
	.preview-hero { min-height: 255px; padding: 45px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
	.preview-hero img { width: 62px; height: 62px; object-fit: cover; border: 3px solid rgba(255,255,255,.8); border-radius: 50%; background: white; }
	.preview-hero h3 { margin: 12px 0 5px; font-size: 24px; text-shadow: 0 2px 8px rgba(0,0,0,.3); }
	.preview-hero p { margin: 0; font-size: 12px; }
	.preview-body { margin: 0 14px 14px; padding: 17px; display: grid; gap: 5px; border-radius: 13px; color: #38394e; background: rgba(255,255,255,.9); }
	.preview-body span { color: #808195; font-size: 11px; }
	.preview-body div { margin-top: 12px; display: grid; grid-template-columns: 1fr .7fr .85fr; gap: 7px; }
	.preview-body i { height: 28px; border-radius: 7px; background: hsl(var(--preview-hue), 45%, 92%); }
	.list-heading { margin-bottom: 8px; }
	.list-heading h3 { margin: 0; font-size: 16px; }
	.list-heading p { margin: 5px 0 0; color: #8a8b9c; font-size: 12px; }
	.nav-row, .module-row { min-height: 62px; display: grid; align-items: center; gap: 12px; border-top: 1px solid #eeeef3; }
	.nav-row { grid-template-columns: 28px minmax(130px, 220px) 1fr auto; }
	.module-row { grid-template-columns: 28px 1fr auto; cursor: grab; }
	.module-row:active { cursor: grabbing; }
	.drag { display: grid; place-items: center; color: #aaaaba; font-size: 21px; }
	.nav-row code { color: #9293a3; font-size: 11px; }
	.module-row strong, .module-row span { display: block; }
	.module-row strong { font-size: 13px; }
	.module-row span { margin-top: 3px; color: #9a9baa; font-size: 10px; }
	.switch { position: relative; width: 40px; height: 23px; padding: 2px; border-radius: 999px; background: #d7d8e2; }
	.switch span { display: block; width: 19px; height: 19px; border-radius: 50%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,.16); transition: 160ms ease; }
	.switch.on { background: #6668d2; }
	.switch.on span { transform: translateX(17px); }
	.tip { margin: 15px 0 0; padding: 11px 12px; display: flex; align-items: center; gap: 7px; border-radius: 9px; color: #7b704c; background: #fff9df; font-size: 11px; }
	@media (max-width: 960px) { .basic-grid { grid-template-columns: 1fr; } .site-preview { position: static; min-height: 400px; } }
	@media (max-width: 720px) { .section-head { align-items: flex-start; flex-direction: column; } .head-actions { width: 100%; } .head-actions button { flex: 1; justify-content: center; } .two-cols { grid-template-columns: 1fr; } .social-row { grid-template-columns: 1fr 38px; } .social-row input:first-child { grid-column: 1 / -1; } .nav-row { grid-template-columns: 22px 1fr auto; padding: 8px 0; } .nav-row code { display: none; } }
</style>
