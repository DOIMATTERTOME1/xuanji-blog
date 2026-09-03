import type { APIRoute } from "astro";

import { json, readJsonBody, requireAdminApi } from "../../../../lib/admin/api";
import { demoSettings } from "../../../../lib/cms/demo-data";
import { settingInputSchema } from "../../../../lib/cms/validation";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

const allowedKeys = new Set(["profile", "appearance", "navigation", "home_modules"]);

export const GET: APIRoute = async ({ request, cookies, params }) => {
	const auth = await requireAdminApi({ request, cookies });
	if (auth.response) return auth.response;
	const key = params.key ?? "";
	if (!allowedKeys.has(key)) return json({ error: "设置项目无效" }, { status: 404 });

	if (auth.identity.previewMode) {
		const setting = demoSettings.find((item) => item.key === key) ?? {
			key,
			draft_value: {},
			published_value: {},
			default_value: {},
			version: 1,
			updated_at: new Date().toISOString(),
		};
		return json({ setting });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase.from("site_settings").select("*").eq("key", key).maybeSingle();
	if (error || !data) return json({ error: "没有找到这项设置" }, { status: 404 });
	return json({ setting: data });
};

export const PUT: APIRoute = async ({ request, cookies, params }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;
	const key = params.key ?? "";
	if (!allowedKeys.has(key)) return json({ error: "设置项目无效" }, { status: 404 });

	let input;
	try {
		input = settingInputSchema.parse(await readJsonBody(request, 200_000));
	} catch {
		return json({ error: "设置内容格式不正确" }, { status: 400 });
	}

	const value = {
		key,
		draft_value: input.draft_value,
		...(input.publish ? { published_value: input.draft_value } : {}),
		updated_at: new Date().toISOString(),
		updated_by: auth.identity.id,
	};

	if (auth.identity.previewMode) {
		return json({ setting: { ...value, published_value: input.publish ? input.draft_value : {}, default_value: {}, version: 1 }, preview: true });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data: current } = await supabase.from("site_settings").select("version, default_value, published_value").eq("key", key).maybeSingle();
	const payload = {
		...value,
		version: (current?.version ?? 0) + 1,
		default_value: current?.default_value ?? input.draft_value,
		published_value: input.publish ? input.draft_value : current?.published_value ?? input.draft_value,
	};
	const { data, error } = await supabase.from("site_settings").upsert(payload).select("*").single();
	if (error) return json({ error: "保存网站设置失败" }, { status: 400 });
	return json({ setting: data });
};
