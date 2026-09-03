<script lang="ts">
	import Icon from "@iconify/svelte";

	export let kind: "project" | "anime" | "announcement";

	type Item = {
		id: string;
		kind: typeof kind;
		title: string;
		data: Record<string, unknown>;
		status: "draft" | "published" | "archived";
		sort_order: number;
		updated_at: string;
	};

	const labels = {
		project: { title: "项目管理", singular: "项目", empty: "还没有项目记录" },
		anime: { title: "追番管理", singular: "动画", empty: "还没有追番记录" },
		announcement: { title: "公告管理", singular: "公告", empty: "还没有公告" },
	};

	let items: Item[] = [];
	let loading = true;
	let saving = false;
	let showForm = false;
	let editingId = "";
	let title = "";
	let status: Item["status"] = "draft";
	let description = "";
	let cover = "";
	let progress = 0;
	let total = 12;
	let rating = 0;
	let link = "";
	let extra = "";
	let bangumiId = "";
	let message = "";
	let error = "";

	async function loadItems() {
		loading = true;
		try {
			const response = await fetch(`/api/admin/items/?kind=${kind}`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "读取失败");
			items = result.items;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "读取失败";
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		editingId = "";
		title = "";
		status = "draft";
		description = "";
		cover = "";
		progress = 0;
		total = 12;
		rating = 0;
		link = "";
		extra = "";
		bangumiId = "";
	}

	function startNew() {
		resetForm();
		showForm = true;
		message = "";
		error = "";
	}

	function startEdit(item: Item) {
		editingId = item.id;
		title = item.title;
		status = item.status;
		description = String(item.data.description ?? "");
		cover = String(item.data.cover ?? item.data.image ?? "");
		progress = Number(item.data.progress ?? 0);
		total = Number(item.data.totalEpisodes ?? 12);
		rating = Number(item.data.rating ?? 0);
		link = String(item.data.link ?? item.data.visitUrl ?? "");
		extra = Array.isArray(item.data.techStack) ? item.data.techStack.join("，") : String(item.data.location ?? "");
		bangumiId = String(item.data.bangumiSubjectId ?? "");
		showForm = true;
	}

	function makeData() {
		if (kind === "anime") return { description, cover, progress, totalEpisodes: total, rating, link, watchStatus: extra || "watching", source: "manual", bangumiSubjectId: bangumiId };
		if (kind === "project") return { description, image: cover, visitUrl: link, techStack: extra.split(/[，,]/).map((value) => value.trim()).filter(Boolean) };
		return { description, link };
	}

	async function save(publish: boolean) {
		if (!title.trim()) { error = `请填写${labels[kind].singular}名称。`; return; }
		saving = true;
		error = "";
		try {
			const payload = { kind, title: title.trim(), data: makeData(), status: publish ? "published" : status, sort_order: editingId ? items.findIndex((item) => item.id === editingId) : items.length };
			const response = await fetch(editingId ? `/api/admin/items/${editingId}/` : "/api/admin/items/", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "保存失败");
			const saved = result.item as Item;
			items = editingId ? items.map((item) => item.id === editingId ? saved : item) : [...items, saved];
			showForm = false;
			message = publish ? `${labels[kind].singular}已经发布。` : "草稿已经保存。";
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "保存失败";
		} finally {
			saving = false;
		}
	}

	async function archive(item: Item) {
		if (!confirm(`确定下架“${item.title}”吗？`)) return;
		const response = await fetch(`/api/admin/items/${item.id}/`, { method: "DELETE" });
		const result = await response.json();
		if (!response.ok) { error = result.error || "下架失败"; return; }
		items = items.map((value) => value.id === item.id ? { ...value, status: "archived" } : value);
		message = "已经下架，记录仍保留在后台。";
	}

	loadItems();
</script>

<section class="manager">
	<div class="section-head"><div><p>内容模块</p><h2>{labels[kind].title}</h2><span>可以添加、修改、发布或下架。</span></div><button class="primary" type="button" onclick={startNew}><Icon icon="material-symbols:add-rounded" /> 新建{labels[kind].singular}</button></div>
	{#if message}<p class="notice success">{message}</p>{/if}
	{#if error}<p class="notice error">{error}</p>{/if}
	<div class="list-card">
		{#if loading}
			<div class="empty"><Icon icon="material-symbols:progress-activity" /> 正在读取…</div>
		{:else if items.length === 0}
			<div class="empty"><Icon icon={kind === "anime" ? "material-symbols:movie-outline-rounded" : "material-symbols:inventory-2-outline-rounded"} /><strong>{labels[kind].empty}</strong><span>点击右上角按钮开始添加。</span></div>
		{:else}
			{#each items as item}
				<article><div class="item-icon"><Icon icon={kind === "anime" ? "material-symbols:movie-outline-rounded" : kind === "project" ? "material-symbols:work-outline-rounded" : "material-symbols:campaign-outline-rounded"} /></div><div><h3>{item.title}</h3><p>{String(item.data.description ?? "暂时没有说明")}</p><span class:published={item.status === "published"}>{item.status === "published" ? "已发布" : item.status === "draft" ? "草稿" : "已下架"}</span></div><div class="actions"><button type="button" onclick={() => startEdit(item)}>编辑</button>{#if item.status !== "archived"}<button class="quiet" type="button" onclick={() => archive(item)}>下架</button>{/if}</div></article>
			{/each}
		{/if}
	</div>
</section>

{#if showForm}
	<div class="backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-label={`编辑${labels[kind].singular}`}><header><div><span>{editingId ? "修改" : "新建"}</span><h2>{labels[kind].singular}</h2></div><button type="button" aria-label="关闭" onclick={() => (showForm = false)}><Icon icon="material-symbols:close-rounded" /></button></header><div class="form-body">
		<label><span>{labels[kind].singular}名称</span><input bind:value={title} maxlength="120" /></label>
		<label><span>介绍</span><textarea bind:value={description} maxlength="1000"></textarea></label>
		{#if kind !== "announcement"}<label><span>封面图片地址</span><input bind:value={cover} placeholder="可以稍后从图片管理中选择" /></label>{/if}
		{#if kind === "anime"}<div class="sync-note"><strong>Bangumi 同步（已预留）</strong><span>现在先手动管理；以后填写条目编号即可接入自动同步。</span></div><label><span>Bangumi 条目编号（可不填）</span><input bind:value={bangumiId} placeholder="例如：326" /></label><div class="three-cols"><label><span>已看到</span><input type="number" min="0" bind:value={progress} /></label><label><span>总集数</span><input type="number" min="1" bind:value={total} /></label><label><span>评分</span><input type="number" min="0" max="10" step="0.1" bind:value={rating} /></label></div><label><span>观看状态</span><select bind:value={extra}><option value="watching">正在看</option><option value="planned">想看</option><option value="completed">已看完</option><option value="on-hold">暂停</option></select></label>{/if}
		{#if kind === "project"}<label><span>使用的工具（用逗号分开）</span><input bind:value={extra} placeholder="MATLAB，Simulink，KiCad" /></label>{/if}
		<label><span>相关链接（可不填）</span><input bind:value={link} placeholder="https://…" /></label>
	</div><footer><button type="button" onclick={() => (showForm = false)}>取消</button><button type="button" disabled={saving} onclick={() => save(false)}>保存草稿</button><button class="primary" type="button" disabled={saving} onclick={() => save(true)}>{saving ? "正在保存…" : "确认发布"}</button></footer></section></div>
{/if}

<style>
	.manager { max-width: 1320px; margin: 0 auto; }
	.section-head { margin-bottom: 18px; display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; }
	.section-head p { margin: 0 0 5px; color: #7779d5; font-size: 12px; font-weight: 800; }
	.section-head h2 { margin: 0; font-size: 27px; }
	.section-head span { display: block; margin-top: 7px; color: #85869a; font-size: 13px; }
	button { border: 0; cursor: pointer; }
	.primary { padding: 10px 14px; display: inline-flex; align-items: center; gap: 5px; border-radius: 10px; color: white; background: #5f61d1; font-size: 12px; font-weight: 800; }
	.notice { margin: 0 0 13px; padding: 11px 14px; border-radius: 10px; font-size: 12px; }
	.notice.success { color: #3c7853; background: #eaf7ee; }
	.notice.error { color: #a64350; background: #fff0f2; }
	.list-card { min-height: 350px; padding: 8px 20px; border: 1px solid #e5e6ee; border-radius: 18px; background: rgba(255,255,255,.9); box-shadow: 0 12px 34px rgba(41,42,82,.05); }
	article { padding: 17px 0; display: grid; grid-template-columns: 54px 1fr auto; align-items: center; gap: 14px; border-bottom: 1px solid #efeff4; }
	article:last-child { border-bottom: 0; }
	.item-icon { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 13px; color: #6264c9; background: #ededff; font-size: 24px; }
	article h3 { margin: 0; font-size: 14px; }
	article p { margin: 5px 0; color: #85869a; font-size: 12px; }
	article div > span { padding: 3px 6px; border-radius: 6px; color: #7f8091; background: #eeeef2; font-size: 10px; }
	article div > span.published { color: #3e8157; background: #e7f5ec; }
	.actions { display: flex; gap: 5px; }
	.actions button { padding: 8px 10px; border: 1px solid #e0e1e9; border-radius: 8px; color: #626379; background: white; font-size: 11px; font-weight: 700; }
	.actions .quiet { border-color: transparent; color: #999aaa; background: transparent; }
	.empty { min-height: 330px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #9394a6; }
	.empty :global(svg) { color: #7779d5; font-size: 40px; }
	.empty strong { color: #54556a; }
	.backdrop { position: fixed; z-index: 50; inset: 0; padding: 20px; display: grid; place-items: center; background: rgba(25,26,53,.46); backdrop-filter: blur(6px); }
	.dialog { overflow: hidden; width: min(100%, 680px); max-height: 92vh; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; border-radius: 19px; background: #fbfbfd; box-shadow: 0 35px 100px rgba(15,16,45,.3); }
	.dialog header { padding: 17px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e7e7ee; background: white; }
	.dialog header span { color: #6c6ecb; font-size: 11px; font-weight: 800; }
	.dialog header h2 { margin: 2px 0 0; font-size: 20px; }
	.dialog header button { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; color: #6d6e82; background: #f1f1f5; font-size: 21px; }
	.form-body { overflow: auto; padding: 20px; display: grid; gap: 14px; }
	label span { display: block; margin-bottom: 6px; color: #55566b; font-size: 12px; font-weight: 750; }
	input, select, textarea { width: 100%; border: 1px solid #dedfe9; border-radius: 9px; outline: none; color: #2b2c43; background: white; }
	input, select { height: 42px; padding: 0 11px; }
	textarea { min-height: 100px; padding: 10px 11px; resize: vertical; }
	input:focus, select:focus, textarea:focus { border-color: #7779d6; box-shadow: 0 0 0 3px rgba(119,121,214,.1); }
	.three-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
	.sync-note { padding: 12px; border-radius: 10px; color: #5d5f85; background: #eeeefe; }
	.sync-note strong, .sync-note span { display: block; }
	.sync-note span { margin-top: 4px; color: #80819a; font-size: 12px; }
	.dialog footer { padding: 14px 20px; display: flex; justify-content: flex-end; gap: 7px; border-top: 1px solid #e7e7ee; background: white; }
	.dialog footer button { padding: 9px 13px; border: 1px solid #dfe0e9; border-radius: 9px; color: #57586d; background: white; font-size: 12px; font-weight: 750; }
	.dialog footer .primary { border-color: transparent; color: white; background: #5f61d1; }
	@media (max-width: 700px) { .section-head { align-items: flex-start; flex-direction: column; } article { grid-template-columns: 50px 1fr; } .actions { grid-column: 2; } .three-cols { grid-template-columns: 1fr; } .backdrop { padding: 0; } .dialog { width: 100%; height: 100vh; max-height: none; border-radius: 0; } }
</style>
