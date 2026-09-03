import type { APIRoute } from "astro";

import { json, readJsonBody, requireAdminApi } from "../../../../lib/admin/api";
import { demoManagedItems } from "../../../../lib/cms/demo-data";
import { managedItemInputSchema } from "../../../../lib/cms/validation";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
	const auth = await requireAdminApi({ request, cookies });
	if (auth.response) return auth.response;
	const kind = url.searchParams.get("kind");

	if (auth.identity.previewMode) {
		return json({ items: kind ? demoManagedItems.filter((item) => item.kind === kind) : demoManagedItems });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	let query = supabase.from("managed_items").select("*").order("sort_order").order("updated_at", { ascending: false });
	if (kind) query = query.eq("kind", kind);
	const { data, error } = await query;
	if (error) return json({ error: "读取管理项目失败" }, { status: 500 });
	return json({ items: data ?? [] });
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;

	let input;
	try {
		input = managedItemInputSchema.parse(await readJsonBody(request, 200_000));
	} catch {
		return json({ error: "请检查填写内容" }, { status: 400 });
	}

	const value = {
		...input,
		created_by: auth.identity.id,
		updated_by: auth.identity.id,
	};
	if (auth.identity.previewMode) {
		return json({ item: { ...value, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, preview: true }, { status: 201 });
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase.from("managed_items").insert(value).select("*").single();
	if (error) return json({ error: "保存失败" }, { status: 400 });
	return json({ item: data }, { status: 201 });
};
