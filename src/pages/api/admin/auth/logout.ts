import type { APIRoute } from "astro";

import { isSameOriginRequest } from "../../../../lib/admin/auth";
import { isSupabaseConfigured } from "../../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	if (!isSameOriginRequest(request)) {
		return new Response("Invalid request", { status: 403 });
	}

	if (isSupabaseConfigured) {
		const supabase = createSupabaseServerClient({ request, cookies });
		await supabase.auth.signOut();
	}

	return Response.redirect(new URL("/admin/login/", request.url), 303);
};
