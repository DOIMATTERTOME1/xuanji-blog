export type ContentKind = "technical" | "study" | "diary";
export type PublishStatus = "draft" | "published" | "archived";

export type ContentEntry = {
	id: string;
	kind: ContentKind;
	title: string;
	slug: string;
	summary: string;
	body: string;
	cover_url: string | null;
	category: string;
	tags: string[];
	status: PublishStatus;
	pinned: boolean;
	published_at: string | null;
	created_at: string;
	updated_at: string;
};

export type ManagedItemKind = "project" | "announcement" | "anime";

export type ManagedItem = {
	id: string;
	kind: ManagedItemKind;
	title: string;
	data: Record<string, unknown>;
	status: PublishStatus;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type SiteSetting = {
	key: string;
	draft_value: Record<string, unknown>;
	published_value: Record<string, unknown>;
	default_value: Record<string, unknown>;
	version: number;
	updated_at: string;
};
