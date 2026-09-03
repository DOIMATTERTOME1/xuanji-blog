import type { AstroCookies } from "astro";

import { isSupabaseConfigured } from "../supabase/config";
import { createSupabaseServerClient } from "../supabase/server";

export type AdminIdentity = {
	id: string;
	email: string;
	previewMode: boolean;
};

export async function getAdminIdentity({
	request,
	cookies,
}: {
	request: Request;
	cookies: AstroCookies;
}): Promise<AdminIdentity | null> {
	if (!isSupabaseConfigured) {
		if (import.meta.env.DEV) {
			return {
				id: "local-preview",
				email: "本地预览",
				previewMode: true,
			};
		}
		return null;
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase.auth.getUser();
	if (error || !data.user) return null;

	const { data: admin } = await supabase
		.from("admin_users")
		.select("user_id")
		.eq("user_id", data.user.id)
		.maybeSingle();

	if (!admin) return null;

	return {
		id: data.user.id,
		email: data.user.email ?? "网站管理员",
		previewMode: false,
	};
}

export function isSameOriginRequest(request: Request) {
	const origin = request.headers.get("Origin");
	if (!origin) return false;
	return origin === new URL(request.url).origin;
}
