import type { AstroCookies } from "astro";

import { getAdminIdentity, isSameOriginRequest } from "./auth";

export function json(data: unknown, init?: ResponseInit) {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
			...(init?.headers ?? {}),
		},
	});
}

export async function requireAdminApi({
	request,
	cookies,
	write = false,
}: {
	request: Request;
	cookies: AstroCookies;
	write?: boolean;
}) {
	if (write && !isSameOriginRequest(request)) {
		return { identity: null, response: json({ error: "请求来源无效" }, { status: 403 }) };
	}

	const identity = await getAdminIdentity({ request, cookies });
	if (!identity) {
		return { identity: null, response: json({ error: "请先登录" }, { status: 401 }) };
	}

	return { identity, response: null };
}

export async function readJsonBody(request: Request, maxBytes = 600_000) {
	const contentLength = Number(request.headers.get("Content-Length") ?? 0);
	if (contentLength > maxBytes) throw new Error("请求内容过大");
	return request.json();
}
