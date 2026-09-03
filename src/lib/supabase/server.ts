import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import {
	isSupabaseConfigured,
	supabasePublishableKey,
	supabaseUrl,
} from "./config";

export function createSupabaseServerClient({
	request,
	cookies,
}: {
	request: Request;
	cookies: AstroCookies;
}) {
	if (!isSupabaseConfigured) {
		throw new Error("管理后台尚未连接数据服务");
	}

	return createServerClient(supabaseUrl, supabasePublishableKey, {
		cookies: {
			getAll() {
				return parseCookieHeader(request.headers.get("Cookie") ?? "");
			},
			setAll(cookiesToSet) {
				for (const { name, value, options } of cookiesToSet) {
					cookies.set(name, value, {
						...options,
						path: options?.path ?? "/",
					});
				}
			},
		},
	});
}
