import type { APIRoute } from "astro";

import { isSameOriginRequest } from "../../../../lib/admin/auth";
import { isSupabaseConfigured } from "../../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const prerender = false;

function redirect(request: Request, path: string) {
	return Response.redirect(new URL(path, request.url), 303);
}

export const POST: APIRoute = async ({ request, cookies }) => {
	if (!isSameOriginRequest(request)) {
		return redirect(request, "/admin/login/?error=request");
	}

	if (!isSupabaseConfigured) {
		return redirect(request, "/admin/login/");
	}

	const form = await request.formData();
	const email = String(form.get("email") ?? "").trim().toLowerCase();
	const password = String(form.get("password") ?? "");
	if (!email || password.length < 8) {
		return redirect(request, "/admin/login/?error=invalid");
	}

	const supabase = createSupabaseServerClient({ request, cookies });
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error || !data.user) {
		return redirect(request, "/admin/login/?error=invalid");
	}

	const { data: admin } = await supabase
		.from("admin_users")
		.select("user_id")
		.eq("user_id", data.user.id)
		.maybeSingle();

	if (!admin) {
		await supabase.auth.signOut();
		return redirect(request, "/admin/login/?error=forbidden");
	}

	return redirect(request, "/admin/");
};
