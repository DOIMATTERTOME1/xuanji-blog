import type { APIRoute } from "astro";

import { demoSettings } from "../../../lib/cms/demo-data";
import { createSupabasePublicClient } from "../../../lib/supabase/public";

export const prerender = false;

export const GET: APIRoute = async () => {
	const supabase = createSupabasePublicClient();
	if (!supabase) {
		return Response.json({
			settings: Object.fromEntries(
				demoSettings.map((setting) => [setting.key, setting.published_value]),
			),
			preview: true,
		});
	}

	const { data, error } = await supabase.rpc("get_published_site_settings");
	if (error) return Response.json({ error: "暂时无法读取网站设置" }, { status: 500 });
	return Response.json({
		settings: Object.fromEntries((data ?? []).map((row: { key: string; value: unknown }) => [row.key, row.value])),
	});
};
