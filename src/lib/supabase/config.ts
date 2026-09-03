export const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim() ?? "";
export const supabasePublishableKey =
	import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(
	supabaseUrl && supabasePublishableKey,
);
