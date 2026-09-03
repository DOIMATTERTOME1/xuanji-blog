import type { APIRoute } from "astro";

import { json, readJsonBody, requireAdminApi } from "../../../../lib/admin/api";
import { demoContent } from "../../../../lib/cms/demo-data";
import { contentInputSchema } from "../../../../lib/cms/validation";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, params }) => {
	const auth = await requireAdminApi({ request, cookies });
	if (auth.response) return auth.response;
	const id = params.id ?? "";

	if (auth.identity.previewMode) {
		const entry = demoContent.find((item) => item.id === id);
		return entry ? json({ entry }) : json({ error: "没有找到这篇内容" }, { status: 404 });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase.from("content_entries").select("*").eq("id", id).maybeSingle();
	if (error || !data) return json({ error: "没有找到这篇内容" }, { status: 404 });
	return json({ entry: data });
};

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;
	const id = params.id ?? "";

	let input;
	try {
		input = contentInputSchema.parse(await readJsonBody(request));
	} catch {
		return json({ error: "请检查填写内容" }, { status: 400 });
	}

	if (auth.identity.previewMode) {
		return json({ entry: { ...demoContent[0], ...input, id, updated_at: new Date().toISOString() }, preview: true });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data: current } = await supabase.from("content_entries").select("*").eq("id", id).maybeSingle();
	if (!current) return json({ error: "没有找到这篇内容" }, { status: 404 });

	await supabase.from("content_revisions").insert({
		entry_id: id,
		snapshot: current,
		created_by: auth.identity.id,
	});

	const payload = {
		...input,
		cover_url: input.cover_url || null,
		published_at:
			input.status === "published"
				? input.published_at ?? current.published_at ?? new Date().toISOString()
				: input.published_at ?? current.published_at,
		updated_at: new Date().toISOString(),
		updated_by: auth.identity.id,
	};
	const { data, error } = await supabase.from("content_entries").update(payload).eq("id", id).select("*").single();
	if (error) return json({ error: "保存修改失败" }, { status: 400 });
	return json({ entry: data });
};

export const DELETE: APIRoute = async ({ request, cookies, params, url }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;
	const id = params.id ?? "";

	if (auth.identity.previewMode) return json({ success: true, preview: true });

	const supabase = createSupabaseServerClient({ request, cookies });
	const permanent = url.searchParams.get("permanent") === "true";
	if (permanent) {
		const { error } = await supabase.from("content_entries").delete().eq("id", id);
		if (error) return json({ error: "永久删除失败" }, { status: 400 });
	} else {
		const { error } = await supabase
			.from("content_entries")
			.update({ status: "archived", updated_at: new Date().toISOString(), updated_by: auth.identity.id })
			.eq("id", id);
		if (error) return json({ error: "下架失败" }, { status: 400 });
	}
	return json({ success: true });
};
