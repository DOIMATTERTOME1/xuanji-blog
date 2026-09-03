import type { APIRoute } from "astro";

import { json, readJsonBody, requireAdminApi } from "../../../../../lib/admin/api";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, params }) => {
	const auth = await requireAdminApi({ request, cookies });
	if (auth.response) return auth.response;
	if (auth.identity.previewMode) return json({ revisions: [] });

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase
		.from("content_revisions")
		.select("id,snapshot,created_at")
		.eq("entry_id", params.id ?? "")
		.order("created_at", { ascending: false })
		.limit(20);
	if (error) return json({ error: "读取历史版本失败" }, { status: 400 });
	return json({ revisions: data ?? [] });
};

export const POST: APIRoute = async ({ request, cookies, params }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;
	const entryId = params.id ?? "";
	const body = await readJsonBody(request) as { revisionId?: number };
	if (!body.revisionId) return json({ error: "请选择要恢复的版本" }, { status: 400 });
	if (auth.identity.previewMode) return json({ success: true, preview: true });

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data: revision } = await supabase
		.from("content_revisions")
		.select("snapshot")
		.eq("id", body.revisionId)
		.eq("entry_id", entryId)
		.maybeSingle();
	if (!revision) return json({ error: "没有找到这个历史版本" }, { status: 404 });

	const { data: current } = await supabase.from("content_entries").select("*").eq("id", entryId).maybeSingle();
	if (!current) return json({ error: "没有找到这篇内容" }, { status: 404 });
	await supabase.from("content_revisions").insert({ entry_id: entryId, snapshot: current, created_by: auth.identity.id });

	const snapshot = revision.snapshot as Record<string, unknown>;
	const restored = {
		kind: snapshot.kind,
		title: snapshot.title,
		slug: snapshot.slug,
		summary: snapshot.summary,
		body: snapshot.body,
		cover_url: snapshot.cover_url,
		category: snapshot.category,
		tags: snapshot.tags,
		status: snapshot.status,
		pinned: snapshot.pinned,
		published_at: snapshot.published_at,
		updated_at: new Date().toISOString(),
		updated_by: auth.identity.id,
	};
	const { data, error } = await supabase.from("content_entries").update(restored).eq("id", entryId).select("*").single();
	if (error) return json({ error: "恢复历史版本失败" }, { status: 400 });
	return json({ entry: data });
};
