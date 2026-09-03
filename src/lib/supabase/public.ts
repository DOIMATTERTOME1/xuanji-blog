import { createClient } from "@supabase/supabase-js";

import {
	isSupabaseConfigured,
	supabasePublishableKey,
	supabaseUrl,
} from "./config";

export function createSupabasePublicClient() {
	if (!isSupabaseConfigured) return null;
	return createClient(supabaseUrl, supabasePublishableKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}
