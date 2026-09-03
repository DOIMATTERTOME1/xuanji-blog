<script lang="ts">
	import Icon from "@iconify/svelte";
	import { marked } from "marked";
	import sanitizeHtml from "sanitize-html";

	type Entry = {
		id: string;
		kind: "technical" | "study" | "diary";
		title: string;
		slug: string;
		summary: string;
		body: string;
		cover_url: string | null;
		category: string;
		tags: string[];
		status: "draft" | "published" | "archived";
		pinned: boolean;
		published_at: string | null;
		updated_at: string;
	};

	type EditorState = Omit<Entry, "id" | "updated_at"> & { id?: string };

	let entries: Entry[] = [];
	let loading = true;
	let saving = false;
	let uploadingImage = false;
	let message = "";
	let error = "";
	let showEditor = false;
	let showPreview = false;
	let filter: "all" | Entry["kind"] = "all";
	let editor: EditorState = emptyEditor("technical");
	let bodyElement: HTMLTextAreaElement;

	const kindLabels = { technical: "技术文章", study: "学习记录", diary: "日记随笔" } as const;
	const statusLabels = { draft: "草稿", published: "已发布", archived: "已下架" } as const;

	$: visibleEntries = filter === "all" ? entries : entries.filter((entry) => entry.kind === filter);
	$: previewHtml = sanitizeHtml(marked.parse(editor.body || "还没有填写正文。") as string, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
		allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src", "alt", "title", "loading"] },
	});

	function emptyEditor(kind: Entry["kind"]): EditorState {
		return {
			kind,
			title: "",
			slug: "",
			summary: "",
			body: "",
			cover_url: null,
			category: kind === "diary" ? "日记" : kind === "study" ? "学习记录" : "技术文章",
			tags: [],
			status: "draft",
			pinned: false,
			published_at: null,
		};
	}

	function makeSlug(kind: Entry["kind"]) {
		const now = new Date();
		const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0"), String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0")].join("");
		return `${kind}-${stamp}`;
	}

	async function loadEntries() {
		loading = true;
		error = "";
		try {
			const response = await fetch("/api/admin/content/", { headers: { Accept: "application/json" } });
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "读取内容失败");
			entries = result.entries;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "读取内容失败";
		} finally {
			loading = false;
		}
	}

	function startNew(kind: Entry["kind"]) {
		editor = emptyEditor(kind);
		showPreview = false;
		showEditor = true;
		message = "";
		error = "";
	}

	function startEdit(entry: Entry) {
		editor = { ...entry };
		showPreview = false;
		showEditor = true;
		message = "";
		error = "";
	}

	function insertFormatting(before: string, after = "", placeholder = "在这里填写") {
		if (!bodyElement) return;
		const start = bodyElement.selectionStart;
		const end = bodyElement.selectionEnd;
		const selected = editor.body.slice(start, end) || placeholder;
		editor.body = `${editor.body.slice(0, start)}${before}${selected}${after}${editor.body.slice(end)}`;
		requestAnimationFrame(() => {
			bodyElement.focus();
			bodyElement.setSelectionRange(start + before.length, start + before.length + selected.length);
		});
	}

	async function uploadEditorImage(event: Event, target: "cover" | "body") {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadingImage = true;
		error = "";
		const form = new FormData();
		form.set("file", file);
		form.set("altText", editor.title || "文章图片");
		try {
			const response = await fetch("/api/admin/media/", { method: "POST", body: form });
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "图片上传失败");
			if (!result.asset.public_url) { message = "本地预览已接收图片；连接正式图片空间后会自动取得地址。"; return; }
			if (target === "cover") editor.cover_url = result.asset.public_url;
			else editor.body += `\n![${editor.title || "文章图片"}](${result.asset.public_url})\n`;
			message = target === "cover" ? "封面已经上传并填写。" : "图片已经插入正文末尾。";
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "图片上传失败";
		} finally {
			uploadingImage = false;
			input.value = "";
		}
	}

	async function save(status: Entry["status"]) {
		if (!editor.title.trim()) {
			error = "请先填写标题。";
			return;
		}
		if (!editor.body.trim()) {
			error = "请先填写正文。";
			return;
		}
		saving = true;
		error = "";
		message = "";
		const payload = {
			...editor,
			title: editor.title.trim(),
			slug: editor.slug || makeSlug(editor.kind),
			status,
			published_at: status === "published" ? editor.published_at || new Date().toISOString() : editor.published_at,
		};
		try {
			const url = editor.id ? `/api/admin/content/${editor.id}/` : "/api/admin/content/";
			const response = await fetch(url, {
				method: editor.id ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "保存失败");
			const saved = result.entry as Entry;
			entries = editor.id ? entries.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...entries];
			editor = { ...saved };
			message = status === "published" ? "已经发布。" : "草稿已经保存。";
			showEditor = false;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "保存失败";
		} finally {
			saving = false;
		}
	}

	async function archive(entry: Entry) {
		if (!confirm(`确定要下架“${entry.title}”吗？内容会保留在后台。`)) return;
		const response = await fetch(`/api/admin/content/${entry.id}/`, { method: "DELETE" });
		const result = await response.json();
		if (!response.ok) {
			error = result.error || "下架失败";
			return;
		}
		entries = entries.map((item) => (item.id === entry.id ? { ...item, status: "archived" } : item));
		message = "内容已经下架，可以随时重新编辑发布。";
	}

	async function restorePrevious(entry: Entry) {
		const response = await fetch(`/api/admin/content/${entry.id}/revisions/`);
		const result = await response.json();
		if (!response.ok) { error = result.error || "读取历史版本失败"; return; }
		const revision = result.revisions?.[0];
		if (!revision) { message = "这篇内容还没有可恢复的旧版本。"; return; }
		if (!confirm(`确定把“${entry.title}”恢复到上一次保存前的版本吗？当前版本也会保留。`)) return;
		const restoreResponse = await fetch(`/api/admin/content/${entry.id}/revisions/`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ revisionId: revision.id }),
		});
		const restored = await restoreResponse.json();
		if (!restoreResponse.ok) { error = restored.error || "恢复失败"; return; }
		if (restored.entry) entries = entries.map((item) => item.id === entry.id ? restored.entry : item);
		message = "已经恢复到上一个版本。";
	}

	async function removePermanently(entry: Entry) {
		if (!confirm(`永久删除“${entry.title}”后无法找回。确定继续吗？`)) return;
		const response = await fetch(`/api/admin/content/${entry.id}/?permanent=true`, { method: "DELETE" });
		const result = await response.json();
		if (!response.ok) { error = result.error || "删除失败"; return; }
		entries = entries.filter((item) => item.id !== entry.id);
		message = "内容已经永久删除。";
	}

	loadEntries();
