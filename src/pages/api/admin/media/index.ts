import type { APIRoute } from "astro";

import { json, requireAdminApi } from "../../../../lib/admin/api";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

export const GET: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi({ request, cookies });
	if (auth.response) return auth.response;
	if (auth.identity.previewMode) return json({ assets: [] });

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
	if (error) return json({ error: "读取图片失败" }, { status: 500 });
	return json({ assets: data ?? [] });
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;
	const form = await request.formData();
	const file = form.get("file");
	const altText = String(form.get("altText") ?? "").trim().slice(0, 200);
	if (!(file instanceof File) || file.size === 0) return json({ error: "请选择图片" }, { status: 400 });
	if (file.size > 10 * 1024 * 1024) return json({ error: "图片不能超过 10MB" }, { status: 400 });
	if (!allowedTypes.has(file.type)) return json({ error: "仅支持 JPG、PNG、WebP、GIF 或 SVG" }, { status: 400 });

	if (auth.identity.previewMode) {
		return json({ asset: { id: crypto.randomUUID(), file_name: file.name, public_url: "", alt_text: altText }, preview: true }, { status: 201 });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
	const storagePath = `${auth.identity.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
	const { error: uploadError } = await supabase.storage.from("blog-media").upload(storagePath, file, {
		contentType: file.type,
		cacheControl: "31536000",
		upsert: false,
	});
	if (uploadError) return json({ error: "图片上传失败" }, { status: 400 });

	const { data: publicData } = supabase.storage.from("blog-media").getPublicUrl(storagePath);
	const { data, error } = await supabase.from("media_assets").insert({
		storage_path: storagePath,
		public_url: publicData.publicUrl,
		file_name: file.name,
		content_type: file.type,
		file_size: file.size,
		alt_text: altText,
		created_by: auth.identity.id,
	}).select("*").single();
	if (error) return json({ error: "图片已上传，但保存图片信息失败" }, { status: 500 });
	return json({ asset: data }, { status: 201 });
};
