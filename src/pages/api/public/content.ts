import type { APIRoute } from "astro";

import { demoContent } from "../../../lib/cms/demo-data";
import { createSupabasePublicClient } from "../../../lib/supabase/public";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const kind = url.searchParams.get("kind");
	const slug = url.searchParams.get("slug");
	const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 30, 1), 100);
	const supabase = createSupabasePublicClient();

	if (!supabase) {
		let entries = demoContent.filter((entry) => entry.status === "published");
		if (kind) entries = entries.filter((entry) => entry.kind === kind);
		if (slug) entries = entries.filter((entry) => entry.slug === slug);
		return Response.json({ entries: entries.slice(0, limit), preview: true });
	}

	let query = supabase
		.from("content_entries")
		.select("id,kind,title,slug,summary,body,cover_url,category,tags,pinned,published_at,updated_at")
		.eq("status", "published")
		.order("pinned", { ascending: false })
		.order("published_at", { ascending: false })
		.limit(limit);
	if (kind) query = query.eq("kind", kind);
	if (slug) query = query.eq("slug", slug);
	const { data, error } = await query;
	if (error) return Response.json({ error: "暂时无法读取公开内容" }, { status: 500 });
	return Response.json({ entries: data ?? [] });
};
