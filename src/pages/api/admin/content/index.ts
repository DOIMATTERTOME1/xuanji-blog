import type { APIRoute } from "astro";

import { json, readJsonBody, requireAdminApi } from "../../../../lib/admin/api";
import { demoContent } from "../../../../lib/cms/demo-data";
import { contentInputSchema } from "../../../../lib/cms/validation";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
	const auth = await requireAdminApi({ request, cookies });
	if (auth.response) return auth.response;

	if (auth.identity.previewMode) {
		return json({ entries: demoContent });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	let query = supabase.from("content_entries").select("*").order("updated_at", { ascending: false });
	const kind = url.searchParams.get("kind");
	const status = url.searchParams.get("status");
	if (kind) query = query.eq("kind", kind);
	if (status) query = query.eq("status", status);

	const { data, error } = await query;
	if (error) return json({ error: "读取内容失败" }, { status: 500 });
	return json({ entries: data ?? [] });
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;

	let input;
	try {
		input = contentInputSchema.parse(await readJsonBody(request));
	} catch {
		return json({ error: "请检查标题、链接名称和正文内容" }, { status: 400 });
	}

	if (auth.identity.previewMode) {
		return json({
			entry: {
				...input,
				id: crypto.randomUUID(),
				cover_url: input.cover_url ?? null,
				published_at: input.status === "published" ? new Date().toISOString() : null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			preview: true,
		}, { status: 201 });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const payload = {
		...input,
		cover_url: input.cover_url || null,
		published_at:
			input.status === "published"
				? input.published_at ?? new Date().toISOString()
				: input.published_at ?? null,
		created_by: auth.identity.id,
		updated_by: auth.identity.id,
	};
	const { data, error } = await supabase.from("content_entries").insert(payload).select("*").single();
	if (error) {
		const message = error.code === "23505" ? "这个链接名称已经被使用" : "保存内容失败";
		return json({ error: message }, { status: 400 });
	}
	return json({ entry: data }, { status: 201 });
};
