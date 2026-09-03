<script lang="ts">
	import Icon from "@iconify/svelte";

	type Asset = { id: string; file_name: string; public_url: string; alt_text: string; file_size?: number; created_at?: string };
	let assets: Asset[] = [];
	let file: File | null = null;
	let altText = "";
	let previewUrl = "";
	let loading = true;
	let uploading = false;
	let message = "";
	let error = "";

	async function loadAssets() {
		try {
			const response = await fetch("/api/admin/media/");
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "读取图片失败");
			assets = result.assets;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "读取图片失败";
		} finally {
			loading = false;
		}
	}

	function chooseFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		file = input.files?.[0] ?? null;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = file ? URL.createObjectURL(file) : "";
		message = "";
		error = "";
	}

	async function upload() {
		if (!file) { error = "请先选择一张图片。"; return; }
		uploading = true;
		error = "";
		const form = new FormData();
		form.set("file", file);
		form.set("altText", altText);
		try {
			const response = await fetch("/api/admin/media/", { method: "POST", body: form });
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "上传失败");
			assets = [result.asset, ...assets];
			message = result.preview ? "本地预览已确认图片，连接后台后会正式上传。" : "图片已经上传，可以在文章中使用。";
			file = null;
			altText = "";
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = "";
		} catch (cause) {
			error = cause instanceof Error ? cause.message : "上传失败";
		} finally {
			uploading = false;
		}
	}

	async function copyUrl(url: string) {
		if (!url) { message = "本地预览图片还没有公开地址。"; return; }
		await navigator.clipboard.writeText(url);
		message = "图片地址已经复制。";
	}

	loadAssets();
</script>

<section class="media-manager">
	<div class="section-head"><div><p>图片空间</p><h2>图片管理</h2><span>上传头像、背景、封面和文章插图。</span></div></div>
	{#if message}<p class="notice success">{message}</p>{/if}
	{#if error}<p class="notice error">{error}</p>{/if}
	<div class="media-grid">
		<section class="upload-card">
			<h3>上传新图片</h3>
			<label class="drop-zone">
				<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" onchange={chooseFile} />
				{#if previewUrl}<img src={previewUrl} alt="待上传图片预览" />{:else}<Icon icon="material-symbols:add-photo-alternate-outline-rounded" /><strong>点击选择图片</strong><span>支持 JPG、PNG、WebP、GIF、SVG，最大 10MB</span>{/if}
			</label>
			<label class="alt-label"><span>图片说明（方便以后查找）</span><input bind:value={altText} maxlength="200" placeholder="例如：LLC实验波形" /></label>
			<button class="primary" type="button" disabled={uploading || !file} onclick={upload}>{uploading ? "正在上传…" : "上传图片"}</button>
		</section>

		<section class="library-card">
			<div class="library-head"><h3>已上传图片</h3><span>{assets.length} 张</span></div>
			{#if loading}<div class="empty"><Icon icon="material-symbols:progress-activity" /> 正在读取…</div>{:else if assets.length === 0}<div class="empty"><Icon icon="material-symbols:imagesmode-outline-rounded" /><strong>还没有上传图片</strong><span>上传后会显示在这里。</span></div>{:else}<div class="asset-grid">{#each assets as asset}<article>{#if asset.public_url}<img src={asset.public_url} alt={asset.alt_text || asset.file_name} />{:else}<div class="file-placeholder"><Icon icon="material-symbols:image-outline-rounded" /></div>{/if}<div><strong>{asset.alt_text || asset.file_name}</strong><span>{asset.file_name}</span><button type="button" onclick={() => copyUrl(asset.public_url)}><Icon icon="material-symbols:content-copy-outline-rounded" /> 复制地址</button></div></article>{/each}</div>{/if}
		</section>
	</div>
</section>

<style>
	.media-manager { max-width: 1320px; margin: 0 auto; }
	.section-head { margin-bottom: 18px; }
	.section-head p { margin: 0 0 5px; color: #7779d5; font-size: 12px; font-weight: 800; }
	.section-head h2 { margin: 0; font-size: 27px; }
	.section-head span { display: block; margin-top: 7px; color: #85869a; font-size: 13px; }
	.notice { margin: 0 0 13px; padding: 11px 14px; border-radius: 10px; font-size: 12px; }
	.notice.success { color: #3c7853; background: #eaf7ee; }
	.notice.error { color: #a64350; background: #fff0f2; }
	.media-grid { display: grid; grid-template-columns: minmax(300px, .72fr) minmax(0, 1.28fr); gap: 18px; }
	.upload-card, .library-card { padding: 22px; border: 1px solid #e5e6ee; border-radius: 18px; background: rgba(255,255,255,.9); box-shadow: 0 12px 34px rgba(41,42,82,.05); }
	h3 { margin: 0 0 16px; font-size: 16px; }
	.drop-zone { overflow: hidden; min-height: 260px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 1.5px dashed #cacbe0; border-radius: 14px; color: #85869a; background: #fafafe; text-align: center; cursor: pointer; }
	.drop-zone:hover { border-color: #7a7cd7; background: #f7f7ff; }
	.drop-zone input { position: absolute; width: 1px; height: 1px; opacity: 0; }
	.drop-zone :global(svg) { color: #7476d4; font-size: 43px; }
	.drop-zone strong { color: #56576b; font-size: 13px; }
	.drop-zone span { font-size: 10px; }
	.drop-zone img { max-width: 100%; max-height: 230px; object-fit: contain; border-radius: 10px; }
	.alt-label { display: block; margin-top: 14px; }
	.alt-label span { display: block; margin-bottom: 6px; color: #55566b; font-size: 12px; font-weight: 750; }
	.alt-label input { width: 100%; height: 42px; padding: 0 11px; border: 1px solid #dedfe9; border-radius: 9px; outline: none; }
	.primary { width: 100%; height: 43px; margin-top: 12px; border: 0; border-radius: 10px; color: white; background: #5f61d1; font-size: 12px; font-weight: 800; cursor: pointer; }
	.primary:disabled { opacity: .55; cursor: not-allowed; }
	.library-head { display: flex; align-items: center; justify-content: space-between; }
	.library-head span { color: #9394a5; font-size: 11px; }
	.asset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
	.asset-grid article { overflow: hidden; border: 1px solid #e7e7ef; border-radius: 12px; background: white; }
	.asset-grid article > img, .file-placeholder { width: 100%; height: 150px; object-fit: cover; background: #f0f0f6; }
	.file-placeholder { display: grid; place-items: center; color: #898ad7; font-size: 40px; }
	.asset-grid article > div:last-child { padding: 10px; }
	.asset-grid strong, .asset-grid span { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
	.asset-grid strong { font-size: 12px; }
	.asset-grid span { margin-top: 4px; color: #999aaa; font-size: 9px; }
	.asset-grid button { margin-top: 9px; padding: 6px 8px; display: inline-flex; align-items: center; gap: 4px; border: 0; border-radius: 7px; color: #6062c7; background: #eeeefe; font-size: 10px; font-weight: 750; cursor: pointer; }
	.empty { min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #9394a6; }
	.empty :global(svg) { color: #7779d5; font-size: 39px; }
	.empty strong { color: #55566a; }
	@media (max-width: 900px) { .media-grid { grid-template-columns: 1fr; } }
	@media (max-width: 560px) { .asset-grid { grid-template-columns: 1fr; } }
</style>
