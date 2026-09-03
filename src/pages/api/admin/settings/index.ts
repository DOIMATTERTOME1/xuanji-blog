import type { APIRoute } from "astro";

import { json, requireAdminApi } from "../../../../lib/admin/api";
import { demoSettings } from "../../../../lib/cms/demo-data";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi({ request, cookies });
	if (auth.response) return auth.response;
	if (auth.identity.previewMode) return json({ settings: demoSettings });

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase.from("site_settings").select("*").order("key");
	if (error) return json({ error: "读取网站设置失败" }, { status: 500 });
	return json({ settings: data ?? [] });
};
