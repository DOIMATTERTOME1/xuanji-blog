import type { ProfileConfig } from "../types/config";

// 个人资料配置
export const profileConfig: ProfileConfig = {
	avatar: "/assets/images/xuanji-avatar.svg", // 以 '/' 开头时相对于 /public 目录
	name: "Xuanji",
	bio: "记录学习、科研、技术与生活",
	typewriter: {
		enable: true, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	// 尚未提供真实社交主页，先保持为空，避免展示模板作者账号。
	links: [],
};
