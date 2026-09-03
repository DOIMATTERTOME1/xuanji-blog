/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly PUBLIC_SUPABASE_URL?: string;
	readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module "sharp" {
	export default function sharp(input?: Buffer | string): import("sharp").Sharp;
}