</script>

<section class="content-manager">
	<div class="section-head">
		<div>
			<p>写作与发布</p>
			<h2>我的内容</h2>
			<span>文章、学习记录和日记都在这里管理。</span>
		</div>
		<div class="new-actions">
			<button type="button" onclick={() => startNew("technical")}><Icon icon="material-symbols:add-rounded" /> 技术文章</button>
			<button type="button" onclick={() => startNew("study")}><Icon icon="material-symbols:add-rounded" /> 学习记录</button>
			<button class="primary" type="button" onclick={() => startNew("diary")}><Icon icon="material-symbols:add-rounded" /> 写日记</button>
		</div>
	</div>

	{#if message}<p class="notice success">{message}</p>{/if}
	{#if error}<p class="notice error">{error}</p>{/if}

	<div class="filter-row" role="group" aria-label="内容类型">
		{#each [["all", "全部"], ["technical", "技术文章"], ["study", "学习记录"], ["diary", "日记随笔"]] as option}
			<button type="button" class:active={filter === option[0]} onclick={() => (filter = option[0] as typeof filter)}>{option[1]}</button>
		{/each}
	</div>

	<div class="content-panel">
		{#if loading}
			<div class="empty"><Icon icon="material-symbols:progress-activity" /><span>正在读取内容…</span></div>
		{:else if visibleEntries.length === 0}
			<div class="empty"><Icon icon="material-symbols:edit-note-outline-rounded" /><strong>这里还没有内容</strong><span>点击上面的按钮开始记录。</span></div>
		{:else}
			<div class="entry-list">
				{#each visibleEntries as entry}
					<article>
						<div class={`kind ${entry.kind}`}>{kindLabels[entry.kind]}</div>
						<div class="entry-copy">
							<h3>{entry.title}</h3>
							<p>{entry.summary || "暂时没有内容简介"}</p>
							<div><span class={`state ${entry.status}`}>{statusLabels[entry.status]}</span><span>{new Date(entry.updated_at).toLocaleString("zh-CN")}</span></div>
						</div>
						<div class="entry-actions">
							<button type="button" onclick={() => startEdit(entry)}><Icon icon="material-symbols:edit-outline-rounded" /> 编辑</button>
							<button class="quiet" type="button" onclick={() => restorePrevious(entry)}>恢复旧版</button>
							{#if entry.status !== "archived"}<button class="quiet" type="button" onclick={() => archive(entry)}>下架</button>{/if}
							{#if entry.status === "archived"}<button class="danger" type="button" onclick={() => removePermanently(entry)}>永久删除</button>{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#if showEditor}
	<div class="editor-backdrop" role="presentation">
		<section class="editor-dialog" role="dialog" aria-modal="true" aria-label="内容编辑器">
			<header>
				<div><span>{kindLabels[editor.kind]}</span><h2>{editor.id ? "修改内容" : "新建内容"}</h2></div>
				<button type="button" aria-label="关闭编辑器" onclick={() => (showEditor = false)}><Icon icon="material-symbols:close-rounded" /></button>
			</header>

			<div class="editor-body">
				<div class="form-column">
					<label><span>标题</span><input bind:value={editor.title} maxlength="120" placeholder="例如：今天的实验记录" /></label>
					<div class="two-cols">
						<label><span>内容类型</span><select bind:value={editor.kind}><option value="technical">技术文章</option><option value="study">学习记录</option><option value="diary">日记随笔</option></select></label>
						<label><span>分类</span><input bind:value={editor.category} maxlength="80" placeholder="例如：电力电子" /></label>
					</div>
					<label><span>内容简介</span><textarea class="summary" bind:value={editor.summary} maxlength="320" placeholder="用一两句话介绍这篇内容"></textarea></label>
					<label><span>标签（用逗号分开）</span><input value={editor.tags.join("，")} oninput={(event) => (editor.tags = event.currentTarget.value.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 20))} placeholder="例如：LLC，仿真，学习" /></label>
					<label><span>封面图片</span><div class="image-field"><input value={editor.cover_url ?? ""} oninput={(event) => (editor.cover_url = event.currentTarget.value || null)} placeholder="可以粘贴图片地址" /><label class="upload-button">{uploadingImage ? "上传中…" : "选择图片"}<input type="file" accept="image/*" onchange={(event) => uploadEditorImage(event, "cover")} /></label></div></label>
					<div class="body-label"><span>正文</span><button type="button" onclick={() => (showPreview = !showPreview)}><Icon icon="material-symbols:visibility-outline-rounded" /> {showPreview ? "继续编辑" : "预览效果"}</button></div>
					{#if !showPreview}
						<div class="toolbar" aria-label="文字格式">
							<button type="button" onclick={() => insertFormatting("## ", "", "小标题")}>小标题</button>
							<button type="button" onclick={() => insertFormatting("**", "**", "需要加粗的文字")}>加粗</button>
							<button type="button" onclick={() => insertFormatting("- ", "", "列表内容")}>列表</button>
							<button type="button" onclick={() => insertFormatting("![图片说明](", ")", "图片地址")}>插入图片</button>
							<label class="toolbar-upload">{uploadingImage ? "上传中…" : "上传正文图片"}<input type="file" accept="image/*" onchange={(event) => uploadEditorImage(event, "body")} /></label>
						</div>
						<textarea class="body-input" bind:this={bodyElement} bind:value={editor.body} placeholder="从这里开始写正文……"></textarea>
					{:else}
						<div class="article-preview">{@html previewHtml}</div>
					{/if}
				</div>
			</div>

			<footer>
				<span>{editor.body.length} 个字符</span>
				<div><button type="button" onclick={() => (showEditor = false)}>取消</button><button type="button" disabled={saving} onclick={() => save("draft")}>保存草稿</button><button class="primary" type="button" disabled={saving} onclick={() => save("published")}>{saving ? "正在保存…" : "确认发布"}</button></div>
			</footer>
		</section>
	</div>
{/if}

<style>
	.content-manager { max-width: 1320px; margin: 0 auto; }
	.section-head { margin-bottom: 20px; display: flex; align-items: flex-end; justify-content: space-between; gap: 22px; }
	.section-head p { margin: 0 0 5px; color: #7779d5; font-size: 12px; font-weight: 800; }
	.section-head h2 { margin: 0; font-size: 27px; }
	.section-head span { display: block; margin-top: 7px; color: #85869a; font-size: 13px; }
	.new-actions { display: flex; flex-wrap: wrap; gap: 8px; }
	button { border: 0; cursor: pointer; }
	.new-actions button, .entry-actions button { padding: 9px 12px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid #dedfeb; border-radius: 10px; color: #52536a; background: white; font-size: 12px; font-weight: 750; }
	.new-actions .primary, footer .primary { border-color: transparent; color: white; background: #5f61d1; }
	.notice { margin: 0 0 14px; padding: 11px 14px; border-radius: 10px; font-size: 12px; }
	.notice.success { color: #3c7853; background: #eaf7ee; }
	.notice.error { color: #a64350; background: #fff0f2; }
	.filter-row { margin-bottom: 12px; display: flex; gap: 5px; }
	.filter-row button { padding: 8px 12px; border-radius: 9px; color: #77788d; background: transparent; font-size: 12px; font-weight: 700; }
	.filter-row button.active { color: #5d5fc5; background: #eaeaFC; }
	.content-panel { min-height: 330px; border: 1px solid #e5e6ee; border-radius: 18px; background: rgba(255,255,255,.9); box-shadow: 0 12px 34px rgba(41,42,82,.05); }
	.entry-list { padding: 8px 20px; }
	.entry-list article { padding: 17px 0; display: grid; grid-template-columns: 86px 1fr auto; align-items: center; gap: 16px; border-bottom: 1px solid #efeff4; }
	.entry-list article:last-child { border-bottom: 0; }
	.kind { width: 82px; height: 68px; display: grid; place-items: center; border-radius: 13px; font-size: 11px; font-weight: 800; }
	.kind.technical { color: #5f61c7; background: #ececff; }
	.kind.study { color: #2f8c68; background: #e8f7f0; }
	.kind.diary { color: #b46c3f; background: #fff0e5; }
	.entry-copy h3 { margin: 0; font-size: 15px; }
	.entry-copy p { overflow: hidden; margin: 6px 0; max-width: 680px; color: #85869a; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }
	.entry-copy div { display: flex; align-items: center; gap: 9px; color: #a0a1b0; font-size: 10px; }
	.state { padding: 3px 6px; border-radius: 6px; }
	.state.published { color: #40815a; background: #e8f5ec; }
	.state.draft { color: #8b732f; background: #fff6dc; }
	.state.archived { color: #77788b; background: #ececf1; }
	.entry-actions { display: flex; gap: 6px; }
	.entry-actions .quiet { color: #9798a8; background: transparent; }
	.entry-actions .danger { color: #a83f4b; background: #fff0f2; }
	.empty { min-height: 330px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #9293a6; }
	.empty :global(svg) { color: #7779d5; font-size: 40px; }
	.empty strong { color: #535469; }
	.editor-backdrop { position: fixed; z-index: 50; inset: 0; padding: 22px; display: grid; place-items: center; background: rgba(25,26,53,.46); backdrop-filter: blur(6px); }
	.editor-dialog { overflow: hidden; width: min(100%, 1040px); height: min(92vh, 880px); display: grid; grid-template-rows: auto 1fr auto; border-radius: 20px; background: #fbfbfd; box-shadow: 0 36px 100px rgba(15,16,45,.32); }
	.editor-dialog > header { padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e7e7ee; background: white; }
	.editor-dialog header span { color: #6c6ecb; font-size: 11px; font-weight: 800; }
	.editor-dialog header h2 { margin: 3px 0 0; font-size: 20px; }
	.editor-dialog header button { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 9px; color: #6d6e82; background: #f2f2f6; font-size: 22px; }
	.editor-body { overflow: auto; padding: 22px; }
	.form-column { display: grid; gap: 15px; }
	.form-column label > span, .body-label > span { display: block; margin-bottom: 6px; color: #55566b; font-size: 12px; font-weight: 750; }
	input, select, textarea { width: 100%; border: 1px solid #dedfe9; border-radius: 10px; outline: none; color: #292a43; background: white; }
	input, select { height: 43px; padding: 0 12px; }
	textarea { padding: 11px 12px; resize: vertical; }
	input:focus, select:focus, textarea:focus { border-color: #7779d6; box-shadow: 0 0 0 3px rgba(119,121,214,.1); }
	.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
	.summary { min-height: 70px; }
	.body-label { display: flex; align-items: center; justify-content: space-between; }
	.body-label button { display: inline-flex; align-items: center; gap: 5px; color: #6163c9; background: transparent; font-size: 12px; font-weight: 750; }
	.toolbar { display: flex; flex-wrap: wrap; gap: 5px; margin-top: -8px; }
	.toolbar button { padding: 6px 9px; border-radius: 7px; color: #66677b; background: #ededf3; font-size: 11px; }
	.image-field { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
	.upload-button, .toolbar-upload { display: inline-flex; align-items: center; justify-content: center; padding: 0 12px; border-radius: 8px; color: #5f61c8; background: #ededff; font-size: 12px; font-weight: 750; cursor: pointer; }
	.upload-button input, .toolbar-upload input { position: absolute; width: 1px; height: 1px; opacity: 0; }
	.toolbar-upload { min-height: 31px; }
	.body-input { min-height: 320px; line-height: 1.75; }
	.article-preview { min-height: 320px; padding: 22px; border: 1px solid #e1e2eb; border-radius: 12px; background: white; line-height: 1.8; }
	.article-preview :global(img) { max-width: 100%; border-radius: 10px; }
	.editor-dialog > footer { padding: 14px 22px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e7e7ee; background: white; }
	.editor-dialog > footer > span { color: #9293a4; font-size: 11px; }
	.editor-dialog > footer div { display: flex; gap: 7px; }
	.editor-dialog > footer button { padding: 9px 14px; border: 1px solid #dfe0e9; border-radius: 9px; color: #56576c; background: white; font-size: 12px; font-weight: 750; }
	.editor-dialog > footer button:disabled { opacity: .55; cursor: wait; }
	@media (max-width: 760px) {
		.section-head { align-items: flex-start; flex-direction: column; }
		.new-actions { width: 100%; }
		.new-actions button { flex: 1; justify-content: center; }
		.entry-list article { grid-template-columns: 58px 1fr; }
		.kind { width: 58px; height: 58px; text-align: center; }
		.entry-actions { grid-column: 2; }
		.editor-backdrop { padding: 0; place-items: stretch; }
		.editor-dialog { width: 100%; height: 100vh; border-radius: 0; }
		.two-cols { grid-template-columns: 1fr; }
		.editor-dialog > footer { align-items: flex-start; gap: 8px; flex-direction: column; }
		.editor-dialog > footer div { width: 100%; }
		.editor-dialog > footer button { flex: 1; }
	}
</style>
