import type { APIRoute } from "astro";

import { demoManagedItems } from "../../../lib/cms/demo-data";
import { createSupabasePublicClient } from "../../../lib/supabase/public";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const kind = url.searchParams.get("kind");
	const supabase = createSupabasePublicClient();
	if (!supabase) {
		const items = demoManagedItems.filter((item) => item.status === "published" && (!kind || item.kind === kind));
		return Response.json({ items, preview: true });
	}

	let query = supabase
		.from("managed_items")
		.select("id,kind,title,data,sort_order,updated_at")
		.eq("status", "published")
		.order("sort_order", { ascending: true })
		.order("updated_at", { ascending: false });
	if (kind) query = query.eq("kind", kind);
	const { data, error } = await query;
	if (error) return Response.json({ error: "暂时无法读取公开模块" }, { status: 500 });
	return Response.json({ items: data ?? [] });
};
