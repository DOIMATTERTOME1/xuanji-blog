import { z } from "astro/zod";

export const contentInputSchema = z.object({
	kind: z.enum(["technical", "study", "diary"]),
	title: z.string().trim().min(1).max(120),
	slug: z
		.string()
		.trim()
		.min(1)
		.max(160)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	summary: z.string().trim().max(320).default(""),
	body: z.string().max(500_000).default(""),
	cover_url: z.string().trim().max(2_000).nullable().optional(),
	category: z.string().trim().max(80).default(""),
	tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
	status: z.enum(["draft", "published", "archived"]).default("draft"),
	pinned: z.boolean().default(false),
	published_at: z.iso.datetime().nullable().optional(),
});

export const managedItemInputSchema = z.object({
	kind: z.enum(["project", "announcement", "anime"]),
	title: z.string().trim().min(1).max(120),
	data: z.record(z.string(), z.unknown()).default({}),
	status: z.enum(["draft", "published", "archived"]).default("draft"),
	sort_order: z.number().int().min(0).max(10_000).default(0),
});

export const settingInputSchema = z.object({
	draft_value: z.record(z.string(), z.unknown()),
	publish: z.boolean().default(false),
});
