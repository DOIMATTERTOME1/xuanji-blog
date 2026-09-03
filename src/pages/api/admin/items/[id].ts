import type { APIRoute } from "astro";

import { json, readJsonBody, requireAdminApi } from "../../../../lib/admin/api";
import { managedItemInputSchema } from "../../../../lib/cms/validation";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;
	let input;
	try {
		input = managedItemInputSchema.parse(await readJsonBody(request, 200_000));
	} catch {
		return json({ error: "请检查填写内容" }, { status: 400 });
	}
	const id = params.id ?? "";
	if (auth.identity.previewMode) return json({ item: { ...input, id, updated_at: new Date().toISOString() }, preview: true });

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase
		.from("managed_items")
		.update({ ...input, updated_at: new Date().toISOString(), updated_by: auth.identity.id })
		.eq("id", id)
		.select("*")
		.single();
	if (error) return json({ error: "保存修改失败" }, { status: 400 });
	return json({ item: data });
};

export const DELETE: APIRoute = async ({ request, cookies, params }) => {
	const auth = await requireAdminApi({ request, cookies, write: true });
	if (auth.response) return auth.response;
	if (auth.identity.previewMode) return json({ success: true, preview: true });

	const supabase = createSupabaseServerClient({ request, cookies });
	const { error } = await supabase.from("managed_items").update({ status: "archived", updated_at: new Date().toISOString(), updated_by: auth.identity.id }).eq("id", params.id ?? "");
	if (error) return json({ error: "下架失败" }, { status: 400 });
	return json({ success: true });
};
