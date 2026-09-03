import { createBrowserClient } from "@supabase/ssr";

import {
	isSupabaseConfigured,
	supabasePublishableKey,
	supabaseUrl,
} from "./config";

export function createSupabaseBrowserClient() {
	if (!isSupabaseConfigured) {
		throw new Error("管理后台尚未连接数据服务");
	}

	return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
